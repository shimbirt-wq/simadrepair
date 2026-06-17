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
    role: "STUDENT",
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

  it("creates a valid ticket for an owned device", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.device.findUnique.mockResolvedValue({ id: "device_123", ownerId: "user_123" });
    mockPrisma.repairTicket.findUnique.mockResolvedValue(null);
    mockPrisma.repairTicket.create.mockResolvedValue(buildRepairTicketWithDevice());
    mockPrisma.repairLog.create.mockResolvedValue(buildRepairLog());
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "Laptop battery drains too quickly during normal use.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ticket.ticketId).toMatch(/^TCK-\d{8}-[A-Z0-9]{6}$/);
    expect(body.ticket.status).toBe("REGISTRATION_COMPLETED");
    expect(mockPrisma.repairLog.create).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("returns only owned tickets for students", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      buildRepairTicketWithDevice({ id: "ticket_1", ticketId: "TCK-OWN-001" }),
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
          device: {
            ownerId: "user_123",
          },
        }),
      }),
    );
    expect(body.tickets).toHaveLength(1);
    vi.unstubAllEnvs();
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

  it("rejects another user's device on creation", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.device.findUnique.mockResolvedValue({ id: "device_123", ownerId: "other_user" });
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "Laptop battery drains too quickly during normal use.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You can only create tickets for your own devices.");
    vi.unstubAllEnvs();
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
    expect(body.ticket.technician.id).toBe("tech_123");
    vi.unstubAllEnvs();
  });

  it("blocks non-admin users from assigning technicians", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "user_123", role: "STUDENT" }));
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
      .mockResolvedValueOnce({ id: "student_123", fullName: "Student User", role: "STUDENT" });
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
          technicianId: "student_123",
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

  it("rejects students from updating ticket status", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "user_123", role: "STUDENT" }));
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

  it("rejects unauthorized ticket detail access", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findUnique.mockResolvedValue(buildRepairTicketDetail({ id: "ticket_1", deviceId: "other_device" }));
    const { GET } = await import("./[ticketId]/route");

    const response = await GET(
      buildRequest("/api/repair-tickets/ticket_1", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
      { params: Promise.resolve({ ticketId: "ticket_1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You do not have permission to access this repair ticket.");
    vi.unstubAllEnvs();
  });
});
