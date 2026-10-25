import type { PrismaClient } from "@prisma/client";
import { getBoard } from "@/lib/board/board-service";
import { LEGACY_EVENT_ID } from "@/lib/events/event-service";
import { formatEventDates, localDay } from "@/lib/events/event-window";
import { DEVICE_TYPES } from "@/lib/intake/options";
import { FAULTS, REPAIR_ACTIONS } from "@/lib/tickets/repair-record";

/**
 * The event report (AA2/AD3) and the live overview (AA3). Every number is
 * derived from tickets of one event:
 * - registered: every ticket of the event, cancelled included
 * - received:   checked in at the desk
 * - fixed:      reached Ready for pickup (readyForPickupAt is set)
 * - cannot repair: finished without being fixed
 * - collected / uncollected: finished devices handed back / still with us
 * - fix rate:   fixed ÷ finished (fixed + cannot repair)
 */

export type CountRow = { label: string; count: number };
export type GroupRow = { label: string; registered: number; fixed: number };
export type TechnicianRow = { name: string; fixed: number; cannotRepair: number; open: number; averageRating: number | null };

export type EventSummary = {
  registered: number;
  cancelled: number;
  received: number;
  fixed: number;
  cannotRepair: number;
  collected: number;
  uncollected: number;
  inProgress: number;
  /** 0–1, null until something is finished. */
  fixRate: number | null;
  /** Median hours from received to ready, over fixed devices. */
  medianHoursToReady: number | null;
  averageRating: number | null;
  ratings: number;
};

export type EventReport = {
  event: { id: string; name: string; dates: string; venue: string };
  summary: EventSummary;
  topFaults: CountRow[];
  topActions: CountRow[];
  byFaculty: GroupRow[];
  byDeviceType: GroupRow[];
  byTechnician: TechnicianRow[];
  previous: Array<{ id: string; name: string; summary: EventSummary }>;
  generatedAt: Date;
};

const reportSelect = {
  status: true,
  readyForPickupAt: true,
  completedAt: true,
  repairFaults: true,
  repairActions: true,
  rating: true,
  requesterFaculty: true,
  requester: { select: { faculty: true } },
  device: { select: { deviceType: true } },
  technician: { select: { id: true, fullName: true } },
  custody: { select: { receivedAt: true } },
} as const;

type ReportTicket = {
  status: string;
  readyForPickupAt: Date | null;
  completedAt: Date | null;
  repairFaults: string[];
  repairActions: string[];
  rating: number | null;
  /** Snapshot kept after personal data is erased. */
  requesterFaculty: string | null;
  requester: { faculty: string | null } | null;
  device: { deviceType: string };
  technician: { id: string; fullName: string } | null;
  custody: { receivedAt: Date | null } | null;
};

const OPEN = new Set(["RECEIVED", "IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED", "CANNOT_REPAIR_PROPOSED"]);

const isFixed = (t: ReportTicket) => t.readyForPickupAt !== null;
const isCannotRepair = (t: ReportTicket) => t.completedAt !== null && t.readyForPickupAt === null;

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function summarize(tickets: ReportTicket[]): EventSummary {
  const fixed = tickets.filter(isFixed);
  const cannotRepair = tickets.filter(isCannotRepair);
  const ratings = tickets.map((t) => t.rating).filter((r): r is number => r !== null);
  const hoursToReady = fixed
    .filter((t) => t.custody?.receivedAt)
    .map((t) => (t.readyForPickupAt!.getTime() - t.custody!.receivedAt!.getTime()) / 3_600_000);
  const finished = fixed.length + cannotRepair.length;
  return {
    registered: tickets.length,
    cancelled: tickets.filter((t) => t.status === "CANCELLED").length,
    received: tickets.filter((t) => t.custody?.receivedAt).length,
    fixed: fixed.length,
    cannotRepair: cannotRepair.length,
    collected: tickets.filter((t) => t.status === "COLLECTED").length,
    uncollected: tickets.filter((t) => t.status === "READY_FOR_PICKUP" || t.status === "CANNOT_BE_REPAIRED").length,
    inProgress: tickets.filter((t) => OPEN.has(t.status)).length,
    fixRate: finished ? fixed.length / finished : null,
    medianHoursToReady: median(hoursToReady),
    averageRating: average(ratings),
    ratings: ratings.length,
  };
}

function countValues(lists: string[][], labels: { value: string; label: string }[]): CountRow[] {
  const counts = new Map<string, number>();
  for (const list of lists) for (const value of list) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .map(([value, count]) => ({ label: labels.find((o) => o.value === value)?.label ?? value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function groupBy(tickets: ReportTicket[], key: (t: ReportTicket) => string): GroupRow[] {
  const groups = new Map<string, GroupRow>();
  for (const ticket of tickets) {
    const label = key(ticket);
    const row = groups.get(label) ?? { label, registered: 0, fixed: 0 };
    row.registered += 1;
    if (isFixed(ticket)) row.fixed += 1;
    groups.set(label, row);
  }
  return [...groups.values()].sort((a, b) => b.registered - a.registered || a.label.localeCompare(b.label));
}

function byTechnician(tickets: ReportTicket[]): TechnicianRow[] {
  const rows = new Map<string, TechnicianRow & { ratingList: number[] }>();
  for (const ticket of tickets) {
    if (!ticket.technician) continue;
    const row = rows.get(ticket.technician.id) ?? { name: ticket.technician.fullName, fixed: 0, cannotRepair: 0, open: 0, averageRating: null, ratingList: [] };
    if (isFixed(ticket)) row.fixed += 1;
    else if (isCannotRepair(ticket)) row.cannotRepair += 1;
    else if (OPEN.has(ticket.status)) row.open += 1;
    if (ticket.rating !== null) row.ratingList.push(ticket.rating);
    rows.set(ticket.technician.id, row);
  }
  return [...rows.values()]
    .map(({ ratingList, ...row }) => ({ ...row, averageRating: average(ratingList) }))
    .sort((a, b) => b.fixed - a.fixed || a.name.localeCompare(b.name));
}

const deviceLabel = (value: string) => DEVICE_TYPES.find((o) => o.value === value)?.label ?? value;

function loadTickets(prisma: PrismaClient, eventId: string) {
  return prisma.repairTicket.findMany({ where: { eventId }, select: reportSelect }) as Promise<ReportTicket[]>;
}

export async function getEventReport(prisma: PrismaClient, eventId: string, now = new Date()): Promise<EventReport | null> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  const tickets = await loadTickets(prisma, eventId);
  const fixed = tickets.filter(isFixed);

  const earlier = await prisma.event.findMany({
    where: { id: { notIn: [eventId, LEGACY_EVENT_ID] }, startsOn: { lt: event.startsOn } },
    orderBy: { startsOn: "desc" },
    take: 3,
    select: { id: true, name: true },
  });
  const previous = await Promise.all(earlier.map(async (e) => ({ id: e.id, name: e.name, summary: summarize(await loadTickets(prisma, e.id)) })));

  return {
    event: { id: event.id, name: event.name, dates: formatEventDates(event.startsOn, event.endsOn), venue: event.venue },
    summary: summarize(tickets),
    topFaults: countValues(fixed.map((t) => t.repairFaults), FAULTS),
    topActions: countValues(fixed.map((t) => t.repairActions), REPAIR_ACTIONS),
    byFaculty: groupBy(tickets, (t) => (t.requester?.faculty ?? t.requesterFaculty)?.trim() || "Not given"),
    byDeviceType: groupBy(tickets, (t) => deviceLabel(t.device.deviceType)),
    byTechnician: byTechnician(tickets),
    previous,
    generatedAt: now,
  };
}

/** Events that can be reported on, newest first. */
export function listReportEvents(prisma: PrismaClient) {
  return prisma.event.findMany({
    where: { id: { not: LEGACY_EVENT_ID } },
    orderBy: { startsOn: "desc" },
    select: { id: true, name: true, isActive: true },
  });
}

export type LiveOverview = {
  event: { id: string; name: string; dates: string } | null;
  today: { registered: number; received: number; ready: number; collected: number };
  open: { dropOff: number; toAssign: number; inRepair: number; blocked: number; ready: number };
  stuck: Array<{ id: string; trackingCode: string; tagNumber: number | null; device: string; technician: string | null; status: string; since: string }>;
  technicians: Array<{ id: string; name: string; openCount: number }>;
};

/** Today's numbers, stuck tickets and technician load for the active event (AA3). */
export async function getLiveOverview(prisma: PrismaClient, now = new Date()): Promise<LiveOverview> {
  const board = await getBoard(prisma, now);
  const technicians = board.technicians.map(({ id, name, openCount }) => ({ id, name, openCount })).sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name));
  const empty = { registered: 0, received: 0, ready: 0, collected: 0 };
  if (!board.event) return { event: null, today: empty, open: { dropOff: 0, toAssign: 0, inRepair: 0, blocked: 0, ready: 0 }, stuck: [], technicians };

  const today = localDay(now);
  const since = new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const recent = await prisma.repairTicket.findMany({
    where: { eventId: board.event.id, OR: [{ createdAt: { gte: since } }, { readyForPickupAt: { gte: since } }, { closedAt: { gte: since } }, { custody: { receivedAt: { gte: since } } }] },
    select: { createdAt: true, readyForPickupAt: true, closedAt: true, status: true, custody: { select: { receivedAt: true } } },
  });
  const isToday = (value: Date | null | undefined) => Boolean(value && localDay(value) === today);
  const column = (key: string) => board.tickets.filter((t) => t.column === key).length;

  return {
    event: { id: board.event.id, name: board.event.name, dates: board.event.dates },
    today: {
      registered: recent.filter((t) => isToday(t.createdAt)).length,
      received: recent.filter((t) => isToday(t.custody?.receivedAt)).length,
      ready: recent.filter((t) => isToday(t.readyForPickupAt)).length,
      collected: recent.filter((t) => t.status === "COLLECTED" && isToday(t.closedAt)).length,
    },
    open: { dropOff: column("DROP_OFF"), toAssign: column("TO_ASSIGN"), inRepair: column("IN_REPAIR"), blocked: column("BLOCKED"), ready: column("READY") },
    stuck: board.tickets
      .filter((t) => t.stuck)
      .map((t) => ({ id: t.id, trackingCode: t.trackingCode, tagNumber: t.tagNumber, device: t.device, technician: t.technician?.name ?? null, status: t.status, since: t.since })),
    technicians,
  };
}
