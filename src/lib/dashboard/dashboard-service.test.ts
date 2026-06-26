import type { PrismaClient, UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicUser } from "@/lib/auth/public-user";
import { getRoleDashboard } from "@/lib/dashboard/dashboard-service";

const now = new Date("2026-01-01T00:00:00.000Z");
const zero = BigInt(0);
const one = BigInt(1);
const two = BigInt(2);

function buildUser(role: UserRole): PublicUser {
  return {
    id: `${role.toLowerCase()}_123`,
    fullName: `${role} User`,
    universityId: "SIMAD-DASH-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: `${role.toLowerCase()}@example.invalid`,
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

function getQueryText(strings: TemplateStringsArray | string) {
  return typeof strings === "string" ? strings : strings.join("?");
}

function buildMockPrisma() {
  const queryTexts: string[] = [];

  const prisma = {
    notification: {
      count: vi.fn().mockResolvedValue(0),
    },
    repairTicket: {
      groupBy: vi.fn().mockResolvedValue([]),
      findMany: vi.fn().mockResolvedValue([]),
    },
    $queryRaw: vi.fn((strings: TemplateStringsArray | string) => {
      const queryText = getQueryText(strings);
      queryTexts.push(queryText);

      if (queryText.includes("active_staff")) {
        return Promise.resolve([{ active_staff: two, active_technicians: one }]);
      }

      if (queryText.includes("in_custody")) {
        return Promise.resolve([{ in_custody: zero, exceptions: zero }]);
      }

      if (queryText.includes("new_requests")) {
        return Promise.resolve([
          {
            new_requests: zero,
            waiting_assignment: zero,
            waiting_for_device: zero,
            in_repair: zero,
            ready_for_pickup: zero,
            overdue: zero,
          },
        ]);
      }

      return Promise.resolve([
        {
          total: zero,
          open: zero,
          closed: zero,
          waiting_for_student: zero,
          ready_for_pickup: zero,
        },
      ]);
    }),
  };

  return { prisma: prisma as unknown as PrismaClient, queryTexts };
}

describe("getRoleDashboard", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("builds admin dashboard data without throwing", async () => {
    const { prisma } = buildMockPrisma();

    await expect(getRoleDashboard(prisma, buildUser("ADMIN"))).resolves.toMatchObject({
      role: "ADMIN",
      openTickets: 0,
      closedTickets: 0,
    });
  });

  it("builds lead technician dashboard data without throwing", async () => {
    const { prisma } = buildMockPrisma();

    await expect(getRoleDashboard(prisma, buildUser("LEAD_TECHNICIAN"))).resolves.toMatchObject({
      role: "LEAD_TECHNICIAN",
      newRequests: 0,
      waitingAssignment: 0,
    });
  });

  it("builds technician dashboard data without throwing", async () => {
    const { prisma } = buildMockPrisma();

    await expect(getRoleDashboard(prisma, buildUser("TECHNICIAN"))).resolves.toMatchObject({
      role: "TECHNICIAN",
      activeRepairs: 0,
      statusColumns: expect.any(Array),
    });
  });

  it("casts raw SQL enum comparisons to Postgres enum types", async () => {
    const { prisma, queryTexts } = buildMockPrisma();

    await getRoleDashboard(prisma, buildUser("ADMIN"));
    await getRoleDashboard(prisma, buildUser("LEAD_TECHNICIAN"));

    const sql = queryTexts.join("\n");

    expect(sql).toContain('::"RepairStatus"[]');
    expect(sql).toContain('::"CustodyStatus"[]');
    expect(sql).toContain('::"UserRole"');
    expect(sql).not.toContain("::text[]");
  });
});
