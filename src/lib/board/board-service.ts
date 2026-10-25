import { Prisma, type PrismaClient, type TicketPriority, type TicketStatus } from "@prisma/client";
import { hasAccess } from "@/lib/auth/public-user";
import { skillLabels } from "@/lib/staff/staff-service";
import { boardColumn, isStuck, type BoardColumnKey } from "@/lib/board/board-rules";
import { getActiveEvent } from "@/lib/events/event-service";
import { formatEventDates } from "@/lib/events/event-window";
import { PROBLEM_CATEGORIES } from "@/lib/intake/diagnosis";
import { OPEN_REPAIR_STATUSES } from "@/lib/tickets/workflow";

export type BoardTicket = {
  id: string;
  trackingCode: string;
  tagNumber: number | null;
  priority: TicketPriority;
  status: TicketStatus;
  column: BoardColumnKey;
  stuck: boolean;
  requesterName: string;
  universityId: string | null;
  phone: string | null;
  device: string;
  categories: string[];
  technician: { id: string; name: string } | null;
  zone: string | null;
  atItOffice: boolean;
  /** When the ticket entered its current phase; drives "age" on the card. */
  since: string;
};

export type BoardTechnician = { id: string; name: string; role: string; openCount: number; skills: string[] };

export type BoardEvent = { id: string; name: string; venue: string; hours: string; dates: string; holdDays: number };

export type Board = { event: BoardEvent | null; tickets: BoardTicket[]; technicians: BoardTechnician[]; generatedAt: string };

export const boardTicketSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  id: true,
  trackingCode: true,
  ticketId: true,
  tagNumber: true,
  priority: true,
  status: true,
  technicianId: true,
  createdAt: true,
  startedAt: true,
  readyForPickupAt: true,
  closedAt: true,
  problemCategories: true,
  technician: { select: { id: true, fullName: true } },
  requester: { select: { fullName: true, universityId: true, phone: true } },
  device: { select: { deviceType: true, brand: true, model: true } },
  custody: { select: { receivedAt: true, storageLocation: true, location: true } },
});

type BoardTicketRecord = Prisma.RepairTicketGetPayload<{ select: typeof boardTicketSelect }>;

export function toBoardTicket(ticket: BoardTicketRecord, now: Date): BoardTicket | null {
  const facts = { status: ticket.status, technicianId: ticket.technicianId, receivedAt: ticket.custody?.receivedAt ?? null, startedAt: ticket.startedAt, closedAt: ticket.closedAt };
  const column = boardColumn(facts, now);
  if (!column) return null;
  const since = ticket.closedAt ?? ticket.readyForPickupAt ?? ticket.startedAt ?? ticket.custody?.receivedAt ?? ticket.createdAt;
  return {
    id: ticket.id,
    trackingCode: ticket.trackingCode ?? ticket.ticketId,
    tagNumber: ticket.tagNumber,
    priority: ticket.priority,
    status: ticket.status,
    column,
    stuck: isStuck(facts, now),
    requesterName: ticket.requester?.fullName ?? "Requester",
    universityId: ticket.requester?.universityId ?? null,
    phone: ticket.requester?.phone ?? null,
    device: `${ticket.device.brand} ${ticket.device.model}`,
    categories: ticket.problemCategories.map((value) => PROBLEM_CATEGORIES.find((category) => category.value === value)?.label ?? value),
    technician: ticket.technician ? { id: ticket.technician.id, name: ticket.technician.fullName } : null,
    zone: ticket.custody?.storageLocation ?? null,
    atItOffice: ticket.custody?.location === "IT_OFFICE",
    since: since.toISOString(),
  };
}

export async function getBoard(prisma: PrismaClient, now = new Date()): Promise<Board> {
  const event = await getActiveEvent(prisma);
  const technicians = await listTechniciansWithLoad(prisma);
  if (!event) return { event: null, tickets: [], technicians, generatedAt: now.toISOString() };

  const records = await prisma.repairTicket.findMany({
    where: {
      eventId: event.id,
      status: { not: "CANCELLED" },
      OR: [{ status: { not: "COLLECTED" } }, { closedAt: { gte: new Date(now.getTime() - 36 * 60 * 60 * 1000) } }],
    },
    select: boardTicketSelect,
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  const tickets = records.map((record) => toBoardTicket(record, now)).filter((ticket): ticket is BoardTicket => ticket !== null);

  return {
    event: { id: event.id, name: event.name, venue: event.venue, hours: event.hours, dates: formatEventDates(event.startsOn, event.endsOn), holdDays: event.holdDays },
    tickets,
    technicians,
    generatedAt: now.toISOString(),
  };
}

export async function listTechniciansWithLoad(prisma: PrismaClient): Promise<BoardTechnician[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["TECHNICIAN", "LEAD_TECHNICIAN"] } },
    select: { id: true, fullName: true, role: true, skills: true, accessExpiresOn: true, isActive: true, assignedTickets: { where: { status: { in: [...OPEN_REPAIR_STATUSES] } }, select: { id: true } } },
    orderBy: { fullName: "asc" },
  });
  return users
    .filter((user) => hasAccess(user))
    .map((user) => ({ id: user.id, name: user.fullName, role: user.role, openCount: user.assignedTickets.length, skills: skillLabels(user.skills) }));
}
