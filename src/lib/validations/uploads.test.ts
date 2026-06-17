import { describe, expect, it, vi } from "vitest";
import { uploadIntentSchema, validateUploadIntent } from "./uploads";

describe("upload validation", () => {
  it("accepts valid image metadata", () => {
    const parsed = uploadIntentSchema.parse({
      fileName: "device-photo.png",
      fileSize: 1024,
      mimeType: "image/png",
    });

    expect(validateUploadIntent(parsed)).toEqual({ ok: true });
  });

  it("rejects oversized images", () => {
    vi.stubEnv("UPLOAD_MAX_SIZE_MB", "1");

    const result = validateUploadIntent({
      fileName: "device-photo.png",
      fileSize: 2 * 1024 * 1024,
      mimeType: "image/png",
    });

    expect(result).toEqual({
      ok: false,
      message: "Image uploads must be 1 MB or smaller.",
    });
    vi.unstubAllEnvs();
  });

  it("rejects invalid MIME types and extensions", () => {
    expect(() =>
      uploadIntentSchema.parse({
        fileName: "script.js",
        fileSize: 1024,
        mimeType: "application/javascript",
      }),
    ).toThrow();

    expect(
      validateUploadIntent({
        fileName: "script.js",
        fileSize: 1024,
        mimeType: "image/png",
      }),
    ).toEqual({
      ok: false,
      message: "Only JPG, PNG, and WebP image uploads are allowed.",
    });
  });
});
