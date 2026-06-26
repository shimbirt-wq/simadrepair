import { Prisma, type RepairStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";

const ACTIVE_REPAIR_STATUSES: RepairStatus[] = [
  "REGISTRATION_COMPLETED",
  "DEVICE_RECEIVED",
  "DIAGNOSIS_IN_PROGRESS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_INSPECTION",
  "READY_FOR_COLLECTION",
];

const IN_REPAIR_STATUSES: RepairStatus[] = ["DIAGNOSIS_IN_PROGRESS", "REPAIR_IN_PROGRESS", "QUALITY_INSPECTION"];
const TECHNICIAN_BOARD_STATUSES: RepairStatus[] = [
  "DEVICE_RECEIVED",
  "DIAGNOSIS_IN_PROGRESS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_INSPECTION",
];
const ACTIVE_CUSTODY_STATUSES = ["RECEIVED", "IN_REPAIR_ROOM", "READY_FOR_COLLECTION"] as const;
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
  status: RepairStatus;
  statusLabel: string;
  requesterName: string;
  faculty: string;
  deviceName: string;
  issueCategory: string;
  severity: string | null;
  repairMethod: string | null;
  technicianName: string | null;
  ageHours: number;
  ageLabel: string;
};

export type DashboardStatusCount = {
  status: RepairStatus;
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
  waitingForStudent: number;
  readyForPickup: number;
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
  overdue: number;
  diagnosing: number;
  repairing: number;
  qualityCheck: number;
  statusColumns: Array<{
    status: RepairStatus;
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
  issueCategory: true,
  severity: true,
  repairMethod: true,
  createdAt: true,
  assignedAt: true,
  requester: {
    select: {
      fullName: true,
      faculty: true,
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

function getUnreadNotifications(prisma: PrismaClient, userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      status: {
        not: "READ" as const,
      },
    },
  });
}

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

function formatIssueCategory(value: string | null) {
  if (!value) {
    return "Unclassified";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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
    deviceName: `${ticket.device.brand} ${ticket.device.model}`,
    issueCategory: formatIssueCategory(ticket.issueCategory),
    severity: ticket.severity,
    repairMethod: ticket.repairMethod ? formatIssueCategory(ticket.repairMethod) : null,
    technicianName: ticket.technician?.fullName ?? null,
    ageHours,
    ageLabel: formatAgeLabel(ageHours),
  };
}

async function buildStatusCounts(prisma: PrismaClient, statuses: RepairStatus[], where: Prisma.RepairTicketWhereInput = {}) {
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

async function buildAdminDashboard(prisma: PrismaClient, user: PublicUser): Promise<AdminDashboard> {
  const sixWeeksAgo = daysAgo(42);
  const overdueDate = daysAgo(READY_PICKUP_OVERDUE_DAYS);
  const riskCutoff = daysAgo(OPEN_TICKET_RISK_DAYS);

  const [unreadNotifications, ticketCounts, custodyCounts, userCounts, weeklyClosedTicketRecords, statusBreakdown, attentionTickets] =
    await Promise.all([
      getUnreadNotifications(prisma, user.id),
      prisma.$queryRaw<
        Array<{
          total: bigint;
          open: bigint;
          closed: bigint;
          waiting_for_student: bigint;
          ready_for_pickup: bigint;
        }>
      >`
        SELECT
          COUNT(*)                                                                                      AS total,
          COUNT(*) FILTER (WHERE status = ANY(${ACTIVE_REPAIR_STATUSES}::"RepairStatus"[]))            AS open,
          COUNT(*) FILTER (WHERE status = 'DEVICE_COLLECTED'::"RepairStatus")                          AS closed,
          COUNT(*) FILTER (WHERE status = ANY(${ACTIVE_REPAIR_STATUSES}::"RepairStatus"[]) AND student_action_required IS NOT NULL) AS waiting_for_student,
          COUNT(*) FILTER (WHERE status = 'READY_FOR_COLLECTION'::"RepairStatus")                      AS ready_for_pickup
        FROM repair_tickets
      `,
      prisma.$queryRaw<
        Array<{ in_custody: bigint; exceptions: bigint }>
      >`
        SELECT
          COUNT(*) FILTER (WHERE status = ANY(${[...ACTIVE_CUSTODY_STATUSES]}::"CustodyStatus"[]) AND collected_at IS NULL)                                                                                           AS in_custody,
          COUNT(*) FILTER (WHERE status = ANY(${[...ACTIVE_CUSTODY_STATUSES]}::"CustodyStatus"[]) AND collected_at IS NULL AND (storage_location IS NULL OR ready_for_collection_at <= ${overdueDate})) AS exceptions
        FROM device_custody
      `,
      prisma.$queryRaw<
        Array<{ active_staff: bigint; active_technicians: bigint }>
      >`
        SELECT
          COUNT(*) FILTER (WHERE role IN ('ADMIN'::"UserRole",'LEAD_TECHNICIAN'::"UserRole",'TECHNICIAN'::"UserRole") AND is_active = true) AS active_staff,
          COUNT(*) FILTER (WHERE role = 'TECHNICIAN'::"UserRole"                                                    AND is_active = true) AS active_technicians
        FROM users
      `,
      prisma.repairTicket.findMany({
        where: { status: "DEVICE_COLLECTED", updatedAt: { gte: sixWeeksAgo } },
        select: { closedAt: true, completedAt: true, updatedAt: true },
      }),
      buildStatusCounts(prisma, ACTIVE_REPAIR_STATUSES),
      prisma.repairTicket.findMany({
        where: {
          status: { in: ACTIVE_REPAIR_STATUSES },
          OR: [
            { createdAt: { lte: riskCutoff } },
            { severity: { in: ["CRITICAL", "HIGH"] } },
            { technicianId: null },
            { studentActionRequired: { not: null } },
          ],
        },
        select: ticketSummarySelect,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 6,
      }),
    ]);

  const t = ticketCounts[0];
  const c = custodyCounts[0];
  const u = userCounts[0];

  const totalTickets = Number(t.total);
  const openTickets = Number(t.open);
  const closedTickets = Number(t.closed);
  const waitingForStudent = Number(t.waiting_for_student);
  const readyForPickup = Number(t.ready_for_pickup);
  const devicesInCustody = Number(c.in_custody);
  const custodyExceptions = Number(c.exceptions);
  const activeStaff = Number(u.active_staff);
  const activeTechnicians = Number(u.active_technicians);

  return {
    role: "ADMIN",
    unreadNotifications,
    totalTickets,
    openTickets,
    closedTickets,
    waitingForStudent,
    readyForPickup,
    devicesInCustody,
    custodyExceptions,
    activeStaff,
    activeTechnicians,
    weeklyClosedRepairs: buildWeeklyClosedRepairs(weeklyClosedTicketRecords),
    statusBreakdown,
    attentionTickets: attentionTickets.map(toTicketSummary),
  };
}

async function buildLeadTechnicianDashboard(prisma: PrismaClient, user: PublicUser): Promise<LeadTechnicianDashboard> {
  const riskCutoff = daysAgo(OPEN_TICKET_RISK_DAYS);

  const [unreadNotifications, ticketCounts, atRisk, workload] = await Promise.all([
    getUnreadNotifications(prisma, user.id),
    prisma.$queryRaw<
      Array<{
        new_requests: bigint;
        waiting_assignment: bigint;
        waiting_for_device: bigint;
        in_repair: bigint;
        ready_for_pickup: bigint;
        overdue: bigint;
      }>
      >`
      SELECT
        COUNT(*) FILTER (WHERE status = 'REGISTRATION_COMPLETED'::"RepairStatus")                                                                        AS new_requests,
        COUNT(*) FILTER (WHERE status = ANY(${ACTIVE_REPAIR_STATUSES}::"RepairStatus"[]) AND technician_id IS NULL)                                     AS waiting_assignment,
        COUNT(*) FILTER (WHERE status = 'REGISTRATION_COMPLETED'::"RepairStatus" AND (id NOT IN (SELECT ticket_id FROM device_custody) OR id IN (SELECT ticket_id FROM device_custody WHERE status = 'NOT_RECEIVED'::"CustodyStatus"))) AS waiting_for_device,
        COUNT(*) FILTER (WHERE status = ANY(${IN_REPAIR_STATUSES}::"RepairStatus"[]))                                                                    AS in_repair,
        COUNT(*) FILTER (WHERE status = 'READY_FOR_COLLECTION'::"RepairStatus")                                                                          AS ready_for_pickup,
        COUNT(*) FILTER (WHERE status = ANY(${ACTIVE_REPAIR_STATUSES}::"RepairStatus"[]) AND created_at <= ${riskCutoff})                               AS overdue
      FROM repair_tickets
    `,
    prisma.repairTicket.findMany({
      where: {
        status: { in: ACTIVE_REPAIR_STATUSES },
        OR: [
          { createdAt: { lte: riskCutoff } },
          { severity: { in: ["CRITICAL", "HIGH"] } },
          { studentActionRequired: { not: null } },
        ],
      },
      select: ticketSummarySelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 5,
    }),
    buildTechnicianWorkload(prisma),
  ]);

  const tc = ticketCounts[0];

  return {
    role: "LEAD_TECHNICIAN",
    unreadNotifications,
    newRequests: Number(tc.new_requests),
    waitingAssignment: Number(tc.waiting_assignment),
    waitingForDevice: Number(tc.waiting_for_device),
    inRepair: Number(tc.in_repair),
    readyForPickup: Number(tc.ready_for_pickup),
    overdue: Number(tc.overdue),
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
  const unreadNotifications = await getUnreadNotifications(prisma, user.id);

  return {
    role: "TECHNICIAN",
    unreadNotifications,
    activeRepairs: ticketSummaries.length,
    overdue: ticketSummaries.filter((ticket) => ticket.ageHours >= OPEN_TICKET_RISK_DAYS * 24).length,
    diagnosing: ticketSummaries.filter((ticket) => ticket.status === "DIAGNOSIS_IN_PROGRESS").length,
    repairing: ticketSummaries.filter((ticket) => ticket.status === "REPAIR_IN_PROGRESS").length,
    qualityCheck: ticketSummaries.filter((ticket) => ticket.status === "QUALITY_INSPECTION").length,
    statusColumns: TECHNICIAN_BOARD_STATUSES.map((status) => ({
      status,
      label: REPAIR_STATUS_LABELS[status],
      tickets: ticketSummaries.filter((ticket) => ticket.status === status),
    })),
  };
}

export async function getRoleDashboard(prisma: PrismaClient, user: PublicUser): Promise<RoleDashboard> {
  if (user.role === "ADMIN") {
    return buildAdminDashboard(prisma, user);
  }

  if (user.role === "LEAD_TECHNICIAN") {
    return buildLeadTechnicianDashboard(prisma, user);
  }

  if (user.role === "TECHNICIAN") {
    return buildTechnicianDashboard(prisma, user);
  }

  throw new Error("Dashboard is only available for internal service desk roles.");
}
