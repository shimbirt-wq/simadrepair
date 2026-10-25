import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

/** A program photo under the deep-green brand overlay, with white content on the left. */
export function PhotoBand({ photo, alt = "", position = "center", priority, children }: { photo: StaticImageData; alt?: string; position?: string; priority?: boolean; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Mostly covered by the overlay, so a lower quality is enough. */}
      <Image src={photo} alt={alt} fill priority={priority} placeholder="blur" quality={60} sizes="(min-width: 1200px) 1150px, 100vw" className="object-cover" style={{ objectPosition: position }} />
      <div className="photo-overlay-deep absolute inset-0" />
      <div className="relative flex max-w-2xl flex-col gap-4 px-6 py-12 sm:px-12 sm:py-16">{children}</div>
    </div>
  );
}
