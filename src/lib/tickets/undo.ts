import type { RepairEventType, TicketStatus } from "@prisma/client";

/** Events that changed a ticket and can be reversed (LD9, LD18). Notes, messages and ratings can't. */
export const UNDOABLE_EVENTS: readonly RepairEventType[] = [
  "CHECKED_IN",
  "TECHNICIAN_ASSIGNED",
  "TECHNICIAN_REASSIGNED",
  "TICKET_CLAIMED",
  "TICKET_RELEASED",
  "REPAIR_STARTED",
  "REPAIR_BLOCKED",
  "REPAIR_RESUMED",
  "CANNOT_REPAIR_PROPOSED",
  "CANNOT_REPAIR_CONFIRMED",
  "CANNOT_REPAIR_REJECTED",
  "READY_FOR_PICKUP",
  "PICKUP_CONFIRMED",
  "TICKET_CANCELLED",
];

export type TimelineEvent = {
  id: string;
  eventType: RepairEventType;
  statusFrom: string | null;
  statusTo: string | null;
  note: string | null;
  actorId: string | null;
  metadata: unknown;
};

export type UndoStep = {
  eventId: string;
  eventType: RepairEventType;
  statusFrom: TicketStatus;
  statusTo: TicketStatus;
  /** The technician to restore; `undefined` when the step didn't change who was assigned. */
  technicianFrom: string | null | undefined;
  note: string | null;
};

function meta(event: TimelineEvent) {
  return (event.metadata ?? {}) as Record<string, unknown>;
}

/** The most recent reversible step not yet undone. `events` newest first. */
export function findUndoStep(events: TimelineEvent[]): UndoStep | null {
  const undone = new Set(events.filter((event) => event.eventType === "STEP_UNDONE").map((event) => meta(event).undoneEventId as string));
  const step = events.find((event) => UNDOABLE_EVENTS.includes(event.eventType) && !undone.has(event.id) && event.statusFrom && event.statusTo);
  if (!step) return null;

  const m = meta(step);
  let technicianFrom: string | null | undefined;
  if ("technicianFrom" in m) technicianFrom = (m.technicianFrom as string | null) ?? null;
  else if (step.eventType === "TECHNICIAN_REASSIGNED") technicianFrom = (m.from as string) ?? null;
  else if (step.eventType === "TICKET_RELEASED") technicianFrom = step.actorId;
  else if (step.eventType === "TECHNICIAN_ASSIGNED" || step.eventType === "TICKET_CLAIMED") technicianFrom = null;
  else technicianFrom = undefined;

  return {
    eventId: step.id,
    eventType: step.eventType,
    statusFrom: step.statusFrom as TicketStatus,
    statusTo: step.statusTo as TicketStatus,
    technicianFrom,
    note: step.note,
  };
}
