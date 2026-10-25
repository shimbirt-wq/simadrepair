import type { PrismaClient, RepairEventType, TicketStatus } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { normalizeTrackingCode } from "@/lib/tickets/tracking-code";

/**
 * What anyone holding a tracking code may see. Never: full name, university
 * ID, the requester's phone, storage location, photos or internal notes.
 */

export class PublicTrackingValidationError extends Error {
  constructor() {
    super("Invalid tracking code format.");
    this.name = "PublicTrackingValidationError";
  }
}

/** Events a requester may see; internal ones (proposals, notes, reassignments) stay hidden. */
const PUBLIC_EVENT_LABELS: Partial<Record<RepairEventType, string>> = {
  TICKET_CREATED: "Request submitted",
  CHECKED_IN: "Device received at the desk",
  TECHNICIAN_ASSIGNED: "Technician assigned",
  TICKET_CLAIMED: "Technician assigned",
  REPAIR_STARTED: "Repair started",
  REPAIR_BLOCKED: "Repair paused",
  REPAIR_RESUMED: "Repair resumed",
  CANNOT_REPAIR_CONFIRMED: "Cannot be repaired",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKUP_CONFIRMED: "Device collected",
  TICKET_CANCELLED: "Request cancelled",
};

export function isPublicRepairEvent(event: { eventType: RepairEventType }) {
  return event.eventType in PUBLIC_EVENT_LABELS;
}

/** A pending "cannot repair" proposal is not news for the requester until the lead confirms it. */
export function toPublicStatus(status: TicketStatus): TicketStatus {
  return status === "CANNOT_REPAIR_PROPOSED" ? "IN_REPAIR" : status;
}

const CONTACT_TECHNICIAN_STATUSES: readonly TicketStatus[] = ["RECEIVED", "IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED", "CANNOT_REPAIR_PROPOSED", "READY_FOR_PICKUP"];

export type PublicTrackingInfo = {
  trackingCode: string;
  status: TicketStatus;
  submittedAt: Date;
  requesterFirstName: string;
  device: { deviceType: string; brand: string; model: string };
  /** What the requester must do or buy, or why it cannot be repaired. */
  detail: string | null;
  contact: { kind: "technician" | "desk"; name: string; whatsapp: string } | null;
  event: { name: string; venue: string; hours: string; holdDays: number } | null;
  timeline: Array<{ label: string; at: Date }>;
};

function firstName(fullName: string | null | undefined) {
  return fullName?.trim().split(/\s+/)[0] || "there";
}

export async function getPublicTrackingInfo(input: string, prisma: PrismaClient = defaultPrisma): Promise<PublicTrackingInfo | null> {
  const trackingCode = normalizeTrackingCode(input);
  if (!trackingCode) throw new PublicTrackingValidationError();

  const ticket = await prisma.repairTicket.findFirst({
    where: { OR: [{ trackingCode }, { ticketId: trackingCode }] },
    select: {
      trackingCode: true,
      ticketId: true,
      status: true,
      createdAt: true,
      requester: { select: { fullName: true } },
      device: { select: { deviceType: true, brand: true, model: true } },
      technician: { select: { fullName: true, phone: true } },
      event: { select: { id: true, name: true, venue: true, hours: true, deskWhatsapp: true, holdDays: true } },
      events: { orderBy: { createdAt: "asc" }, select: { eventType: true, note: true, createdAt: true } },
    },
  });

  if (!ticket) return null;

  const status = toPublicStatus(ticket.status);
  const lastNote = (type: RepairEventType) => [...ticket.events].reverse().find((event) => event.eventType === type)?.note ?? null;

  let detail: string | null = null;
  if (status === "WAITING_FOR_PARTS" || status === "ACTION_NEEDED") detail = lastNote("REPAIR_BLOCKED");
  if (status === "CANNOT_BE_REPAIRED") detail = lastNote("CANNOT_REPAIR_PROPOSED") ?? lastNote("CANNOT_REPAIR_CONFIRMED");

  const legacy = ticket.event.id === "legacy";
  let contact: PublicTrackingInfo["contact"] = null;
  if (ticket.technician?.phone && CONTACT_TECHNICIAN_STATUSES.includes(ticket.status)) {
    contact = { kind: "technician", name: firstName(ticket.technician.fullName), whatsapp: ticket.technician.phone };
  } else if (!legacy && ticket.status !== "COLLECTED" && ticket.status !== "CANCELLED") {
    contact = { kind: "desk", name: "IT service desk", whatsapp: ticket.event.deskWhatsapp };
  }

  return {
    trackingCode: ticket.trackingCode ?? ticket.ticketId,
    status,
    submittedAt: ticket.createdAt,
    requesterFirstName: firstName(ticket.requester?.fullName),
    device: ticket.device,
    detail,
    contact,
    event: legacy ? null : { name: ticket.event.name, venue: ticket.event.venue, hours: ticket.event.hours, holdDays: ticket.event.holdDays },
    timeline: ticket.events.filter(isPublicRepairEvent).map((event) => ({ label: PUBLIC_EVENT_LABELS[event.eventType]!, at: event.createdAt })),
  };
}
