import type { PublicUser } from "@/lib/auth/public-user";
import type { UploadIntentInput } from "@/lib/validations/uploads";
import { validateUploadIntent } from "@/lib/validations/uploads";

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

export function createRepairPhotoUploadIntent(user: PublicUser, input: UploadIntentInput) {
  const validation = validateUploadIntent(input);

  if (!validation.ok) {
    return validation;
  }

  const objectPath = `repair-ticket-photos/${user.id}/${crypto.randomUUID()}-${sanitizeFileName(input.fileName)}`;
  const publicBaseUrl = process.env.UPLOAD_PUBLIC_BASE_URL?.replace(/\/$/, "");

  return {
    ok: true as const,
    objectPath,
    photoUrl: publicBaseUrl ? `${publicBaseUrl}/${objectPath}` : objectPath,
    maxSizeMb: Number.parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? "5", 10),
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  };
}
