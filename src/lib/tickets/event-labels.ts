import type { RepairEventType } from "@prisma/client";

/** What each logged step is called on staff screens. */
export const EVENT_LABELS: Record<RepairEventType, string> = {
  TICKET_CREATED: "Request submitted",
  STATUS_CHANGED: "Status changed",
  CUSTODY_CHANGED: "Device moved",
  TECHNICIAN_ASSIGNED: "Technician assigned",
  READY_FOR_PICKUP: "Marked ready for pickup",
  PICKUP_CONFIRMED: "Handed back",
  TICKET_CLOSED: "Closed",
  TICKET_CANCELLED: "Cancelled",
  CHECKED_IN: "Checked in",
  TECHNICIAN_REASSIGNED: "Reassigned",
  TICKET_CLAIMED: "Claimed",
  TICKET_RELEASED: "Released to the pool",
  REPAIR_STARTED: "Repair started",
  REPAIR_BLOCKED: "Repair blocked",
  REPAIR_RESUMED: "Repair resumed",
  CANNOT_REPAIR_PROPOSED: "Proposed: cannot repair",
  CANNOT_REPAIR_CONFIRMED: "Confirmed: cannot repair",
  CANNOT_REPAIR_REJECTED: "Cannot-repair rejected",
  STEP_UNDONE: "Step undone",
  NOTE_ADDED: "Note",
  MESSAGE_SENT: "WhatsApp message sent",
  RATED: "Rated the service",
};

/** Notes the workflow writes on its own; anything else was typed by a person (a reason or detail). */
const AUTOMATIC_NOTES = new Set([
  "Device received at the desk.",
  "Technician assigned.",
  "Claimed from the pool.",
  "Repair started.",
  "Repair resumed.",
  "Confirmed: cannot be repaired.",
  "Ready for pickup.",
  "Device handed back.",
  "Request cancelled.",
  "Request submitted online.",
  "Registered at the desk.",
  "Moved to the IT office after the event.",
  "Viewed the device password.",
]);

export function personNote(note: string | null): string | null {
  return note && !AUTOMATIC_NOTES.has(note) && !/^Rated \d\/5$/.test(note) ? note : null;
}
