import type { CustodyStatus, RepairStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type CountGroup<Key extends string> = {
  [K in Key]: string;
} & {
  count: number;
};

export type ServiceDeskOverview = {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  cancelledTickets: number;
  waitingForStudent: number;
  waitingForReplacementPart: number;
  readyForPickup: number;
  devicesCurrentlyInCustody: number;
  overdueReadyForPickup: number;
};

export type TicketsByFaculty = CountGroup<"faculty">;
export type TicketsByIssueCategory = CountGroup<"issueCategory">;

export type TechnicianWorkload = {
  technicianId: string;
  fullName: string;
  role: "TECHNICIAN" | "LEAD_TECHNICIAN";
  assignedTickets: number;
  completedTickets: number;
};

export type CustodyException = {
  custodyId: string;
  ticketId: string;
  trackingCode: string;
  requesterName: string | null;
  device: {
    deviceType: string;
    brand: string;
    model: string;
  };
  custodyStatus: CustodyStatus;
  storageLocation: string | null;
  receivedAt: Date | null;
  readyForCollectionAt: Date | null;
};

export type AverageRepairTimeReport = {
  weekly: Array<{ label: string; days: number; count: number }>;
  byIssueCategory: Array<{ issueCategory: string; days: number; count: number }>;
};

export type ServiceDeskReportBundle = {
  overview: ServiceDeskOverview;
  ticketsByFaculty: TicketsByFaculty[];
  ticketsByIssueCategory: TicketsByIssueCategory[];
  technicianWorkload: TechnicianWorkload[];
  custodyExceptions: CustodyException[];
  averageRepairTime: AverageRepairTimeReport;
};

const ACTIVE_CUSTODY_STATUSES: CustodyStatus[] = ["RECEIVED", "IN_REPAIR_ROOM", "READY_FOR_COLLECTION"];
const READY_PICKUP_OVERDUE_DAYS = 7;

function isClosedTicket(ticket: { status: RepairStatus; closedAt: Date | null }) {
  return ticket.status === "DEVICE_COLLECTED" || ticket.closedAt !== null;
}

function isCancelledTicket(ticket: { cancelledAt: Date | null }) {
  return ticket.cancelledAt !== null;
}

function hasText(value: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function isReadyForPickup(ticket: {
  status: RepairStatus;
  custody: { status: CustodyStatus; collectedAt: Date | null } | null;
}) {
  return ticket.status === "READY_FOR_COLLECTION" || ticket.custody?.status === "READY_FOR_COLLECTION";
}

function getReadyForPickupDate(ticket: {
  readyForPickupAt: Date | null;
  custody: { readyForCollectionAt: Date | null } | null;
}) {
  return ticket.readyForPickupAt ?? ticket.custody?.readyForCollectionAt ?? null;
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function normalizeCountLabel(value: string | null | undefined, fallback = "Unspecified") {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed.replace(/\s+/g, " ");
}

function sortedCountGroups<Key extends "faculty" | "issueCategory">(
  map: Map<string, number>,
  keyName: Key,
): CountGroup<Key>[] {
  return [...map.entries()]
    .map(([key, count]) => ({ [keyName]: key, count }) as CountGroup<Key>)
    .sort((left, right) => right.count - left.count || left[keyName].localeCompare(right[keyName]));
}

function getWeekNumber(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);

  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function roundDays(value: number) {
  return Math.round(value * 10) / 10;
}

export async function getServiceDeskOverview(): Promise<ServiceDeskOverview> {
  const [tickets, custodyRecords] = await Promise.all([
    prisma.repairTicket.findMany({
      select: {
        status: true,
        closedAt: true,
        cancelledAt: true,
        studentActionRequired: true,
        partRequirement: true,
        readyForPickupAt: true,
        custody: {
          select: {
            status: true,
            readyForCollectionAt: true,
            collectedAt: true,
          },
        },
      },
    }),
    prisma.deviceCustody.findMany({
      where: {
        status: {
          in: ACTIVE_CUSTODY_STATUSES,
        },
        collectedAt: null,
      },
      select: {
        id: true,
      },
    }),
  ]);

  const overdueCutoff = new Date(Date.now() - READY_PICKUP_OVERDUE_DAYS * 24 * 60 * 60 * 1000);
  let closedTickets = 0;
  let cancelledTickets = 0;
  let waitingForStudent = 0;
  let waitingForReplacementPart = 0;
  let readyForPickup = 0;
  let overdueReadyForPickup = 0;

  for (const ticket of tickets) {
    const closed = isClosedTicket(ticket);
    const cancelled = isCancelledTicket(ticket);
    const open = !closed && !cancelled;

    if (closed) {
      closedTickets += 1;
    }

    if (cancelled) {
      cancelledTickets += 1;
    }

    if (open && hasText(ticket.studentActionRequired)) {
      waitingForStudent += 1;
    }

    if (open && hasText(ticket.partRequirement)) {
      waitingForReplacementPart += 1;
    }

    if (open && isReadyForPickup(ticket)) {
      readyForPickup += 1;
      const readyDate = getReadyForPickupDate(ticket);

      if (readyDate && readyDate <= overdueCutoff) {
        overdueReadyForPickup += 1;
      }
    }
  }

  return {
    totalTickets: tickets.length,
    openTickets: tickets.length - closedTickets - cancelledTickets,
    closedTickets,
    cancelledTickets,
    waitingForStudent,
    waitingForReplacementPart,
    readyForPickup,
    devicesCurrentlyInCustody: custodyRecords.length,
    overdueReadyForPickup,
  };
}

export async function getTicketsByFaculty(): Promise<TicketsByFaculty[]> {
  const tickets = await prisma.repairTicket.findMany({
    select: {
      requester: {
        select: {
          faculty: true,
        },
      },
    },
  });
  const counts = new Map<string, number>();

  for (const ticket of tickets) {
    increment(counts, normalizeCountLabel(ticket.requester?.faculty));
  }

  return sortedCountGroups(counts, "faculty");
}

export async function getTicketsByIssueCategory(): Promise<TicketsByIssueCategory[]> {
  const tickets = await prisma.repairTicket.findMany({
    select: {
      issueCategory: true,
    },
  });
  const counts = new Map<string, number>();

  for (const ticket of tickets) {
    increment(counts, normalizeCountLabel(ticket.issueCategory));
  }

  return sortedCountGroups(counts, "issueCategory");
}

export async function getTechnicianWorkload(): Promise<TechnicianWorkload[]> {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      technicianId: {
        not: null,
      },
    },
    select: {
      technicianId: true,
      status: true,
      closedAt: true,
      technician: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });
  const workload = new Map<string, TechnicianWorkload>();

  for (const ticket of tickets) {
    if (!ticket.technician || (ticket.technician.role !== "TECHNICIAN" && ticket.technician.role !== "LEAD_TECHNICIAN")) {
      continue;
    }

    const current =
      workload.get(ticket.technician.id) ??
      ({
        technicianId: ticket.technician.id,
        fullName: ticket.technician.fullName,
        role: ticket.technician.role,
        assignedTickets: 0,
        completedTickets: 0,
      } satisfies TechnicianWorkload);

    current.assignedTickets += 1;

    if (isClosedTicket(ticket)) {
      current.completedTickets += 1;
    }

    workload.set(ticket.technician.id, current);
  }

  return [...workload.values()].sort(
    (left, right) => right.assignedTickets - left.assignedTickets || left.fullName.localeCompare(right.fullName),
  );
}

export async function getCustodyExceptions(): Promise<CustodyException[]> {
  const custodyRecords = await prisma.deviceCustody.findMany({
    where: {
      status: {
        in: ACTIVE_CUSTODY_STATUSES,
      },
      collectedAt: null,
    },
    select: {
      id: true,
      status: true,
      storageLocation: true,
      receivedAt: true,
      readyForCollectionAt: true,
      ticket: {
        select: {
          id: true,
          ticketId: true,
          trackingCode: true,
          requester: {
            select: {
              fullName: true,
            },
          },
          device: {
            select: {
              deviceType: true,
              brand: true,
              model: true,
            },
          },
        },
      },
    },
    orderBy: [{ readyForCollectionAt: "asc" }, { receivedAt: "asc" }, { id: "asc" }],
  });

  return custodyRecords.map((record) => ({
    custodyId: record.id,
    ticketId: record.ticket.id,
    trackingCode: record.ticket.trackingCode ?? record.ticket.ticketId,
    requesterName: record.ticket.requester?.fullName ?? null,
    device: record.ticket.device,
    custodyStatus: record.status,
    storageLocation: record.storageLocation,
    receivedAt: record.receivedAt,
    readyForCollectionAt: record.readyForCollectionAt,
  }));
}

export async function getAverageRepairTime(): Promise<AverageRepairTimeReport> {
  const closedTickets = await prisma.repairTicket.findMany({
    where: {
      OR: [{ status: "DEVICE_COLLECTED" }, { closedAt: { not: null } }, { completedAt: { not: null } }],
    },
    select: {
      status: true,
      issueCategory: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      closedAt: true,
    },
  });

  const weekly = new Map<string, { totalDays: number; count: number }>();
  const issueCategories = new Map<string, { totalDays: number; count: number }>();

  for (const ticket of closedTickets) {
    const completedAt = ticket.closedAt ?? ticket.completedAt ?? (ticket.status === "DEVICE_COLLECTED" ? ticket.updatedAt : null);

    if (!completedAt) {
      continue;
    }

    const days = daysBetween(ticket.createdAt, completedAt);
    const weekLabel = `W${getWeekNumber(completedAt)}`;
    const category = normalizeCountLabel(ticket.issueCategory);
    const currentWeek = weekly.get(weekLabel) ?? { totalDays: 0, count: 0 };
    const currentCategory = issueCategories.get(category) ?? { totalDays: 0, count: 0 };

    currentWeek.totalDays += days;
    currentWeek.count += 1;
    currentCategory.totalDays += days;
    currentCategory.count += 1;
    weekly.set(weekLabel, currentWeek);
    issueCategories.set(category, currentCategory);
  }

  return {
    weekly: [...weekly.entries()]
      .map(([label, value]) => ({ label, days: roundDays(value.totalDays / value.count), count: value.count }))
      .sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true }))
      .slice(-5),
    byIssueCategory: [...issueCategories.entries()]
      .map(([issueCategory, value]) => ({ issueCategory, days: roundDays(value.totalDays / value.count), count: value.count }))
      .sort((left, right) => right.days - left.days || right.count - left.count || left.issueCategory.localeCompare(right.issueCategory))
      .slice(0, 6),
  };
}

export async function getServiceDeskReportBundle(): Promise<ServiceDeskReportBundle> {
  const [overview, ticketsByFaculty, ticketsByIssueCategory, technicianWorkload, custodyExceptions, averageRepairTime] = await Promise.all([
    getServiceDeskOverview(),
    getTicketsByFaculty(),
    getTicketsByIssueCategory(),
    getTechnicianWorkload(),
    getCustodyExceptions(),
    getAverageRepairTime(),
  ]);

  return {
    overview,
    ticketsByFaculty,
    ticketsByIssueCategory,
    technicianWorkload,
    custodyExceptions,
    averageRepairTime,
  };
}
