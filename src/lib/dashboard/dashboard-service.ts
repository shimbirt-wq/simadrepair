import { Prisma, type TicketStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import { TICKET_STATUS_LABELS as REPAIR_STATUS_LABELS } from "@/lib/tickets/status-display";
import { OPEN_REPAIR_STATUSES } from "@/lib/tickets/workflow";

const ACTIVE_REPAIR_STATUSES: TicketStatus[] = ["SUBMITTED", ...OPEN_REPAIR_STATUSES, "READY_FOR_PICKUP"];

const READY_PICKUP_OVERDUE_DAYS = 7;
const OPEN_TICKET_RISK_DAYS = 4;

type DashboardBase = {
  role: Extract<PublicUser["role"], "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN">;
  unreadNotifications: number;
};

export type DashboardTicketSummary = {
  id: string;
  ticketId: string;
  trackingCode: string;
  status: TicketStatus;
  statusLabel: string;
  requesterName: string;
  faculty: string;
  requesterPhone: string | null;
  deviceName: string;
  technicianName: string | null;
  ageHours: number;
  ageLabel: string;
};

export type DashboardStatusCount = {
  status: TicketStatus;
  label: string;
  count: number;
};

export type DashboardWorkload = {
  technicianId: string;
  fullName: string;
  activeTickets: number;
};

export type AdminDashboard = DashboardBase & {
  role: "ADMIN";
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  waitingAssignment: number;
  readyForPickup: number;
  devicesNotReceived: number;
  devicesInCustody: number;
  custodyExceptions: number;
  activeStaff: number;
  activeTechnicians: number;
  weeklyClosedRepairs: Array<{ label: string; count: number }>;
  statusBreakdown: DashboardStatusCount[];
  attentionTickets: DashboardTicketSummary[];
};

export type LeadTechnicianDashboard = DashboardBase & {
  role: "LEAD_TECHNICIAN";
  newRequests: number;
  waitingAssignment: number;
  waitingForDevice: number;
  inRepair: number;
  readyForPickup: number;
  overdue: number;
  atRiskTickets: DashboardTicketSummary[];
  workloadByTechnician: DashboardWorkload[];
};

export type TechnicianDashboard = DashboardBase & {
  role: "TECHNICIAN";
  activeRepairs: number;
  waitingToStart: number;
  inRepair: number;
  readyForPickup: number;
  overdue: number;
  statusColumns: Array<{
    status: TicketStatus;
    label: string;
    tickets: DashboardTicketSummary[];
  }>;
};

export type RoleDashboard = AdminDashboard | LeadTechnicianDashboard | TechnicianDashboard;

const ticketSummarySelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  id: true,
  ticketId: true,
  trackingCode: true,
  status: true,
  createdAt: true,
  assignedAt: true,
  requester: {
    select: {
      fullName: true,
      faculty: true,
      phone: true,
    },
  },
  device: {
    select: {
      deviceType: true,
      brand: true,
      model: true,
    },
  },
  technician: {
    select: {
      id: true,
      fullName: true,
    },
  },
});

type TicketSummaryRecord = Prisma.RepairTicketGetPayload<{ select: typeof ticketSummarySelect }>;

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function getAgeHours(value: Date) {
  return Math.max(0, Math.floor((Date.now() - value.getTime()) / (60 * 60 * 1000)));
}

function formatAgeLabel(ageHours: number) {
  if (ageHours < 24) {
    return `${ageHours}h`;
  }

  const days = Math.floor(ageHours / 24);
  const hours = ageHours % 24;

  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

function toTicketSummary(ticket: TicketSummaryRecord): DashboardTicketSummary {
  const ageHours = getAgeHours(ticket.createdAt);

  return {
    id: ticket.id,
    ticketId: ticket.ticketId,
    trackingCode: ticket.trackingCode ?? ticket.ticketId,
    status: ticket.status,
    statusLabel: REPAIR_STATUS_LABELS[ticket.status],
    requesterName: ticket.requester?.fullName ?? "Requester",
    faculty: ticket.requester?.faculty ?? "Faculty not set",
    requesterPhone: ticket.requester?.phone ?? null,
    deviceName: `${ticket.device.brand} ${ticket.device.model}`,
    technicianName: ticket.technician?.fullName ?? null,
    ageHours,
    ageLabel: formatAgeLabel(ageHours),
  };
}

async function buildStatusCounts(prisma: PrismaClient, statuses: TicketStatus[], where: Prisma.RepairTicketWhereInput = {}) {
  const rows = await prisma.repairTicket.groupBy({
    by: ["status"],
    where: { ...where, status: { in: statuses } },
    _count: { id: true },
  });
  const countMap = new Map(rows.map((r) => [r.status, r._count.id]));
  return statuses.map((status) => ({
    status,
    label: REPAIR_STATUS_LABELS[status],
    count: countMap.get(status) ?? 0,
  }));
}

function getWeekNumber(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);

  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

function buildWeeklyClosedRepairs(tickets: Array<{ closedAt: Date | null; completedAt: Date | null; updatedAt: Date }>) {
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const date = daysAgo((5 - index) * 7);

    return {
      label: `W${getWeekNumber(date)}`,
      weekStart: daysAgo((6 - index) * 7),
      weekEnd: daysAgo((5 - index) * 7),
      count: 0,
    };
  });

  for (const ticket of tickets) {
    const closedAt = ticket.closedAt ?? ticket.completedAt ?? ticket.updatedAt;
    const bucket = weeks.find((week, index) =>
      index === weeks.length - 1 ? closedAt >= week.weekStart : closedAt >= week.weekStart && closedAt < week.weekEnd,
    );

    if (bucket) {
      bucket.count += 1;
    }
  }

  return weeks.map(({ label, count }) => ({ label, count }));
}

async function buildTechnicianWorkload(prisma: PrismaClient): Promise<DashboardWorkload[]> {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      technicianId: {
        not: null,
      },
      status: {
        in: ACTIVE_REPAIR_STATUSES,
      },
    },
    select: {
      technician: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });
  const workload = new Map<string, DashboardWorkload>();

  for (const ticket of tickets) {
    if (!ticket.technician) {
      continue;
    }

    const current = workload.get(ticket.technician.id) ?? {
      technicianId: ticket.technician.id,
      fullName: ticket.technician.fullName,
      activeTickets: 0,
    };

    current.activeTickets += 1;
    workload.set(ticket.technician.id, current);
  }

  return [...workload.values()]
    .sort((left, right) => right.activeTickets - left.activeTickets || left.fullName.localeCompare(right.fullName))
    .slice(0, 5);
}

async function buildAdminDashboard(prisma: PrismaClient): Promise<AdminDashboard> {
  const sixWeeksAgo = daysAgo(42);
  const overdueDate = daysAgo(READY_PICKUP_OVERDUE_DAYS);
  const riskCutoff = daysAgo(OPEN_TICKET_RISK_DAYS);

  const [
    totalTickets,
    openTickets,
    closedTickets,
    waitingAssignment,
    readyForPickup,
    devicesNotReceived,
    devicesInCustody,
    custodyExceptions,
    activeStaff,
    activeTechnicians,
    weeklyClosedTicketRecords,
    statusBreakdown,
    attentionTickets,
  ] = await Promise.all([
    prisma.repairTicket.count(),
    prisma.repairTicket.count({ where: { status: { in: ACTIVE_REPAIR_STATUSES } } }),
    prisma.repairTicket.count({ where: { status: "COLLECTED" } }),
    prisma.repairTicket.count({ where: { status: { in: ACTIVE_REPAIR_STATUSES }, technicianId: null } }),
    prisma.repairTicket.count({ where: { status: "READY_FOR_PICKUP" } }),
    prisma.repairTicket.count({ where: { status: "SUBMITTED" } }),
    prisma.repairTicket.count({ where: { status: { in: [...OPEN_REPAIR_STATUSES, "READY_FOR_PICKUP", "CANNOT_BE_REPAIRED"] } } }),
    prisma.deviceCustody.count({
      where: {
        receivedAt: { not: null },
        collectedAt: null,
        ticket: { status: { notIn: ["COLLECTED", "CANCELLED"] } },
        OR: [{ storageLocation: null }, { readyForCollectionAt: { lte: overdueDate } }],
      },
    }),
    prisma.user.count({ where: { role: { in: ["ADMIN", "LEAD_TECHNICIAN", "TECHNICIAN"] }, isActive: true } }),
    prisma.user.count({ where: { role: "TECHNICIAN", isActive: true } }),
    prisma.repairTicket.findMany({
      where: { status: "COLLECTED", updatedAt: { gte: sixWeeksAgo } },
      select: { closedAt: true, completedAt: true, updatedAt: true },
    }),
    buildStatusCounts(prisma, ACTIVE_REPAIR_STATUSES),
    prisma.repairTicket.findMany({
      where: {
        status: { in: ACTIVE_REPAIR_STATUSES },
        OR: [{ createdAt: { lte: riskCutoff } }, { technicianId: null }],
      },
      select: ticketSummarySelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 6,
    }),
  ]);

  return {
    role: "ADMIN",
    unreadNotifications: 0,
    totalTickets,
    openTickets,
    closedTickets,
    waitingAssignment,
    readyForPickup,
    devicesNotReceived,
    devicesInCustody,
    custodyExceptions,
    activeStaff,
    activeTechnicians,
    weeklyClosedRepairs: buildWeeklyClosedRepairs(weeklyClosedTicketRecords),
    statusBreakdown,
    attentionTickets: attentionTickets.map(toTicketSummary),
  };
}

async function buildLeadTechnicianDashboard(prisma: PrismaClient): Promise<LeadTechnicianDashboard> {
  const riskCutoff = daysAgo(OPEN_TICKET_RISK_DAYS);

  const [newRequests, waitingAssignment, waitingForDevice, inRepair, readyForPickup, overdue, atRisk, workload] =
    await Promise.all([
      prisma.repairTicket.count({ where: { status: "SUBMITTED" } }),
      prisma.repairTicket.count({ where: { status: { in: ACTIVE_REPAIR_STATUSES }, technicianId: null } }),
      prisma.repairTicket.count({ where: { status: "SUBMITTED" } }),
      prisma.repairTicket.count({ where: { status: "IN_REPAIR" } }),
      prisma.repairTicket.count({ where: { status: "READY_FOR_PICKUP" } }),
      prisma.repairTicket.count({ where: { status: { in: ACTIVE_REPAIR_STATUSES }, createdAt: { lte: riskCutoff } } }),
      prisma.repairTicket.findMany({
        where: {
          status: { in: ACTIVE_REPAIR_STATUSES },
          OR: [{ createdAt: { lte: riskCutoff } }, { technicianId: null }],
        },
        select: ticketSummarySelect,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 5,
      }),
      buildTechnicianWorkload(prisma),
    ]);

  return {
    role: "LEAD_TECHNICIAN",
    unreadNotifications: 0,
    newRequests,
    waitingAssignment,
    waitingForDevice,
    inRepair,
    readyForPickup,
    overdue,
    atRiskTickets: atRisk.map(toTicketSummary),
    workloadByTechnician: workload,
  };
}

async function buildTechnicianDashboard(prisma: PrismaClient, user: PublicUser): Promise<TechnicianDashboard> {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      technicianId: user.id,
      status: {
        in: ACTIVE_REPAIR_STATUSES,
      },
    },
    select: ticketSummarySelect,
    orderBy: [{ assignedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
  const ticketSummaries = tickets.map(toTicketSummary);

  return {
    role: "TECHNICIAN",
    unreadNotifications: 0,
    activeRepairs: ticketSummaries.length,
    overdue: ticketSummaries.filter((ticket) => ticket.ageHours >= OPEN_TICKET_RISK_DAYS * 24).length,
    waitingToStart: ticketSummaries.filter((ticket) => ticket.status === "RECEIVED").length,
    inRepair: ticketSummaries.filter((ticket) => ticket.status === "IN_REPAIR").length,
    readyForPickup: ticketSummaries.filter((ticket) => ticket.status === "READY_FOR_PICKUP").length,
    statusColumns: (["RECEIVED", "IN_REPAIR", "READY_FOR_PICKUP"] satisfies TicketStatus[]).map((status) => ({
      status,
      label: REPAIR_STATUS_LABELS[status],
      tickets: ticketSummaries.filter((ticket) => ticket.status === status),
    })),
  };
}

export async function getRoleDashboard(prisma: PrismaClient, user: PublicUser): Promise<RoleDashboard> {
  if (user.role === "ADMIN") {
    return buildAdminDashboard(prisma);
  }

  if (user.role === "LEAD_TECHNICIAN") {
    return buildLeadTechnicianDashboard(prisma);
  }

  if (user.role === "TECHNICIAN") {
    return buildTechnicianDashboard(prisma, user);
  }

  throw new Error("Dashboard is only available for internal service desk roles.");
}
