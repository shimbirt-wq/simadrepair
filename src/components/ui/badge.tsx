import {
  CircleCheck,
  CircleSlash,
  Flame,
  HandHelping,
  Inbox,
  MessageCircleWarning,
  PackageCheck,
  PackageSearch,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { getStatusDisplay, type StatusIcon, type Tone } from "@/lib/tickets/status-display";
import { cn } from "./cn";

const toneClasses: Record<Tone | "error", string> = {
  neutral: "bg-neutral-soft text-neutral-text",
  muted: "bg-neutral-soft text-ink-muted",
  info: "bg-info-soft text-info-text",
  accent: "bg-accent-soft text-ink-accent",
  warning: "bg-warning-soft text-warning-text",
  success: "bg-success-soft text-success-text",
  error: "bg-error-soft text-error-text",
};

const icons: Record<StatusIcon, LucideIcon> = {
  inbox: Inbox,
  "package-check": PackageCheck,
  wrench: Wrench,
  "package-search": PackageSearch,
  "message-circle-warning": MessageCircleWarning,
  "circle-check": CircleCheck,
  "hand-helping": HandHelping,
  "circle-slash": CircleSlash,
  x: X,
};

type BadgeProps = { tone?: Tone | "error"; icon?: ReactNode; children: ReactNode; className?: string };

export function Badge({ tone = "neutral", icon, children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-caption", toneClasses[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function StatusBadge({ status, audience = "staff", className }: { status: string; audience?: "staff" | "public"; className?: string }) {
  const display = getStatusDisplay(status);
  const Icon = icons[display.icon];

  return (
    <Badge tone={display.tone} icon={<Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />} className={cn(status === "CANCELLED" && "line-through", className)}>
      {audience === "public" ? display.publicLabel : display.label}
    </Badge>
  );
}

export function UrgentBadge() {
  return (
    <Badge tone="warning" icon={<Flame className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}>
      Urgent
    </Badge>
  );
}
