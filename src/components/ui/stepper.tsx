import { Check } from "lucide-react";
import { cn } from "./cn";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-caption tabular-nums",
                done && "bg-accent text-white",
                active && "border-2 border-accent text-ink-accent",
                !done && !active && "border border-line-strong text-ink-muted",
              )}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
            </span>
            <span className={cn("hidden text-small sm:inline", active ? "font-semibold text-ink" : "text-ink-muted")}>{step}</span>
            {index < steps.length - 1 ? <span className={cn("h-px flex-1", done ? "bg-accent" : "bg-line")} /> : null}
          </li>
        );
      })}
    </ol>
  );
}
