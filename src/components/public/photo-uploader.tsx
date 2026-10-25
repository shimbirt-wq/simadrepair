"use client";

import { Camera, LoaderCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/components/ui";

export type UploadedPhoto = { token: string; preview: string };

const MAX_EDGE = 1600;

/** Shrinks a photo in the browser so uploads stay small on mobile data. */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.82));
}

export function PhotoUploader({ photos, onChange, max, endpoint = "/api/public/photos" }: { photos: UploadedPhoto[]; onChange: (photos: UploadedPhoto[]) => void; max: number; endpoint?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    let next = [...photos];
    for (const file of Array.from(files).slice(0, max - photos.length)) {
      const body = new FormData();
      body.append("photo", await resize(file), "photo.jpg");
      const response = await fetch(endpoint, { method: "POST", body }).catch(() => null);
      const payload = (await response?.json().catch(() => null)) as { photo?: { token: string }; error?: string } | null;
      if (!response?.ok || !payload?.photo) {
        setError(payload?.error ?? "Upload failed. Try again.");
        continue;
      }
      next = [...next, { token: payload.photo.token, preview: URL.createObjectURL(file) }];
      onChange(next);
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.token} className="relative aspect-square overflow-hidden rounded-md border border-line bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={photo.preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((p) => p.token !== photo.token))}
              className="absolute right-1.5 top-1.5 rounded-full bg-n-950/60 p-1 text-white hover:bg-n-950/80"
              aria-label={`Remove photo ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        ))}
        {photos.length < max ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-line-strong text-ink-secondary transition-colors",
              "hover:border-accent hover:bg-accent-soft hover:text-ink-accent focus-visible:shadow-focus focus-visible:outline-none disabled:opacity-60",
            )}
          >
            {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" strokeWidth={1.75} />}
            <span className="text-caption">{busy ? "Uploading" : "Add photo"}</span>
          </button>
        ) : null}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => add(event.target.files)} />
      {error ? (
        <p className="text-caption text-error-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
