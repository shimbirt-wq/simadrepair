import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  repairTicket: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "admin_123",
    fullName: "Admin User",
    universityId: "SIMAD-ADMIN-001",
    faculty: "Computing",
    department: "IT",
    phone: "+252610001111",
    email: "admin@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "ADMIN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, token: string) {
  return new Request(`http://localhost${path}`, {
    headers: {
      cookie: `simadrepair_session=${token}`,
    },
  });
}

describe("reports route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admin report access", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    const { GET } = await import("./overview/route");

    const response = await GET(buildRequest("/api/reports/overview", token));

    expect(response.status).toBe(403);
    vi.unstubAllEnvs();
  });

  it("validates report date filters", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { GET } = await import("./overview/route");

    const response = await GET(buildRequest("/api/reports/overview?dateFrom=2026-02-01&dateTo=2026-01-01", token));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid report filters.");
    vi.unstubAllEnvs();
  });

  it("returns admin aggregate reports", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findMany.mockResolvedValue([]);
    mockPrisma.repairTicket.groupBy.mockResolvedValue([]);
    const { GET } = await import("./overview/route");

    const response = await GET(buildRequest("/api/reports/overview?dateFrom=2026-01-01&dateTo=2026-01-31", token));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.overview.totals).toEqual({ tickets: 0, completed: 0, active: 0 });
    expect(mockPrisma.repairTicket.findMany).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });
});

