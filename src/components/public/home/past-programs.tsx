import Image, { type StaticImageData } from "next/image";
import { cn } from "@/components/ui";
import desk from "../../../../public/images/program/desk.jpg";
import ramUpgrade from "../../../../public/images/program/ram-upgrade.jpg";
import teamAtDesk from "../../../../public/images/program/team-at-desk.jpg";
import { HomeSection } from "./home-sections";

/** Real photos from earlier programs on SIMAD's Main Campus (no stock faces). */
const PHOTOS: Array<{ src: StaticImageData; alt: string; caption: string; large?: boolean }> = [
  { src: desk, alt: "Student volunteers checking laptops at the desk while students wait", caption: "Drop-off and diagnosis at the desk", large: true },
  { src: ramUpgrade, alt: "Close-up of a volunteer fitting a RAM module into an open laptop", caption: "RAM upgrade" },
  { src: teamAtDesk, alt: "Volunteers and Faculty of Computing staff working together at the desk", caption: "Volunteers and faculty at work" },
];

export function PastPrograms() {
  return (
    <HomeSection id="past" eyebrow="From past programs" title="Moments from the desk" tone="muted">
      <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
        {PHOTOS.map((photo) => (
          <figure key={photo.caption} className={cn("group relative overflow-hidden rounded-xl", photo.large && "lg:col-span-2 lg:row-span-2")}>
            <Image
              src={photo.src}
              alt={photo.alt}
              placeholder="blur"
              sizes={photo.large ? "(min-width: 1024px) 780px, 100vw" : "(min-width: 1024px) 380px, 100vw"}
              className="aspect-[3/2] h-full w-full object-cover saturate-[.85] transition duration-base ease-brand group-hover:saturate-100"
            />
            {/* Brand tint; fades on hover to show the photo in full colour. */}
            <span className="absolute inset-0 bg-accent opacity-20 mix-blend-color transition-opacity duration-base ease-brand group-hover:opacity-0" aria-hidden />
            <span className="photo-caption-fade absolute inset-0" aria-hidden />
            <figcaption className="absolute inset-x-0 bottom-0 px-4 pb-3 text-small font-semibold text-white">{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
    </HomeSection>
  );
}
