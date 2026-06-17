import type { PrismaClient, RepairStatus } from "@prisma/client";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import type { ReportDateRange } from "@/lib/validations/reports";
import { toCreatedAtRange } from "@/lib/validations/reports";

export type ReportsOverview = {
  dateRange: ReportDateRange;
  totals: {
    tickets: number;
    completed: number;
    active: number;
  };
  byStatus: Array<{ status: RepairStatus; label: string; count: number }>;
  byFaculty: Array<{ faculty: string; count: number }>;
  byDeviceType: Array<{ deviceType: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number }>;
  commonProblems: Array<{ keyword: string; count: number }>;
  technicianPerformance: Array<{
    technicianId: string;
    fullName: string;
    assignedTickets: number;
    completedTickets: number;
    averageRepairHours: number | null;
  }>;
};

const STOP_WORDS = new Set([
  "with",
  "from",
  "that",
  "this",
  "there",
  "their",
  "laptop",
  "computer",
  "device",
  "issue",
  "problem",
]);

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedCounts<K extends "faculty" | "deviceType" | "keyword">(map: Map<string, number>, keyName: K): Array<Record<K, string> & { count: number }> {
  return [...map.entries()]
    .map(([key, count]) => ({ [keyName]: key, count }) as Record<K, string> & { count: number })
    .sort((left, right) => right.count - left.count || left[keyName].localeCompare(right[keyName]));
}

function getCreatedAtFilter(input: ReportDateRange) {
  const createdAt = toCreatedAtRange(input);

  return createdAt ? { createdAt } : {};
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function extractProblemKeywords(description: string) {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
}

export async function getReportsOverview(prisma: PrismaClient, input: ReportDateRange): Promise<ReportsOverview> {
  const where = getCreatedAtFilter(input);

  const [tickets, statusGroups] = await Promise.all([
    prisma.repairTicket.findMany({
      where,
      select: {
        id: true,
        status: true,
        issueDescription: true,
        technicianId: true,
        createdAt: true,
        updatedAt: true,
        device: {
          select: {
            deviceType: true,
            owner: {
              select: {
                faculty: true,
              },
            },
          },
        },
        technician: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.repairTicket.groupBy({
      by: ["status"],
      where,
      _count: {
        _all: true,
      },
    }),
  ]);

  const facultyCounts = new Map<string, number>();
  const deviceTypeCounts = new Map<string, number>();
  const monthlyCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();
  const technicians = new Map<
    string,
    {
      technicianId: string;
      fullName: string;
      assignedTickets: number;
      completedTickets: number;
      repairHours: number[];
    }
  >();

  for (const ticket of tickets) {
    increment(facultyCounts, ticket.device.owner.faculty ?? "Unspecified");
    increment(deviceTypeCounts, ticket.device.deviceType);
    increment(monthlyCounts, monthKey(ticket.createdAt));

    for (const keyword of extractProblemKeywords(ticket.issueDescription)) {
      increment(keywordCounts, keyword);
    }

    if (ticket.technicianId && ticket.technician) {
      const technician =
        technicians.get(ticket.technicianId) ??
        {
          technicianId: ticket.technicianId,
          fullName: ticket.technician.fullName,
          assignedTickets: 0,
          completedTickets: 0,
          repairHours: [],
        };

      technician.assignedTickets += 1;

      if (ticket.status === "DEVICE_COLLECTED") {
        technician.completedTickets += 1;
        technician.repairHours.push((ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / 36e5);
      }

      technicians.set(ticket.technicianId, technician);
    }
  }

  const completed = tickets.filter((ticket) => ticket.status === "DEVICE_COLLECTED").length;

  return {
    dateRange: input,
    totals: {
      tickets: tickets.length,
      completed,
      active: tickets.length - completed,
    },
    byStatus: statusGroups
      .map((group) => ({
        status: group.status,
        label: REPAIR_STATUS_LABELS[group.status],
        count: group._count._all,
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    byFaculty: sortedCounts(facultyCounts, "faculty"),
    byDeviceType: sortedCounts(deviceTypeCounts, "deviceType"),
    monthlyTrend: [...monthlyCounts.entries()]
      .map(([month, count]) => ({ month, count }))
      .sort((left, right) => left.month.localeCompare(right.month)),
    commonProblems: sortedCounts(keywordCounts, "keyword").slice(0, 10),
    technicianPerformance: [...technicians.values()]
      .map((technician) => ({
        technicianId: technician.technicianId,
        fullName: technician.fullName,
        assignedTickets: technician.assignedTickets,
        completedTickets: technician.completedTickets,
        averageRepairHours:
          technician.repairHours.length > 0
            ? Math.round((technician.repairHours.reduce((sum, hours) => sum + hours, 0) / technician.repairHours.length) * 10) / 10
            : null,
      }))
      .sort((left, right) => right.completedTickets - left.completedTickets || left.fullName.localeCompare(right.fullName)),
  };
}
