import type { PrismaClient, TicketPriority, TicketStatus } from "@prisma/client";
import { boardColumn, isStuck, type BoardColumnKey } from "@/lib/board/board-rules";
import { getActiveEvent } from "@/lib/events/event-service";
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
  /** When the ticket entered its current phase; drives "age" on the card. */
  since: string;
};

export type BoardTechnician = { id: string; name: string; role: string; openCount: number; skills: string[] };

export type Board = { event: { id: string; name: string } | null; tickets: BoardTicket[]; technicians: BoardTechnician[]; generatedAt: string };

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
    select: {
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
      custody: { select: { receivedAt: true, storageLocation: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  const tickets: BoardTicket[] = [];
  for (const ticket of records) {
    const facts = { status: ticket.status, technicianId: ticket.technicianId, receivedAt: ticket.custody?.receivedAt ?? null, startedAt: ticket.startedAt, closedAt: ticket.closedAt };
    const column = boardColumn(facts, now);
    if (!column) continue;
    const since = ticket.closedAt ?? ticket.readyForPickupAt ?? ticket.startedAt ?? ticket.custody?.receivedAt ?? ticket.createdAt;
    tickets.push({
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
      since: since.toISOString(),
    });
  }

  return { event: { id: event.id, name: event.name }, tickets, technicians, generatedAt: now.toISOString() };
}

export async function listTechniciansWithLoad(prisma: PrismaClient): Promise<BoardTechnician[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["TECHNICIAN", "LEAD_TECHNICIAN"] } },
    select: { id: true, fullName: true, role: true, assignedTickets: { where: { status: { in: [...OPEN_REPAIR_STATUSES] } }, select: { id: true } } },
    orderBy: { fullName: "asc" },
  });
  return users.map((user) => ({ id: user.id, name: user.fullName, role: user.role, openCount: user.assignedTickets.length, skills: [] }));
}
