import type { ReactNode } from "react";
import { cn } from "./cn";

export function BoardColumn({ title, count, children, className }: { title: ReactNode; count: number; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-[236px] max-w-[320px] flex-1 flex-col rounded-lg bg-muted p-2", className)} aria-label={typeof title === "string" ? title : undefined}>
      <header className="flex items-center justify-between px-2 pb-2 pt-1">
        <h2 className="text-small font-semibold text-ink">{title}</h2>
        <span className="font-mono text-caption tabular-nums text-ink-muted">{count}</span>
      </header>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
