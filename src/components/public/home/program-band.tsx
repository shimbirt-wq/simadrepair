import Image from "next/image";
import { formatRating } from "@/lib/reports/format";
import type { HomeNumbers } from "@/lib/site/home-numbers";
import teamAtDesk from "../../../../public/images/program/team-at-desk.jpg";

/** Deep-green band over a program photo, carrying the live numbers when there are any. */
export function ProgramBand({ numbers }: { numbers: HomeNumbers | null }) {
  const items = numbers
    ? [
        { label: "registered", value: numbers.registered.toLocaleString("en") },
        { label: "repaired", value: numbers.repaired.toLocaleString("en") },
        ...(numbers.averageRating !== null ? [{ label: `average rating from ${numbers.ratings} ${numbers.ratings === 1 ? "student" : "students"}`, value: formatRating(numbers.averageRating) }] : []),
      ]
    : [];

  return (
    <section aria-labelledby="band-title" className="mx-auto max-w-content px-4 py-14 sm:px-6 sm:py-20">
      <div className="relative overflow-hidden rounded-2xl">
        <Image src={teamAtDesk} alt="" fill placeholder="blur" sizes="(min-width: 1200px) 1150px, 100vw" className="object-cover object-[60%_40%]" />
        <div className="photo-overlay-deep absolute inset-0" />
        <div className="relative flex max-w-2xl flex-col gap-3 px-6 py-12 sm:px-12 sm:py-14">
          <h2 id="band-title" className="text-h1 text-white">
            Students fixing laptops for students
          </h2>
          <p className="text-[17px] leading-relaxed text-green-100">Faculty of Computing volunteers run the desk, repair every device and hand it back.</p>
          {items.length ? (
            <div className="mt-5 flex flex-col gap-3">
              <p className="text-caption font-medium uppercase tracking-[0.08em] text-green-200">{numbers!.running ? "So far this event" : numbers!.eventName}</p>
              <dl className="flex flex-wrap gap-x-10 gap-y-4">
                {items.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <dt className="order-2 text-caption text-green-100">{item.label}</dt>
                    <dd className="order-1 font-mono text-h1 tabular-nums text-white">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
