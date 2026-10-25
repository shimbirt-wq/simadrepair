import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

const control =
  "w-full rounded-md border border-line bg-surface px-3 text-body text-ink placeholder:text-ink-muted " +
  "transition-shadow duration-fast hover:border-line-strong focus:border-accent focus:outline-none focus:shadow-focus " +
  "disabled:bg-muted disabled:text-ink-disabled aria-[invalid=true]:border-error";

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-small font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1 font-normal text-ink-muted">optional</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-caption text-error-text" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-caption text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-28 py-2.5", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23515852' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
}
