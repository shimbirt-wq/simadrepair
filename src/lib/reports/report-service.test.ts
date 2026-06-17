import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { getReportsOverview } from "./report-service";

const janOne = new Date("2026-01-01T08:00:00.000Z");
const janTwo = new Date("2026-01-02T10:00:00.000Z");
const janThree = new Date("2026-01-03T12:00:00.000Z");

function buildMockPrisma() {
  return {
    repairTicket: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe("report service", () => {
  it("returns compact aggregate report data without private user fields", async () => {
    const prisma = buildMockPrisma();

    vi.mocked(prisma.repairTicket.findMany).mockResolvedValue([
      {
        id: "ticket_1",
        status: "DEVICE_COLLECTED",
        issueDescription: "Battery drains quickly and laptop overheats.",
        technicianId: "tech_1",
        createdAt: janOne,
        updatedAt: janTwo,
        device: {
          deviceType: "Laptop",
          owner: {
            faculty: "Computing",
          },
        },
        technician: {
          id: "tech_1",
          fullName: "Repair Technician",
        },
      },
      {
        id: "ticket_2",
        status: "REPAIR_IN_PROGRESS",
        issueDescription: "Display flickers during lectures.",
        technicianId: null,
        createdAt: janThree,
        updatedAt: janThree,
        device: {
          deviceType: "Desktop",
          owner: {
            faculty: "Engineering",
          },
        },
        technician: null,
      },
    ] as never);
    vi.mocked(prisma.repairTicket.groupBy).mockResolvedValue([
      { status: "DEVICE_COLLECTED", _count: { _all: 1 } },
      { status: "REPAIR_IN_PROGRESS", _count: { _all: 1 } },
    ] as never);

    const overview = await getReportsOverview(prisma, { dateFrom: "2026-01-01", dateTo: "2026-01-31" });

    expect(overview.totals).toEqual({ tickets: 2, completed: 1, active: 1 });
    expect(overview.byFaculty).toContainEqual({ faculty: "Computing", count: 1 });
    expect(overview.byDeviceType).toContainEqual({ deviceType: "Laptop", count: 1 });
    expect(overview.commonProblems).toContainEqual({ keyword: "battery", count: 1 });
    expect(overview.technicianPerformance).toEqual([
      {
        technicianId: "tech_1",
        fullName: "Repair Technician",
        assignedTickets: 1,
        completedTickets: 1,
        averageRepairHours: 26,
      },
    ]);
    expect(JSON.stringify(overview)).not.toContain("password");
    expect(prisma.repairTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date("2026-01-01T00:00:00.000Z"),
            lte: new Date("2026-01-31T23:59:59.999Z"),
          },
        },
      }),
    );
  });
});
