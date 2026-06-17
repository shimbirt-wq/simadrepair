import { z } from "zod";

export const ALLOWED_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_UPLOAD_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

function getUploadMaxSizeBytes() {
  const configured = Number.parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? "5", 10);
  const maxSizeMb = Number.isFinite(configured) && configured > 0 ? configured : 5;

  return maxSizeMb * 1024 * 1024;
}

export const uploadIntentSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(180, "File name is too long"),
  fileSize: z.coerce.number().int().positive("File size must be positive"),
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
});

export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;

export function validateUploadIntent(input: UploadIntentInput) {
  const lowerName = input.fileName.toLowerCase();
  const hasAllowedExtension = ALLOWED_UPLOAD_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

  if (!hasAllowedExtension) {
    return {
      ok: false as const,
      message: "Only JPG, PNG, and WebP image uploads are allowed.",
    };
  }

  if (input.fileSize > getUploadMaxSizeBytes()) {
    return {
      ok: false as const,
      message: `Image uploads must be ${process.env.UPLOAD_MAX_SIZE_MB ?? "5"} MB or smaller.`,
    };
  }

  return {
    ok: true as const,
  };
}
