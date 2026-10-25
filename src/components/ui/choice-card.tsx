import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

type ChoiceCardProps = Omit<ComponentProps<"input">, "type"> & {
  type?: "radio" | "checkbox";
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
};

/** A radio or checkbox rendered as a selectable card. */
export function ChoiceCard({ type = "radio", label, description, icon, className, ...props }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 transition-colors duration-fast",
        "hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:shadow-focus",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    >
      <input type={type} className="peer sr-only" {...props} />
      {icon ? <span className="text-ink-secondary group-has-[:checked]:text-accent">{icon}</span> : null}
      <span className="flex min-w-0 flex-col">
        <span className="text-body font-medium text-ink">{label}</span>
        {description ? <span className="text-caption text-ink-muted">{description}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "ml-auto flex h-5 w-5 shrink-0 items-center justify-center border border-line-strong bg-surface transition-colors",
          type === "radio" ? "rounded-full" : "rounded-xs",
          "peer-checked:border-accent peer-checked:bg-accent",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    </label>
  );
}

export function ChoiceGroup({ legend, children, columns = 2, error }: { legend: ReactNode; children: ReactNode; columns?: 1 | 2 | 3; error?: string | null }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-small font-semibold text-ink">{legend}</legend>
      <div className={cn("grid gap-2", columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>{children}</div>
      {error ? (
        <span className="text-caption text-error-text" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
