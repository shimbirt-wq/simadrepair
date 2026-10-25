import type { PrismaClient, RepairEventType, TicketPriority, TicketStatus, UserRole } from "@prisma/client";
import { ACCESSORIES, labelOf } from "@/lib/intake/options";
import { CONDITION_CHECKS } from "@/lib/tickets/check-in-options";
import { FAULTS, REPAIR_ACTIONS, TEST_CHECKS } from "@/lib/tickets/repair-record";
import { getIntakeDetail, type IntakeDetail } from "@/lib/tickets/intake-detail";
import { ticketLookupWhere } from "@/lib/tickets/ticket-service";
import { findUndoStep } from "@/lib/tickets/undo";

/** Full ticket for staff screens (board sheet, technician workspace). */
export type StaffTicketDetail = {
  id: string;
  trackingCode: string;
  tagNumber: number | null;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  event: { id: string; name: string; venue: string; hours: string; deskWhatsapp: string };
  requester: { fullName: string; universityId: string; phone: string; faculty: string | null; requesterType: string };
  technician: { id: string; name: string; phone: string | null } | null;
  hasPassword: boolean;
  custody: {
    idChecked: boolean;
    conditionChecks: string[];
    accessoriesReceived: string[];
    accessoriesReceivedValues: string[];
    accessoriesReturned: string[];
    receivedAt: string | null;
    receivedBy: string | null;
    condition: string | null;
    zone: string | null;
    collectedAt: string | null;
    collectedByName: string | null;
    collectedByPhone: string | null;
    releasedBy: string | null;
  };
  intake: IntakeDetail;
  repair: { faults: string[]; actions: string[]; note: string | null; tests: string[] } | null;
  messagesSent: Array<{ template: string; at: string; by: string | null }>;
  /** The step "Undo last step" would reverse, if any. */
  undoable: { type: RepairEventType; note: string | null; adminOnly: boolean } | null;
  timeline: Array<{ id: string; type: RepairEventType; note: string | null; at: string; actor: string | null; actorRole: UserRole | null }>;
};

export async function getStaffTicketDetail(prisma: PrismaClient, ref: string): Promise<StaffTicketDetail | null> {
  const ticket = await prisma.repairTicket.findFirst({
    where: ticketLookupWhere(ref),
    select: {
      id: true,
      trackingCode: true,
      ticketId: true,
      tagNumber: true,
      priority: true,
      status: true,
      createdAt: true,
      devicePasswordEnc: true,
      repairFaults: true,
      repairActions: true,
      repairNote: true,
      testsPassed: true,
      event: { select: { id: true, name: true, venue: true, hours: true, deskWhatsapp: true } },
      requester: { select: { fullName: true, universityId: true, phone: true, faculty: true, requesterType: true } },
      technician: { select: { id: true, fullName: true, phone: true } },
      custody: {
        select: {
          idChecked: true,
          conditionChecks: true,
          accessoriesReceived: true,
          accessoriesReturned: true,
          receivedAt: true,
          condition: true,
          storageLocation: true,
          collectedAt: true,
          collectedByName: true,
          collectedByPhone: true,
          receivedBy: { select: { fullName: true } },
          releasedBy: { select: { fullName: true } },
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        select: { id: true, eventType: true, note: true, createdAt: true, actorRole: true, actorId: true, statusFrom: true, statusTo: true, metadata: true, actor: { select: { fullName: true } } },
      },
    },
  });
  if (!ticket) return null;
  const intake = await getIntakeDetail(prisma, ticket.id);
  const iso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

  return {
    id: ticket.id,
    trackingCode: ticket.trackingCode ?? ticket.ticketId,
    tagNumber: ticket.tagNumber,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    event: ticket.event,
    requester: {
      fullName: ticket.requester?.fullName ?? "Requester",
      universityId: ticket.requester?.universityId ?? "",
      phone: ticket.requester?.phone ?? "",
      faculty: ticket.requester?.faculty ?? null,
      requesterType: ticket.requester?.requesterType ?? "STUDENT",
    },
    technician: ticket.technician ? { id: ticket.technician.id, name: ticket.technician.fullName, phone: ticket.technician.phone } : null,
    hasPassword: Boolean(ticket.devicePasswordEnc),
    custody: {
      idChecked: ticket.custody?.idChecked ?? false,
      conditionChecks: (ticket.custody?.conditionChecks ?? []).map((value) => labelOf(CONDITION_CHECKS, value)),
      accessoriesReceived: (ticket.custody?.accessoriesReceived ?? []).map((value) => labelOf(ACCESSORIES, value)),
      accessoriesReceivedValues: ticket.custody?.accessoriesReceived ?? [],
      accessoriesReturned: (ticket.custody?.accessoriesReturned ?? []).map((value) => labelOf(ACCESSORIES, value)),
      receivedAt: iso(ticket.custody?.receivedAt),
      receivedBy: ticket.custody?.receivedBy?.fullName ?? null,
      condition: ticket.custody?.condition ?? null,
      zone: ticket.custody?.storageLocation ?? null,
      collectedAt: iso(ticket.custody?.collectedAt),
      collectedByName: ticket.custody?.collectedByName ?? null,
      collectedByPhone: ticket.custody?.collectedByPhone ?? null,
      releasedBy: ticket.custody?.releasedBy?.fullName ?? null,
    },
    intake: intake!,
    repair: ticket.repairActions.length
      ? {
          faults: ticket.repairFaults.map((value) => labelOf(FAULTS, value)),
          actions: ticket.repairActions.map((value) => labelOf(REPAIR_ACTIONS, value)),
          note: ticket.repairNote,
          tests: ticket.testsPassed.map((value) => labelOf(TEST_CHECKS, value)),
        }
      : null,
    messagesSent: ticket.events
      .filter((event) => event.eventType === "MESSAGE_SENT")
      .map((event) => ({ template: String((event.metadata as Record<string, unknown> | null)?.template ?? ""), at: event.createdAt.toISOString(), by: event.actor?.fullName ?? null })),
    undoable: (() => {
      const step = findUndoStep(ticket.events);
      return step && step.statusTo === ticket.status ? { type: step.eventType, note: step.note, adminOnly: step.eventType === "PICKUP_CONFIRMED" } : null;
    })(),
    timeline: ticket.events.map((event) => ({ id: event.id, type: event.eventType, note: event.note, at: event.createdAt.toISOString(), actor: event.actor?.fullName ?? null, actorRole: event.actorRole })),
  };
}

/** Desk sees everything; a technician sees tickets assigned to them and the unassigned pool. */
export function canViewTicket(user: { id: string; role: UserRole }, ticket: { status: TicketStatus; technician: { id: string } | null }) {
  if (user.role === "ADMIN" || user.role === "LEAD_TECHNICIAN") return true;
  if (ticket.technician?.id === user.id) return true;
  return ticket.status === "RECEIVED" && !ticket.technician;
}
