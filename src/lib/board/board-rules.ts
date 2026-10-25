import type { TicketStatus } from "@prisma/client";
import { localDay } from "@/lib/events/event-window";

export const BOARD_COLUMNS = [
  { key: "DROP_OFF", title: "Waiting drop-off" },
  { key: "TO_ASSIGN", title: "To assign" },
  { key: "IN_REPAIR", title: "In repair" },
  { key: "BLOCKED", title: "Blocked" },
  { key: "READY", title: "Ready for pickup" },
  { key: "COLLECTED_TODAY", title: "Collected today" },
] as const;

export type BoardColumnKey = (typeof BOARD_COLUMNS)[number]["key"];

export type BoardTicketFacts = {
  status: TicketStatus;
  technicianId: string | null;
  receivedAt: Date | null;
  startedAt: Date | null;
  closedAt: Date | null;
};

/** Received but unassigned for longer than this → stuck (LD10). */
export const UNASSIGNED_STUCK_MS = 60 * 60 * 1000;
/** In repair (or blocked) for longer than this → stuck (LD10). */
export const REPAIR_STUCK_MS = 24 * 60 * 60 * 1000;

export function boardColumn(ticket: BoardTicketFacts, now: Date): BoardColumnKey | null {
  switch (ticket.status) {
    case "SUBMITTED":
      return "DROP_OFF";
    case "RECEIVED":
      return ticket.technicianId ? "IN_REPAIR" : "TO_ASSIGN";
    case "IN_REPAIR":
      return "IN_REPAIR";
    case "WAITING_FOR_PARTS":
    case "ACTION_NEEDED":
    case "CANNOT_REPAIR_PROPOSED":
      return "BLOCKED";
    case "READY_FOR_PICKUP":
    case "CANNOT_BE_REPAIRED":
      return "READY";
    case "COLLECTED":
      return ticket.closedAt && localDay(ticket.closedAt) === localDay(now) ? "COLLECTED_TODAY" : null;
    case "CANCELLED":
      return null;
  }
}

export function isStuck(ticket: BoardTicketFacts, now: Date): boolean {
  const age = (from: Date | null) => (from ? now.getTime() - from.getTime() : 0);
  if (ticket.status === "RECEIVED" && !ticket.technicianId) return age(ticket.receivedAt) > UNASSIGNED_STUCK_MS;
  if (ticket.status === "IN_REPAIR" || ticket.status === "WAITING_FOR_PARTS" || ticket.status === "ACTION_NEEDED") return age(ticket.startedAt) > REPAIR_STUCK_MS;
  return false;
}
