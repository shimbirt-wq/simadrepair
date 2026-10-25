/** One ticket lifecycle — see docs/platform/spec.md. */
export const TICKET_STATUSES = [
  "SUBMITTED",
  "RECEIVED",
  "IN_REPAIR",
  "WAITING_FOR_PARTS",
  "ACTION_NEEDED",
  "CANNOT_REPAIR_PROPOSED",
  "CANNOT_BE_REPAIRED",
  "READY_FOR_PICKUP",
  "COLLECTED",
  "CANCELLED",
] as const;

export type TicketStatusName = (typeof TICKET_STATUSES)[number];

export type Tone = "neutral" | "info" | "accent" | "warning" | "success" | "muted";

export type StatusIcon =
  | "inbox"
  | "package-check"
  | "wrench"
  | "package-search"
  | "message-circle-warning"
  | "circle-check"
  | "hand-helping"
  | "circle-slash"
  | "x";

export type StatusDisplay = {
  /** Label staff see. */
  label: string;
  /** Label requesters see on the public tracking page. */
  publicLabel: string;
  tone: Tone;
  icon: StatusIcon;
};

export const STATUS_DISPLAY: Record<TicketStatusName, StatusDisplay> = {
  SUBMITTED: { label: "Submitted", publicLabel: "Submitted", tone: "neutral", icon: "inbox" },
  RECEIVED: { label: "Received", publicLabel: "Received", tone: "info", icon: "package-check" },
  IN_REPAIR: { label: "In repair", publicLabel: "In repair", tone: "accent", icon: "wrench" },
  WAITING_FOR_PARTS: { label: "Waiting for parts", publicLabel: "Waiting for parts", tone: "warning", icon: "package-search" },
  ACTION_NEEDED: { label: "Action needed", publicLabel: "Action needed from you", tone: "warning", icon: "message-circle-warning" },
  CANNOT_REPAIR_PROPOSED: { label: "Cannot repair — to confirm", publicLabel: "In repair", tone: "warning", icon: "circle-slash" },
  CANNOT_BE_REPAIRED: { label: "Cannot be repaired", publicLabel: "Cannot be repaired", tone: "neutral", icon: "circle-slash" },
  READY_FOR_PICKUP: { label: "Ready for pickup", publicLabel: "Ready for pickup", tone: "success", icon: "circle-check" },
  COLLECTED: { label: "Collected", publicLabel: "Collected", tone: "neutral", icon: "hand-helping" },
  CANCELLED: { label: "Cancelled", publicLabel: "Cancelled", tone: "muted", icon: "x" },
};

export function getStatusDisplay(status: string): StatusDisplay {
  return STATUS_DISPLAY[status as TicketStatusName] ?? { label: status, publicLabel: status, tone: "neutral", icon: "inbox" };
}

export const TICKET_STATUS_LABELS: Record<TicketStatusName, string> = Object.fromEntries(
  TICKET_STATUSES.map((status) => [status, STATUS_DISPLAY[status].label]),
) as Record<TicketStatusName, string>;
