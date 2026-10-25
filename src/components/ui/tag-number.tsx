import { cn } from "./cn";

/** The hand-written sticker number, e.g. #147. */
export function formatTagNumber(tag: number) {
  return `#${tag.toString().padStart(3, "0")}`;
}

export function TagNumber({ tag, size = "md", className }: { tag: number | null | undefined; size?: "sm" | "md" | "lg"; className?: string }) {
  if (tag == null) return <span className={cn("font-mono text-ink-disabled", className)}>—</span>;
  return (
    <span
      className={cn(
        "font-mono font-semibold tabular-nums tracking-tight text-ink",
        size === "sm" && "text-[15px]",
        size === "md" && "text-[22px]",
        size === "lg" && "text-[28px]",
        className,
      )}
    >
      {formatTagNumber(tag)}
    </span>
  );
}
