import type { PrismaClient } from "@prisma/client";
import { boardTicketSelect, toBoardTicket, type BoardTicket } from "@/lib/board/board-service";
import { localDay } from "@/lib/events/event-window";
import { CLAIM_CAP, OPEN_REPAIR_STATUSES } from "@/lib/tickets/workflow";

export type TechnicianQueue = { mine: BoardTicket[]; pool: BoardTicket[]; doneToday: BoardTicket[]; openCount: number; claimCap: number };

const byUrgencyThenAge = (a: BoardTicket, b: BoardTicket) => Number(b.priority === "URGENT") - Number(a.priority === "URGENT") || a.since.localeCompare(b.since);

/** My open tickets, the unassigned pool, and what I finished today (TA2). Urgent first, then oldest. */
export async function getTechnicianQueue(prisma: PrismaClient, userId: string, now = new Date()): Promise<TechnicianQueue> {
  const event = await prisma.event.findFirst({ where: { isActive: true }, select: { id: true } });
  const eventFilter = event ? { eventId: event.id } : {};

  const [mine, pool, done] = await Promise.all([
    prisma.repairTicket.findMany({ where: { technicianId: userId, status: { in: [...OPEN_REPAIR_STATUSES] } }, select: boardTicketSelect }),
    prisma.repairTicket.findMany({ where: { ...eventFilter, status: "RECEIVED", technicianId: null }, select: boardTicketSelect }),
    prisma.repairTicket.findMany({
      where: { technicianId: userId, status: { in: ["READY_FOR_PICKUP", "CANNOT_BE_REPAIRED", "COLLECTED"] }, completedAt: { gte: new Date(now.getTime() - 36 * 60 * 60 * 1000) } },
      select: { ...boardTicketSelect, completedAt: true },
    }),
  ]);

  const map = (records: typeof mine) => records.map((record) => toBoardTicket(record, now)).filter((ticket): ticket is BoardTicket => ticket !== null);
  const today = localDay(now);

  return {
    mine: map(mine).sort(byUrgencyThenAge),
    pool: map(pool).sort(byUrgencyThenAge),
    doneToday: done
      .filter((record) => record.completedAt && localDay(record.completedAt) === today)
      .map((record) => toBoardTicket({ ...record, closedAt: null }, now) ?? null)
      .filter((ticket): ticket is BoardTicket => ticket !== null),
    openCount: mine.length,
    claimCap: CLAIM_CAP,
  };
}
