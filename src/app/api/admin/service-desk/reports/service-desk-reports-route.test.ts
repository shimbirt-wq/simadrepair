import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

const mockGetServiceDeskReportBundle = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/service-desk/service-desk-reports", () => ({
  getServiceDeskReportBundle: mockGetServiceDeskReportBundle,
}));

const now = new Date("2026-06-18T08:00:00.000Z");

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

function buildRequest(path: string, token?: string) {
  return new Request(`http://localhost${path}`, {
    headers: token ? { cookie: `farsamotech_session=${token}` } : undefined,
  });
}

async function authToken(user: Pick<User, "id" | "role">) {
  vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
  return signSessionToken({ id: user.id, role: user.role });
}

function buildBundle() {
  return {
    overview: {
      totalTickets: 1,
      openTickets: 1,
      closedTickets: 0,
      cancelledTickets: 0,
      waitingForStudent: 0,
      waitingForReplacementPart: 0,
      readyForPickup: 0,
      devicesCurrentlyInCustody: 0,
      overdueReadyForPickup: 0,
    },
    ticketsByFaculty: [{ faculty: "Computing", count: 1 }],
    ticketsByIssueCategory: [{ issueCategory: "HARDWARE_STORAGE", count: 1 }],
    technicianWorkload: [],
    custodyExceptions: [],
    averageRepairTime: {
      weekly: [],
      byIssueCategory: [],
    },
  };
}

describe("admin service desk report route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admins to access service desk reports", async () => {
    const token = await authToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockGetServiceDeskReportBundle.mockResolvedValue(buildBundle());
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/admin/service-desk/reports", token));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reports.overview.totalTickets).toBe(1);
    expect(mockGetServiceDeskReportBundle).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("allows lead technicians to access service desk reports", async () => {
    const token = await authToken({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "lead_123", role: "LEAD_TECHNICIAN" }));
    mockGetServiceDeskReportBundle.mockResolvedValue(buildBundle());
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/admin/service-desk/reports", token));

    expect(response.status).toBe(200);
    vi.unstubAllEnvs();
  });

  it("blocks technicians from service desk reports", async () => {
    const token = await authToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/admin/service-desk/reports", token));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You do not have permission to access this resource.");
    expect(mockGetServiceDeskReportBundle).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("blocks unauthenticated access", async () => {
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/admin/service-desk/reports"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
    expect(mockGetServiceDeskReportBundle).not.toHaveBeenCalled();
  });

  it("does not expose contact or private fields in the route payload", async () => {
    const token = await authToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockGetServiceDeskReportBundle.mockResolvedValue(buildBundle());
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/admin/service-desk/reports", token));
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("pickupCodeHash");
    expect(serialized).not.toContain("checkInPhotoUrls");
    expect(serialized).not.toContain("+252");
    expect(serialized).not.toContain("admin@example.invalid");
    vi.unstubAllEnvs();
  });
});
