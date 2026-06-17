import type { PublicUser } from "@/lib/auth/public-user";
import type { UploadIntentInput } from "@/lib/validations/uploads";
import { uploadIntentSchema, validateUploadIntent } from "@/lib/validations/uploads";

function sanitizeFileName(fileName: string) {
  const extension = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ".jpg";
  const baseName = fileName
    .slice(0, Math.max(0, fileName.length - extension.length))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return `${baseName || "repair-photo"}${extension}`;
}

function getUploadBucket() {
  return process.env.UPLOAD_BUCKET ?? "repair-ticket-photos";
}

export function createRepairPhotoUploadIntent(user: PublicUser, input: UploadIntentInput) {
  const validation = validateUploadIntent(input);

  if (!validation.ok) {
    return validation;
  }

  const bucket = getUploadBucket();
  const objectPath = `${bucket}/${user.id}/${crypto.randomUUID()}-${sanitizeFileName(input.fileName)}`;
  const publicBaseUrl = process.env.UPLOAD_PUBLIC_BASE_URL?.replace(/\/$/, "");

  return {
    ok: true as const,
    objectPath,
    photoUrl: publicBaseUrl ? `${publicBaseUrl}/${objectPath}` : objectPath,
    maxSizeMb: Number.parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? "5", 10),
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  };
}

function getStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = getUploadBucket();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    bucket,
  };
}

export async function uploadRepairPhotoFile(user: PublicUser, file: File) {
  const parsedInput = uploadIntentSchema.safeParse({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });

  if (!parsedInput.success) {
    return {
      ok: false as const,
      message: "Only JPG, PNG, and WebP image uploads are allowed.",
    };
  }

  const intent = createRepairPhotoUploadIntent(user, parsedInput.data);

  if (!intent.ok) {
    return intent;
  }

  const storage = getStorageConfig();

  if (!storage) {
    return {
      ok: false as const,
      status: 503 as const,
      message: "Photo storage is not configured.",
    };
  }

  const objectPath = intent.objectPath.replace(`${storage.bucket}/`, "");
  const uploadUrl = `${storage.supabaseUrl}/storage/v1/object/${storage.bucket}/${encodeURI(objectPath)}`;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${storage.serviceRoleKey}`,
      apikey: storage.serviceRoleKey,
      "content-type": file.type,
      "x-upsert": "false",
    },
    body: await file.arrayBuffer(),
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: 502 as const,
      message: "Photo storage upload failed.",
    };
  }

  return {
    ok: true as const,
    objectPath: intent.objectPath,
    photoUrl: intent.photoUrl,
    maxSizeMb: intent.maxSizeMb,
    allowedMimeTypes: intent.allowedMimeTypes,
  };
}
