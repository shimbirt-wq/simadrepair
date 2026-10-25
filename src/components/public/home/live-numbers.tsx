import { Star } from "lucide-react";
import type { HomeNumbers } from "@/lib/site/home-numbers";
import { formatRating } from "@/lib/reports/format";

/** Real event numbers; the caller renders nothing when there are none. */
export function LiveNumbers({ numbers }: { numbers: HomeNumbers }) {
  const items = [
    { label: "registered", value: numbers.registered.toLocaleString("en") },
    { label: "repaired", value: numbers.repaired.toLocaleString("en") },
    ...(numbers.averageRating !== null ? [{ label: `average rating from ${numbers.ratings} ${numbers.ratings === 1 ? "student" : "students"}`, value: formatRating(numbers.averageRating), star: true }] : []),
  ];
  return (
    <section aria-labelledby="numbers-title" className="border-b border-line bg-app">
      <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:gap-10 sm:px-6">
        <h2 id="numbers-title" className="text-small font-semibold text-ink-secondary sm:w-48">
          {numbers.running ? "So far this event" : numbers.eventName}
        </h2>
        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col">
              <dt className="order-2 text-caption text-ink-muted">{item.label}</dt>
              <dd className="order-1 flex items-center gap-1.5 font-mono text-h2 tabular-nums text-ink">
                {"star" in item ? <Star className="h-5 w-5 fill-warning text-warning" strokeWidth={1.5} aria-hidden /> : null}
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
