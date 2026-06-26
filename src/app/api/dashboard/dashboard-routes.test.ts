import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

const mockDashboardService = vi.hoisted(() => ({
  getRoleDashboard: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/dashboard/dashboard-service", () => mockDashboardService);

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Dashboard User",
    universityId: "SIMAD-DASH-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "dash@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "ADMIN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

async function buildSessionCookie(user: Pick<User, "id" | "role">) {
  vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
  const token = await signSessionToken({ id: user.id, role: user.role });

  return `simadrepair_session=${token}`;
}

describe("dashboard route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns admin dashboard data for admins", async () => {
    const user = buildUser({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockDashboardService.getRoleDashboard.mockResolvedValue({
      role: "ADMIN",
      openTickets: 6,
    });
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/dashboard", {
        headers: {
          cookie: await buildSessionCookie(user),
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockDashboardService.getRoleDashboard).toHaveBeenCalledWith(mockPrisma, expect.objectContaining({ id: "admin_123" }));
    expect(body.dashboard.role).toBe("ADMIN");
    expect(body.dashboard.openTickets).toBe(6);
  });

  it("returns lead technician dashboard data for lead technicians", async () => {
    const user = buildUser({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockDashboardService.getRoleDashboard.mockResolvedValue({
      role: "LEAD_TECHNICIAN",
      newRequests: 3,
    });
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/dashboard", {
        headers: {
          cookie: await buildSessionCookie(user),
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.dashboard.role).toBe("LEAD_TECHNICIAN");
    expect(body.dashboard.newRequests).toBe(3);
  });

  it("returns technician dashboard data for technicians", async () => {
    const user = buildUser({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockDashboardService.getRoleDashboard.mockResolvedValue({
      role: "TECHNICIAN",
      activeRepairs: 4,
    });
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/dashboard", {
        headers: {
          cookie: await buildSessionCookie(user),
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.dashboard.role).toBe("TECHNICIAN");
    expect(body.dashboard.activeRepairs).toBe(4);
  });

  it("rejects unauthenticated dashboard access", async () => {
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/dashboard"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
  });
});

