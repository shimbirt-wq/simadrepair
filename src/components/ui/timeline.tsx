import type { ReactNode } from "react";

export type TimelineItem = { id: string; title: ReactNode; detail?: ReactNode; at: Date | string };

const formatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Mogadishu" });

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative flex flex-col gap-4 border-l border-line pl-5">
      {items.map((item, index) => (
        <li key={item.id} className="relative">
          <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ${index === items.length - 1 ? "bg-accent" : "bg-n-300"}`} aria-hidden />
          <p className="text-small font-semibold text-ink">{item.title}</p>
          {item.detail ? <p className="text-small text-ink-secondary">{item.detail}</p> : null}
          <p className="font-mono text-caption text-ink-muted">{formatter.format(new Date(item.at))}</p>
        </li>
      ))}
    </ol>
  );
}
