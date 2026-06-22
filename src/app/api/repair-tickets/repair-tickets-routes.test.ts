import type { Notification, RepairLog, RepairTicket, User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  device: {
    findUnique: vi.fn(),
  },
  repairTicket: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  repairLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Ticket Owner",
    universityId: "SIMAD-TICKET-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "owner@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "TECHNICIAN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRepairTicket(overrides: Partial<RepairTicket> = {}) {
  return {
    id: "ticket_123",
    ticketId: "TCK-20260101-ABC123",
    deviceId: "device_123",
    technicianId: null,
    issueDescription: "Laptop battery drains too quickly during normal use.",
    photoUrl: null,
    status: "REGISTRATION_COMPLETED",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRepairTicketWithDevice(overrides: Partial<RepairTicket> = {}) {
  const ticket = buildRepairTicket(overrides);

  return {
    ...ticket,
    device: {
      id: ticket.deviceId,
      ownerId: overrides.deviceId === "other_device" ? "other_user" : "user_123",
      deviceType: "Laptop",
      brand: "Lenovo",
      model: "ThinkPad T14",
      serialNumber: "SERIAL-123",
    },
  };
}

function buildRepairTicketDetail(overrides: Partial<RepairTicket> = {}) {
  const ticket = buildRepairTicket(overrides);

  return {
    ...ticket,
    technician: ticket.technicianId
      ? {
          id: ticket.technicianId,
          fullName: ticket.technicianId === "tech_123" ? "Assigned Technician" : "Other Technician",
          email: ticket.technicianId === "tech_123" ? "tech@example.invalid" : "other-tech@example.invalid",
        }
      : null,
    device: {
      id: ticket.deviceId,
      ownerId: ticket.deviceId === "other_device" ? "other_user" : "user_123",
      deviceType: "Laptop",
      brand: "Lenovo",
      model: "ThinkPad T14",
      serialNumber: "SERIAL-123",
      owner: {
        id: ticket.deviceId === "other_device" ? "other_user" : "user_123",
        fullName: ticket.deviceId === "other_device" ? "Other User" : "Ticket Owner",
        email: ticket.deviceId === "other_device" ? "other@example.invalid" : "owner@example.invalid",
        universityId: "SIMAD-TICKET-001",
      },
    },
    logs: [
      {
        id: "log_123",
        status: "REGISTRATION_COMPLETED" as const,
        diagnosis: null,
        repairNotes: "Repair ticket registered.",
        createdAt: now,
        technician: null,
      },
    ],
  };
}

function buildRepairTicketDetailWithLogs(
  logs: Array<{
    id: string;
    status: RepairTicket["status"];
    diagnosis: string | null;
    repairNotes: string | null;
    createdAt: Date;
    technician: {
      id: string;
      fullName: string;
      email: string;
    } | null;
  }>,
  overrides: Partial<RepairTicket> = {},
) {
  const ticket = buildRepairTicketDetail(overrides);

  return {
    ...ticket,
    logs,
  };
}

function buildRepairLog(overrides: Partial<RepairLog> = {}) {
  return {
    id: "log_123",
    ticketId: "ticket_123",
    technicianId: null,
    status: "REGISTRATION_COMPLETED",
    diagnosis: null,
    repairNotes: "Repair ticket registered.",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notification_123",
    userId: "user_123",
    ticketId: "ticket_123",
    channel: "DASHBOARD",
    status: "PENDING",
    title: "Repair ticket status updated",
    message: "Ticket TCK-20260101-ABC123 moved to Device Received.",
    readAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

describe("repair ticket route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects authenticated ticket creation in favor of the public repair request flow", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "Laptop battery drains too quickly during normal use.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Authenticated requester ticket creation has been removed. Use the public repair request flow.");
    expect(mockPrisma.repairTicket.create).not.toHaveBeenCalled();
  });

  it("does not save photo references through retired authenticated ticket creation", async () => {
    const photoUrl = "repair-ticket-photos/user_123/550e8400-e29b-41d4-a716-446655440000-device-photo.png";
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "Laptop battery drains too quickly during normal use.",
          photoUrl,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Authenticated requester ticket creation has been removed. Use the public repair request flow.");
    expect(mockPrisma.repairTicket.create).not.toHaveBeenCalled();
  });

  it("returns only assigned tickets for technicians", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      buildRepairTicketWithDevice({ id: "ticket_1", technicianId: "tech_123" }),
    ]);
    mockPrisma.repairTicket.count.mockResolvedValue(1);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/repair-tickets?page=1&pageSize=10", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          technicianId: "tech_123",
        }),
      }),
    );
    expect(body.tickets).toHaveLength(1);
    vi.unstubAllEnvs();
  });

  it("allows admins to see all tickets with filters and pagination", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123", role: "ADMIN" }));
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      buildRepairTicketWithDevice({ id: "ticket_1", ticketId: "TCK-ADMIN-001", status: "DEVICE_RECEIVED" }),
      buildRepairTicketWithDevice({ id: "ticket_2", ticketId: "TCK-ADMIN-002", status: "DEVICE_RECEIVED" }),
    ]);
    mockPrisma.repairTicket.count.mockResolvedValue(12);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/repair-tickets?page=2&pageSize=2&status=DEVICE_RECEIVED&ticketId=TCK&dateFrom=2026-01-01&dateTo=2026-01-31", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 2,
        take: 2,
        where: expect.objectContaining({
          status: "DEVICE_RECEIVED",
          ticketId: {
            contains: "TCK",
            mode: "insensitive",
          },
        }),
      }),
    );
    expect(body.pagination.totalPages).toBe(6);
    vi.unstubAllEnvs();
  });

  it("treats an empty status query as an omitted filter", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123", role: "ADMIN" }));
    mockPrisma.repairTicket.findMany.mockResolvedValue([buildRepairTicketWithDevice({ id: "ticket_1" })]);
    mockPrisma.repairTicket.count.mockResolvedValue(1);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/repair-tickets?page=1&pageSize=10&status=", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          status: expect.anything(),
        }),
      }),
    );
    expect(body.tickets).toHaveLength(1);
    vi.unstubAllEnvs();
  });

  it("rejects authenticated ticket creation before device ownership checks", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "Laptop battery drains too quickly during normal use.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Authenticated requester ticket creation has been removed. Use the public repair request flow.");
    expect(mockPrisma.device.findUnique).not.toHaveBeenCalled();
  });

  it("rejects invalid ticket filter input", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123", role: "ADMIN" }));
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/repair-tickets?dateFrom=2026-02-01&dateTo=2026-01-01", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid repair ticket list query.");
    vi.unstubAllEnvs();
  });

  it("allows admins to assign tickets to technicians and creates audit records", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: "admin_123", role: "ADMIN" }))
      .mockResolvedValueOnce({ id: "tech_123", fullName: "Tech User", role: "TECHNICIAN" });
    mockPrisma.repairTicket.findUnique
      .mockResolvedValueOnce({ id: "ticket_123", ticketId: "TCK-20260101-ABC123" })
      .mockResolvedValueOnce({
        ...buildRepairTicketDetail({ id: "ticket_123", technicianId: "tech_123" }),
        technician: {
          id: "tech_123",
          fullName: "Tech User",
          email: "tech@example.invalid",
        },
      });
    mockPrisma.repairTicket.update.mockResolvedValue(buildRepairTicket({ id: "ticket_123", technicianId: "tech_123" }));
    mockPrisma.repairLog.create.mockResolvedValue(buildRepairLog({ technicianId: null }));
    mockPrisma.notification.create.mockResolvedValue({
      id: "notification_123",
    });
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
    const { PATCH } = await import("./[ticketId]/assign/route");

    const response = await PATCH(
      buildRequest("/api/repair-tickets/ticket_123/assign", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          technicianId: "tech_123",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: { technicianId: "tech_123" },
      }),
    );
    expect(mockPrisma.repairLog.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "tech_123",
          title: "New repair ticket assignment",
          message: "You have been assigned ticket TCK-20260101-ABC123.",
        }),
      }),
    );
    expect(body.ticket.technician.id).toBe("tech_123");
    vi.unstubAllEnvs();
  });

  it("blocks non-admin users from assigning technicians", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    const { PATCH } = await import("./[ticketId]/assign/route");

    const response = await PATCH(
      buildRequest("/api/repair-tickets/ticket_123/assign", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          technicianId: "tech_123",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You do not have permission to access this resource.");
    vi.unstubAllEnvs();
  });

  it("rejects assigning a non-technician user", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: "admin_123", role: "ADMIN" }))
      .mockResolvedValueOnce({ id: "lead_123", fullName: "Lead Technician User", role: "LEAD_TECHNICIAN" });
    mockPrisma.repairTicket.findUnique.mockResolvedValue({ id: "ticket_123", ticketId: "TCK-20260101-ABC123" });
    const { PATCH } = await import("./[ticketId]/assign/route");

    const response = await PATCH(
      buildRequest("/api/repair-tickets/ticket_123/assign", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          technicianId: "lead_123",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Only users with technician role can be assigned repair tickets.");
    vi.unstubAllEnvs();
  });

  it("rejects assignment for a missing ticket", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: "admin_123", role: "ADMIN" }))
      .mockResolvedValueOnce({ id: "tech_123", fullName: "Tech User", role: "TECHNICIAN" });
    mockPrisma.repairTicket.findUnique.mockResolvedValue(null);
    const { PATCH } = await import("./[ticketId]/assign/route");

    const response = await PATCH(
      buildRequest("/api/repair-tickets/missing_ticket/assign", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          technicianId: "tech_123",
        }),
      }),
      { params: Promise.resolve({ ticketId: "missing_ticket" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Repair ticket not found.");
    vi.unstubAllEnvs();
  });

  it("shows a newly assigned ticket in the technician-scoped list", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      buildRepairTicketWithDevice({ id: "ticket_123", technicianId: "tech_123" }),
    ]);
    mockPrisma.repairTicket.count.mockResolvedValue(1);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/repair-tickets?page=1&pageSize=10", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tickets).toHaveLength(1);
    expect(body.tickets[0].technicianId).toBe("tech_123");
    vi.unstubAllEnvs();
  });

  it("allows the assigned technician to move to the next status and creates log plus notification records", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    mockPrisma.repairTicket.findUnique
      .mockResolvedValueOnce({
        id: "ticket_123",
        ticketId: "TCK-20260101-ABC123",
        status: "REGISTRATION_COMPLETED",
        technicianId: "tech_123",
        device: {
          ownerId: "user_123",
        },
      })
      .mockResolvedValueOnce(
        buildRepairTicketDetail({
          id: "ticket_123",
          technicianId: "tech_123",
          status: "DEVICE_RECEIVED",
        }),
      );
    mockPrisma.repairTicket.update.mockResolvedValue(buildRepairTicket({ id: "ticket_123", technicianId: "tech_123", status: "DEVICE_RECEIVED" }));
    mockPrisma.repairLog.create.mockResolvedValue(buildRepairLog({ technicianId: "tech_123", status: "DEVICE_RECEIVED" }));
    mockPrisma.notification.create.mockResolvedValue(buildNotification());
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
    const { PATCH } = await import("./[ticketId]/status/route");

    const response = await PATCH(
      buildRequest("/api/repair-tickets/ticket_123/status", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          status: "DEVICE_RECEIVED",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: { status: "DEVICE_RECEIVED" },
      }),
    );
    expect(mockPrisma.repairLog.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user_123",
          title: "Repair ticket status updated",
          message: "Ticket TCK-20260101-ABC123 moved to Device Received.",
        }),
      }),
    );
    expect(body.ticket.status).toBe("DEVICE_RECEIVED");
    vi.unstubAllEnvs();
  });

  it("rejects skipped status transitions", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    mockPrisma.repairTicket.findUnique.mockResolvedValue({
      id: "ticket_123",
      ticketId: "TCK-20260101-ABC123",
      status: "REGISTRATION_COMPLETED",
      technicianId: "tech_123",
      device: {
        ownerId: "user_123",
      },
    });
    const { PATCH } = await import("./[ticketId]/status/route");

    const response = await PATCH(
      buildRequest("/api/repair-tickets/ticket_123/status", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          status: "READY_FOR_COLLECTION",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Repair ticket status must follow the next step in the repair journey.");
    vi.unstubAllEnvs();
  });

  it("rejects unassigned technicians from updating ticket status", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_other", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_other", role: "TECHNICIAN" }));
    mockPrisma.repairTicket.findUnique.mockResolvedValue({
      id: "ticket_123",
      ticketId: "TCK-20260101-ABC123",
      status: "REGISTRATION_COMPLETED",
      technicianId: "tech_123",
      device: {
        ownerId: "user_123",
      },
    });
    const { PATCH } = await import("./[ticketId]/status/route");

    const response = await PATCH(
      buildRequest("/api/repair-tickets/ticket_123/status", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          status: "DEVICE_RECEIVED",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Only the assigned technician or an admin can update ticket status.");
    vi.unstubAllEnvs();
  });

  it("allows the assigned technician to add a repair log", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    mockPrisma.repairTicket.findUnique
      .mockResolvedValueOnce({
        id: "ticket_123",
        status: "DEVICE_RECEIVED",
        technicianId: "tech_123",
      })
      .mockResolvedValueOnce(
        buildRepairTicketDetail({
          id: "ticket_123",
          status: "DEVICE_RECEIVED",
          technicianId: "tech_123",
        }),
      );
    mockPrisma.repairLog.create.mockResolvedValue(
      buildRepairLog({
        ticketId: "ticket_123",
        technicianId: "tech_123",
        status: "DEVICE_RECEIVED",
        diagnosis: "Power rail issue isolated to charging circuit.",
        repairNotes: "Replaced charging IC and confirmed stable boot.",
      }),
    );
    const { POST } = await import("./[ticketId]/logs/route");

    const response = await POST(
      buildRequest("/api/repair-tickets/ticket_123/logs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          diagnosis: "Power rail issue isolated to charging circuit.",
          repairNotes: "Replaced charging IC and confirmed stable boot.",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockPrisma.repairLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketId: "ticket_123",
          technicianId: "tech_123",
          status: "DEVICE_RECEIVED",
          diagnosis: "Power rail issue isolated to charging circuit.",
        }),
      }),
    );
    expect(body.ticket.logs).toHaveLength(1);
    vi.unstubAllEnvs();
  });

  it("blocks unassigned technicians from adding repair logs", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_other", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_other", role: "TECHNICIAN" }));
    mockPrisma.repairTicket.findUnique.mockResolvedValue({
      id: "ticket_123",
      status: "DEVICE_RECEIVED",
      technicianId: "tech_123",
    });
    const { POST } = await import("./[ticketId]/logs/route");

    const response = await POST(
      buildRequest("/api/repair-tickets/ticket_123/logs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          repairNotes: "Attempted note on unassigned ticket.",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Only the assigned technician or an admin can add repair logs.");
    vi.unstubAllEnvs();
  });

  it("rejects invalid repair log data", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    const { POST } = await import("./[ticketId]/logs/route");

    const response = await POST(
      buildRequest("/api/repair-tickets/ticket_123/logs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          repairNotes: "a".repeat(2001),
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid repair log data.");
    vi.unstubAllEnvs();
  });

  it("returns the ticket timeline in ascending chronological order", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123", role: "ADMIN" }));
    mockPrisma.repairTicket.findUnique.mockResolvedValue(
      buildRepairTicketDetailWithLogs([
        {
          id: "log_1",
          status: "REGISTRATION_COMPLETED",
          diagnosis: null,
          repairNotes: "Registered.",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          technician: null,
        },
        {
          id: "log_2",
          status: "DEVICE_RECEIVED",
          diagnosis: "Device intake completed.",
          repairNotes: "Received and labeled.",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          technician: {
            id: "tech_123",
            fullName: "Assigned Technician",
            email: "tech@example.invalid",
          },
        },
      ]),
    );
    const { GET } = await import("./[ticketId]/route");

    const response = await GET(
      buildRequest("/api/repair-tickets/ticket_123", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          logs: expect.objectContaining({
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          }),
        }),
      }),
    );
    expect(body.ticket.logs[0].id).toBe("log_1");
    expect(body.ticket.logs[1].id).toBe("log_2");
    vi.unstubAllEnvs();
  });

  it("requires authentication for full ticket detail", async () => {
    const { GET } = await import("./[ticketId]/route");

    const response = await GET(buildRequest("/api/repair-tickets/ticket_1"), {
      params: Promise.resolve({ ticketId: "ticket_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
    expect(mockPrisma.repairTicket.findUnique).not.toHaveBeenCalled();
  });
});
