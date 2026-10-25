import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

type CardProps = ComponentProps<"div"> & { interactive?: boolean; focal?: boolean };

export function Card({ interactive, focal, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface shadow-sm",
        interactive && "cursor-pointer transition-shadow duration-base ease-brand hover:shadow-md",
        focal && "border-green-300 shadow-glow",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ eyebrow, title, action, className }: { eyebrow?: ReactNode; title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h3 className="text-h3 text-ink">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted", className)}>{children}</p>;
}
