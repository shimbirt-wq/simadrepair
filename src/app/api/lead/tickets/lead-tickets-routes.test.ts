import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  repairTicket: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  repairEvent: {
    create: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-06-18T08:00:00.000Z");
const later = new Date("2026-06-18T09:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "lead_123",
    fullName: "Lead Technician",
    universityId: "SIMAD-LEAD-001",
    faculty: "Computing",
    department: "Maintenance",
    phone: "+252610001111",
    email: "lead@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "LEAD_TECHNICIAN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

async function authCookie(user: Pick<User, "id" | "role">) {
  vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
  const token = await signSessionToken({ id: user.id, role: user.role });

  return `farsamotech_session=${token}`;
}

function buildQueueTicket() {
  return {
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    status: "REGISTRATION_COMPLETED",
    issueCategory: "PERFORMANCE_SLOW",
    createdAt: now,
    severity: null,
    repairMethod: null,
    requester: {
      fullName: "Asha Mohamed",
      requesterType: "STUDENT",
      universityId: "SIMAD-2026-001",
      faculty: "Computing",
      department: "Computer Science",
    },
    device: {
      deviceType: "Laptop",
      brand: "HP",
      model: "EliteBook",
    },
    technician: null,
  };
}

function buildTicketMutationRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    status: "REGISTRATION_COMPLETED",
    severity: null,
    repairMethod: null,
    technicianId: null,
    ...overrides,
  };
}

function buildTicketDetail(overrides: Record<string, unknown> = {}) {
  return {
    ...buildQueueTicket(),
    severity: "HIGH",
    repairMethod: "HARDWARE_REPAIR",
    issueDescription: "Laptop is very slow and sometimes fails to boot.",
    photoUrl: null,
    triageNotes: "Likely storage issue.",
    studentActionRequired: null,
    partRequirement: null,
    triagedAt: later,
    assignedAt: later,
    readyForPickupAt: null,
    requester: {
      fullName: "Asha Mohamed",
      requesterType: "STUDENT",
      universityId: "SIMAD-2026-001",
      faculty: "Computing",
      department: "Computer Science",
      phone: "+252610000111",
      email: "asha@example.invalid",
    },
    device: {
      id: "device_123",
      deviceType: "Laptop",
      brand: "HP",
      model: "EliteBook",
      serialNumber: "SN-123",
      assetTag: null,
      description: null,
    },
    technician: {
      id: "tech_123",
      fullName: "Tech User",
      email: "tech@example.invalid",
      role: "TECHNICIAN",
    },
    triagedBy: {
      id: "lead_123",
      fullName: "Lead Technician",
      email: "lead@example.invalid",
      role: "LEAD_TECHNICIAN",
    },
    custody: null,
    events: [
      {
        id: "event_123",
        eventType: "TRIAGE_UPDATED",
        actorRole: "LEAD_TECHNICIAN",
        statusFrom: "REGISTRATION_COMPLETED",
        statusTo: "REGISTRATION_COMPLETED",
        custodyFrom: null,
        custodyTo: null,
        note: "Lead triage updated",
        metadata: {
          severity: "HIGH",
          repairMethod: "HARDWARE_REPAIR",
        },
        createdAt: later,
        actor: {
          id: "lead_123",
          fullName: "Lead Technician",
          email: "lead@example.invalid",
          role: "LEAD_TECHNICIAN",
        },
      },
    ],
    ...overrides,
  };
}

describe("lead ticket route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
  });

  it("allows lead technicians to list the triage queue", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findMany.mockResolvedValue([buildQueueTicket()]);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/lead/tickets", {
        headers: { cookie },
      }),
    );
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ triagedAt: null }, { technicianId: null }]),
        }),
      }),
    );
    expect(body.tickets).toHaveLength(1);
    expect(serialized).not.toContain("passwordHash");
    vi.unstubAllEnvs();
  });

  it("allows admins to list the triage queue", async () => {
    const cookie = await authCookie({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123", role: "ADMIN" }));
    mockPrisma.repairTicket.findMany.mockResolvedValue([buildQueueTicket()]);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/lead/tickets", {
        headers: { cookie },
      }),
    );

    expect(response.status).toBe(200);
    vi.unstubAllEnvs();
  });

  it("blocks technicians from listing the lead triage queue", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/lead/tickets", {
        headers: { cookie },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You do not have permission to access this resource.");
    expect(mockPrisma.repairTicket.findMany).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("blocks unauthenticated users from listing the lead triage queue", async () => {
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/lead/tickets"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
    expect(mockPrisma.repairTicket.findMany).not.toHaveBeenCalled();
  });

  it("allows lead technicians to update triage and creates a repair event", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst
      .mockResolvedValueOnce(buildTicketMutationRecord())
      .mockResolvedValueOnce(buildTicketDetail());
    mockPrisma.repairTicket.update.mockResolvedValue(buildTicketMutationRecord({ severity: "HIGH" }));
    mockPrisma.repairEvent.create.mockResolvedValue({ id: "event_123" });
    const { PATCH } = await import("./[ticketId]/triage/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/SIM-2026-000001/triage", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          severity: "HIGH",
          repairMethod: "HARDWARE_REPAIR",
          triageNotes: "Likely storage issue.",
        }),
      }),
      { params: Promise.resolve({ ticketId: "SIM-2026-000001" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: expect.objectContaining({
          severity: "HIGH",
          repairMethod: "HARDWARE_REPAIR",
          triagedById: "lead_123",
          triageNotes: "Likely storage issue.",
        }),
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "TRIAGE_UPDATED",
          actorId: "lead_123",
        }),
      }),
    );
    expect(body.ticket.severity).toBe("HIGH");
    vi.unstubAllEnvs();
  });

  it("requires severity and repair method for triage updates", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { PATCH } = await import("./[ticketId]/triage/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/triage", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          triageNotes: "Needs classification.",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid lead triage data.");
    expect(mockPrisma.repairTicket.update).not.toHaveBeenCalled();
    expect(mockPrisma.repairEvent.create).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("allows lead technicians to assign active technicians and creates a repair event", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser())
      .mockResolvedValueOnce({
        id: "tech_123",
        fullName: "Tech User",
        role: "TECHNICIAN",
        isActive: true,
      })
      .mockResolvedValueOnce({
        id: "tech_123",
        fullName: "Tech User",
        email: "tech@example.invalid",
        phone: "+252610002222",
      });
    mockPrisma.repairTicket.findFirst
      .mockResolvedValueOnce(buildTicketMutationRecord())
      .mockResolvedValueOnce(buildTicketDetail());
    mockPrisma.repairTicket.findUnique.mockResolvedValue({
      id: "ticket_123",
      ticketId: "SIM-2026-000001",
      trackingCode: "SIM-2026-000001",
      issueCategory: "PERFORMANCE_SLOW",
      studentActionRequired: null,
      technicianId: "tech_123",
      requester: {
        fullName: "Asha Mohamed",
      },
      device: {
        ownerId: null,
        deviceType: "Laptop",
        brand: "HP",
      },
    });
    mockPrisma.repairTicket.update.mockResolvedValue(buildTicketMutationRecord({ technicianId: "tech_123" }));
    mockPrisma.repairEvent.create.mockResolvedValue({ id: "event_123" });
    mockPrisma.notification.create.mockResolvedValue({
      id: "notification_123",
      userId: "tech_123",
      ticketId: "ticket_123",
      channel: "DASHBOARD",
      status: "PENDING",
      title: "Technician assigned",
      message: "A technician has been assigned to ticket SIM-2026-000001.",
      readAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const { PATCH } = await import("./[ticketId]/assign/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/SIM-2026-000001/assign", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          technicianId: "tech_123",
        }),
      }),
      { params: Promise.resolve({ ticketId: "SIM-2026-000001" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: expect.objectContaining({
          technicianId: "tech_123",
          assignedAt: expect.any(Date),
        }),
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "TECHNICIAN_ASSIGNED",
          actorId: "lead_123",
          metadata: expect.objectContaining({
            technicianId: "tech_123",
          }),
        }),
      }),
    );
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "tech_123",
          ticketId: "ticket_123",
          channel: "DASHBOARD",
          status: "PENDING",
          title: "Technician assigned",
        }),
      }),
    );
    expect(body.ticket.technician.id).toBe("tech_123");
    vi.unstubAllEnvs();
  });

  it("rejects assigning inactive or non-technician users", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser())
      .mockResolvedValueOnce({
        id: "lead_456",
        fullName: "Lead Tech User",
        role: "LEAD_TECHNICIAN",
        isActive: true,
      });
    mockPrisma.repairTicket.findFirst.mockResolvedValueOnce(buildTicketMutationRecord());
    const { PATCH } = await import("./[ticketId]/assign/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/assign", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          technicianId: "student_123",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Only active technicians or lead technicians can be assigned repair tickets.");
    expect(mockPrisma.repairTicket.update).not.toHaveBeenCalled();
    expect(mockPrisma.repairEvent.create).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
