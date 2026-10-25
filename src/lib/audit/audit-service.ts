import type { Prisma, PrismaClient, RepairEventType, TicketStatus, UserRole } from "@prisma/client";
import { normalizeUniversityId } from "@/lib/intake/university-id";
import { EVENT_LABELS, personNote } from "@/lib/tickets/event-labels";
import { normalizeTrackingCode } from "@/lib/tickets/tracking-code";

/** Audit search (AA5): any ticket, any event, with the full who-did-what trail. */

export type AuditSearchResult = {
  id: string;
  trackingCode: string;
  tagNumber: number | null;
  status: TicketStatus;
  event: string;
  requester: string;
  universityId: string | null;
  device: string;
  createdAt: Date;
};

/** Which fields a query can match: a tracking code, a tag (#147 or 147), a university ID. */
export function searchFilters(query: string): Prisma.RepairTicketWhereInput[] {
  const q = query.trim();
  if (!q) return [];
  const filters: Prisma.RepairTicketWhereInput[] = [];
  const code = normalizeTrackingCode(q);
  if (code) filters.push({ trackingCode: code }, { ticketId: code });
  const tag = q.match(/^#?\s*(\d{1,5})$/);
  if (tag) filters.push({ tagNumber: Number(tag[1]) });
  const universityId = normalizeUniversityId(q);
  if (universityId) filters.push({ requester: { universityId } });
  return filters;
}

export async function searchTickets(prisma: PrismaClient, query: string): Promise<AuditSearchResult[]> {
  const filters = searchFilters(query);
  if (filters.length === 0) return [];
  const tickets = await prisma.repairTicket.findMany({
    where: { OR: filters },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      trackingCode: true,
      ticketId: true,
      tagNumber: true,
      status: true,
      createdAt: true,
      event: { select: { name: true } },
      requester: { select: { fullName: true, universityId: true } },
      device: { select: { brand: true, model: true } },
    },
  });
  return tickets.map((t) => ({
    id: t.id,
    trackingCode: t.trackingCode ?? t.ticketId,
    tagNumber: t.tagNumber,
    status: t.status,
    event: t.event.name,
    requester: t.requester?.fullName ?? "Erased",
    universityId: t.requester?.universityId ?? null,
    device: `${t.device.brand} ${t.device.model}`,
    createdAt: t.createdAt,
  }));
}

export type AuditEntry = {
  id: string;
  type: RepairEventType;
  action: string;
  /** What a person wrote: a reason, a blocker, a note. */
  reason: string | null;
  /** Facts from the step, e.g. "To Ahmed Nur", "Tag #014". */
  details: string[];
  actor: string;
  role: UserRole | null;
  statusFrom: string | null;
  statusTo: string | null;
  at: Date;
};

export type AuditTicket = AuditSearchResult & { technician: string | null; entries: AuditEntry[] };

type Meta = Record<string, unknown>;
const str = (value: unknown) => (typeof value === "string" && value ? value : null);

export async function getAuditTicket(prisma: PrismaClient, id: string): Promise<AuditTicket | null> {
  const ticket = await prisma.repairTicket.findUnique({
    where: { id },
    select: {
      id: true,
      trackingCode: true,
      ticketId: true,
      tagNumber: true,
      status: true,
      createdAt: true,
      event: { select: { name: true } },
      requester: { select: { fullName: true, universityId: true } },
      device: { select: { brand: true, model: true } },
      technician: { select: { fullName: true } },
      events: {
        orderBy: { createdAt: "asc" },
        select: { id: true, eventType: true, note: true, metadata: true, statusFrom: true, statusTo: true, createdAt: true, actorRole: true, actor: { select: { fullName: true } } },
      },
    },
  });
  if (!ticket) return null;

  // Assignment steps store technician ids; show names.
  const ids = new Set<string>();
  for (const event of ticket.events) {
    const meta = (event.metadata ?? {}) as Meta;
    for (const key of ["to", "from", "technicianTo"]) if (str(meta[key])) ids.add(meta[key] as string);
  }
  const users = await prisma.user.findMany({ where: { id: { in: [...ids] } }, select: { id: true, fullName: true } });
  const name = (value: unknown) => users.find((u) => u.id === value)?.fullName ?? null;

  const entries = ticket.events.map((event): AuditEntry => {
    const meta = (event.metadata ?? {}) as Meta;
    const details: string[] = [];
    if (event.eventType === "TECHNICIAN_ASSIGNED" || event.eventType === "TECHNICIAN_REASSIGNED") {
      const from = name(meta.from);
      const to = name(meta.to ?? meta.technicianTo);
      if (from) details.push(`From ${from}`);
      if (to) details.push(`To ${to}`);
    }
    if (typeof meta.tagNumber === "number") details.push(`Tag #${String(meta.tagNumber).padStart(3, "0")}`);
    if (str(meta.zone)) details.push(`Zone ${meta.zone}`);
    if (meta.priority === "URGENT") details.push("Urgent");
    if (str(meta.collectedByName)) details.push(`Collected by ${meta.collectedByName}`);
    if (str(meta.template)) details.push(`Template: ${String(meta.template).toLowerCase().replaceAll("_", " ")}`);
    if (str(meta.undoneEventType)) details.push(`Undid: ${EVENT_LABELS[meta.undoneEventType as RepairEventType] ?? meta.undoneEventType}`);
    if (str(meta.location) === "IT_OFFICE") details.push("To the IT office");
    if (event.eventType === "TICKET_CREATED") details.push(event.note === "Registered at the desk." ? "At the desk" : "Online");
    if (typeof meta.rating === "number") details.push(`${meta.rating} / 5`);
    return {
      id: event.id,
      type: event.eventType,
      action: meta.kind === "password_viewed" ? "Viewed the device password" : EVENT_LABELS[event.eventType],
      reason: personNote(event.note),
      details,
      actor: event.actor?.fullName ?? (event.actorRole ? "Former staff member" : "Requester"),
      role: event.actorRole,
      statusFrom: event.statusFrom,
      statusTo: event.statusTo,
      at: event.createdAt,
    };
  });

  return {
    id: ticket.id,
    trackingCode: ticket.trackingCode ?? ticket.ticketId,
    tagNumber: ticket.tagNumber,
    status: ticket.status,
    event: ticket.event.name,
    requester: ticket.requester?.fullName ?? "Erased",
    universityId: ticket.requester?.universityId ?? null,
    device: `${ticket.device.brand} ${ticket.device.model}`,
    createdAt: ticket.createdAt,
    technician: ticket.technician?.fullName ?? null,
    entries,
  };
}
