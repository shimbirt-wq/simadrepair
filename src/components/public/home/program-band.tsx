import { Star } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { PhotoBand } from "@/components/public/photo-band";
import { formatRating } from "@/lib/reports/format";
import type { HomeNumbers } from "@/lib/site/home-numbers";
import teamAtDesk from "../../../../public/images/program/team-at-desk.jpg";

/** The program story on a deep-green photo band, with the live event numbers when there are any (ticket 25). */
export function ProgramStoryWithNumbers({ numbers }: { numbers: HomeNumbers | null }) {
  return (
    <section aria-labelledby="band-title" className="mx-auto max-w-content px-4 py-14 sm:px-6 sm:py-20">
      <PhotoBand photo={teamAtDesk} position="60% 40%">
        <h2 id="band-title" className="text-h1 text-white">
          Students fixing laptops for students
        </h2>
        <p className="text-body text-green-100">Faculty of Computing volunteers run the desk, repair every device and hand it back.</p>
        {numbers ? <Numbers numbers={numbers} /> : null}
      </PhotoBand>
    </section>
  );
}

function Numbers({ numbers }: { numbers: HomeNumbers }) {
  const items = [
    { label: "registered", value: numbers.registered.toLocaleString("en") },
    { label: "repaired", value: numbers.repaired.toLocaleString("en") },
    ...(numbers.averageRating !== null ? [{ label: `average rating from ${numbers.ratings} ${numbers.ratings === 1 ? "student" : "students"}`, value: formatRating(numbers.averageRating), star: true }] : []),
  ];
  return (
    <div className="mt-4 flex flex-col gap-3">
      <Eyebrow tone="inverse">{numbers.running ? "So far this event" : numbers.eventName}</Eyebrow>
      <dl className="flex flex-wrap gap-x-10 gap-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <dt className="order-2 text-caption text-green-100">{item.label}</dt>
            <dd className="order-1 flex items-center gap-1.5 font-mono text-h2 tabular-nums text-white">
              {"star" in item ? <Star className="h-5 w-5 fill-warning text-warning" strokeWidth={1.5} aria-hidden /> : null}
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
