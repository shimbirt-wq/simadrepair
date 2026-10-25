import type { RepairEventType, TicketStatus, UserRole } from "@prisma/client";

/**
 * The ticket workflow: the only place that decides whether an action is
 * allowed and what it changes. Pure — no database, no clock.
 *
 * Ticket services load a WorkflowTicket, call `decide`, and persist the result.
 */

export type WorkflowActor =
  | { kind: "staff"; id: string; role: UserRole }
  | { kind: "requester" }
  | { kind: "system" };

export type WorkflowTicket = {
  status: TicketStatus;
  technicianId: string | null;
};

export type BlockKind = "WAITING_FOR_PARTS" | "ACTION_NEEDED";

export type WorkflowAction =
  | { type: "CHECK_IN" }
  | { type: "ASSIGN"; technicianId: string; reason?: string }
  | { type: "CLAIM"; openRepairCount: number }
  | { type: "RELEASE"; reason: string }
  | { type: "START" }
  | { type: "BLOCK"; kind: BlockKind; detail: string }
  | { type: "RESUME" }
  | { type: "PROPOSE_CANNOT_REPAIR"; reason: string }
  | { type: "CONFIRM_CANNOT_REPAIR" }
  | { type: "REJECT_CANNOT_REPAIR"; reason?: string }
  | { type: "MARK_READY" }
  | { type: "PICKUP" }
  | { type: "CANCEL" }
  | { type: "CLOSE_EVENT_ENDED" };

export type WorkflowEvent = {
  type: RepairEventType;
  statusFrom: TicketStatus;
  statusTo: TicketStatus;
  note: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type WorkflowDecision =
  | {
      ok: true;
      status: TicketStatus;
      technicianId: string | null;
      event: WorkflowEvent;
    }
  | { ok: false; code: "FORBIDDEN" | "INVALID_TRANSITION" | "INVALID_INPUT"; message: string };

/** Technicians may hold at most this many tickets in repair through self-claim (LD16). */
export const CLAIM_CAP = 3;

export const OPEN_REPAIR_STATUSES: readonly TicketStatus[] = [
  "RECEIVED",
  "IN_REPAIR",
  "WAITING_FOR_PARTS",
  "ACTION_NEEDED",
  "CANNOT_REPAIR_PROPOSED",
];

export const BLOCKED_STATUSES: readonly TicketStatus[] = ["WAITING_FOR_PARTS", "ACTION_NEEDED", "CANNOT_REPAIR_PROPOSED"];

export const TERMINAL_STATUSES: readonly TicketStatus[] = ["COLLECTED", "CANCELLED"];

const UNFINISHED_STATUSES: readonly TicketStatus[] = ["SUBMITTED", ...OPEN_REPAIR_STATUSES];

function isDesk(actor: WorkflowActor) {
  return actor.kind === "staff" && (actor.role === "LEAD_TECHNICIAN" || actor.role === "ADMIN");
}

function isRepairer(actor: WorkflowActor) {
  return actor.kind === "staff" && (actor.role === "TECHNICIAN" || actor.role === "LEAD_TECHNICIAN");
}

function isAssignedTo(actor: WorkflowActor, ticket: WorkflowTicket) {
  return actor.kind === "staff" && ticket.technicianId === actor.id;
}

/** Assigned technician, or the desk (lead/admin) acting on their behalf. */
function canWorkOn(actor: WorkflowActor, ticket: WorkflowTicket) {
  return isDesk(actor) || isAssignedTo(actor, ticket);
}

const forbidden = (message: string): WorkflowDecision => ({ ok: false, code: "FORBIDDEN", message });
const invalid = (message: string): WorkflowDecision => ({ ok: false, code: "INVALID_TRANSITION", message });
const badInput = (message: string): WorkflowDecision => ({ ok: false, code: "INVALID_INPUT", message });

function move(
  ticket: WorkflowTicket,
  status: TicketStatus,
  type: RepairEventType,
  note: string,
  options: { technicianId?: string | null; metadata?: WorkflowEvent["metadata"] } = {},
): WorkflowDecision {
  return {
    ok: true,
    status,
    technicianId: options.technicianId === undefined ? ticket.technicianId : options.technicianId,
    event: { type, statusFrom: ticket.status, statusTo: status, note, metadata: options.metadata },
  };
}

function requireText(value: string | undefined, label: string) {
  return value && value.trim().length >= 3 ? null : badInput(`${label} is required.`);
}

export function decide(ticket: WorkflowTicket, actor: WorkflowActor, action: WorkflowAction): WorkflowDecision {
  const { status } = ticket;

  switch (action.type) {
    case "CHECK_IN": {
      if (!isDesk(actor)) return forbidden("Only the desk can check devices in.");
      if (status !== "SUBMITTED") return invalid("Only submitted requests can be checked in.");
      return move(ticket, "RECEIVED", "CHECKED_IN", "Device received at the desk.");
    }

    case "ASSIGN": {
      if (!isDesk(actor)) return forbidden("Only the desk can assign technicians.");
      if (!OPEN_REPAIR_STATUSES.includes(status)) return invalid("Check the device in before assigning it.");
      if (ticket.technicianId === action.technicianId) return invalid("This technician is already assigned.");
      if (ticket.technicianId) {
        const reasonError = requireText(action.reason, "A reason for reassigning");
        if (reasonError) return reasonError;
        return move(ticket, status, "TECHNICIAN_REASSIGNED", action.reason!.trim(), {
          technicianId: action.technicianId,
          metadata: { from: ticket.technicianId, to: action.technicianId },
        });
      }
      return move(ticket, status, "TECHNICIAN_ASSIGNED", "Technician assigned.", {
        technicianId: action.technicianId,
        metadata: { to: action.technicianId },
      });
    }

    case "CLAIM": {
      if (!isRepairer(actor) || actor.kind !== "staff") return forbidden("Only technicians can claim tickets.");
      if (status !== "RECEIVED" || ticket.technicianId) return invalid("This ticket is not in the pool.");
      if (action.openRepairCount >= CLAIM_CAP) return invalid(`You already have ${CLAIM_CAP} open repairs. Finish one first.`);
      return move(ticket, status, "TICKET_CLAIMED", "Claimed from the pool.", { technicianId: actor.id });
    }

    case "RELEASE": {
      if (!isAssignedTo(actor, ticket) && !isDesk(actor)) return forbidden("Only the assigned technician can release this ticket.");
      if (status !== "RECEIVED" && status !== "IN_REPAIR") return invalid("Only received or in-repair tickets can be released.");
      const reasonError = requireText(action.reason, "A reason");
      if (reasonError) return reasonError;
      return move(ticket, "RECEIVED", "TICKET_RELEASED", action.reason.trim(), { technicianId: null });
    }

    case "START": {
      if (!canWorkOn(actor, ticket)) return forbidden("Only the assigned technician can start this repair.");
      if (status !== "RECEIVED") return invalid("Only received tickets can be started.");
      if (!ticket.technicianId) return invalid("Assign or claim the ticket first.");
      return move(ticket, "IN_REPAIR", "REPAIR_STARTED", "Repair started.");
    }

    case "BLOCK": {
      if (!canWorkOn(actor, ticket)) return forbidden("Only the assigned technician can update this repair.");
      if (status !== "IN_REPAIR") return invalid("Only repairs in progress can be blocked.");
      const detailError = requireText(action.detail, action.kind === "WAITING_FOR_PARTS" ? "The part name" : "What you need");
      if (detailError) return detailError;
      return move(ticket, action.kind, "REPAIR_BLOCKED", action.detail.trim(), { metadata: { kind: action.kind } });
    }

    case "RESUME": {
      if (!canWorkOn(actor, ticket)) return forbidden("Only the assigned technician can resume this repair.");
      if (status !== "WAITING_FOR_PARTS" && status !== "ACTION_NEEDED") return invalid("Only blocked repairs can be resumed.");
      return move(ticket, "IN_REPAIR", "REPAIR_RESUMED", "Repair resumed.");
    }

    case "PROPOSE_CANNOT_REPAIR": {
      if (!canWorkOn(actor, ticket)) return forbidden("Only the assigned technician can propose this.");
      if (!["IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED"].includes(status)) return invalid("Start the repair before proposing this.");
      const reasonError = requireText(action.reason, "A reason");
      if (reasonError) return reasonError;
      return move(ticket, "CANNOT_REPAIR_PROPOSED", "CANNOT_REPAIR_PROPOSED", action.reason.trim());
    }

    case "CONFIRM_CANNOT_REPAIR": {
      if (!isDesk(actor)) return forbidden("Only the desk can confirm this.");
      if (status !== "CANNOT_REPAIR_PROPOSED") return invalid("Nothing to confirm.");
      return move(ticket, "CANNOT_BE_REPAIRED", "CANNOT_REPAIR_CONFIRMED", "Confirmed: cannot be repaired.");
    }

    case "REJECT_CANNOT_REPAIR": {
      if (!isDesk(actor)) return forbidden("Only the desk can reject this.");
      if (status !== "CANNOT_REPAIR_PROPOSED") return invalid("Nothing to reject.");
      return move(ticket, "IN_REPAIR", "CANNOT_REPAIR_REJECTED", action.reason?.trim() || "Keep trying the repair.");
    }

    case "MARK_READY": {
      if (!canWorkOn(actor, ticket)) return forbidden("Only the assigned technician can mark this ready.");
      if (status !== "IN_REPAIR") return invalid("Only repairs in progress can be marked ready.");
      return move(ticket, "READY_FOR_PICKUP", "READY_FOR_PICKUP", "Ready for pickup.");
    }

    case "PICKUP": {
      if (!isDesk(actor)) return forbidden("Only the desk can hand devices back.");
      if (status !== "READY_FOR_PICKUP" && status !== "CANNOT_BE_REPAIRED") return invalid("This device is not ready to be handed back.");
      return move(ticket, "COLLECTED", "PICKUP_CONFIRMED", "Device handed back.");
    }

    case "CANCEL": {
      if (actor.kind !== "requester" && !isDesk(actor)) return forbidden("Only the requester or the desk can cancel.");
      if (status !== "SUBMITTED") return invalid("Requests can only be cancelled before drop-off.");
      return move(ticket, "CANCELLED", "TICKET_CANCELLED", "Request cancelled.", { technicianId: null });
    }

    case "CLOSE_EVENT_ENDED": {
      if (!isDesk(actor) && actor.kind !== "system") return forbidden("Only the desk can close the event.");
      if (status === "SUBMITTED") return move(ticket, "CANCELLED", "TICKET_CANCELLED", "Event ended before drop-off.", { technicianId: ticket.technicianId });
      if (!UNFINISHED_STATUSES.includes(status)) return invalid("This ticket is already finished.");
      return move(ticket, "CANNOT_BE_REPAIRED", "CANNOT_REPAIR_CONFIRMED", "Cannot be repaired — event ended.");
    }
  }
}
