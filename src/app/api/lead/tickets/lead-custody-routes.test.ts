import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  repairTicket: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  deviceCustody: {
    create: vi.fn(),
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

function buildMutationTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    status: "REPAIR_IN_PROGRESS",
    deviceId: "device_123",
    custody: null,
    ...overrides,
  };
}

function buildCustody(status = "RECEIVED", overrides: Record<string, unknown> = {}) {
  return {
    id: "custody_123",
    status,
    receivedAt: now,
    condition: "Good",
    screenCondition: "No cracks",
    keyboardCondition: null,
    batteryCondition: null,
    bodyCondition: null,
    accessories: ["Charger"],
    storageLocation: "Shelf A3",
    checkInPhotoUrls: [],
    releasedById: null,
    readyForCollectionAt: null,
    collectedByName: null,
    collectedByPhone: null,
    collectedAt: null,
    pickupCodeVerifiedAt: null,
    receivedBy: {
      id: "lead_123",
      fullName: "Lead Technician",
      email: "lead@example.invalid",
      role: "LEAD_TECHNICIAN",
    },
    releasedBy: null,
    ...overrides,
  };
}

function buildCustodyDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    status: "REPAIR_IN_PROGRESS",
    severity: "HIGH",
    repairMethod: "HARDWARE_REPAIR",
    issueCategory: "HARDWARE_STORAGE",
    createdAt: now,
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
    custody: buildCustody(),
    ...overrides,
  };
}

function buildNotificationTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    issueCategory: "HARDWARE_STORAGE",
    studentActionRequired: null,
    technicianId: null,
    requester: {
      fullName: "Asha Mohamed",
    },
    device: {
      ownerId: null,
      deviceType: "Laptop",
      brand: "HP",
    },
    ...overrides,
  };
}

function buildNotification() {
  return {
    id: "notification_123",
    userId: "lead_123",
    ticketId: "ticket_123",
    channel: "DASHBOARD",
    status: "PENDING",
    title: "Device ready for pickup",
    message: "Your HP Laptop for ticket SIM-2026-000001 is ready for collection at the service desk.",
    readAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe("lead custody route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
  });

  it("allows lead technicians to check in a device and creates a repair event", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket({ status: "REGISTRATION_COMPLETED" }));
    mockPrisma.repairTicket.findUnique.mockResolvedValue(buildCustodyDetail({ status: "DEVICE_RECEIVED" }));
    const { POST } = await import("./[ticketId]/custody/route");

    const response = await POST(
      buildRequest("/api/lead/tickets/ticket_123/custody", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          condition: "Good",
          screenCondition: "No cracks",
          accessories: ["Charger"],
          storageLocation: "Shelf A3",
          checkInPhotoUrls: ["private/photo-1.jpg"],
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockPrisma.deviceCustody.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketId: "ticket_123",
          deviceId: "device_123",
          status: "RECEIVED",
          receivedById: "lead_123",
          storageLocation: "Shelf A3",
          checkInPhotoUrls: ["private/photo-1.jpg"],
        }),
      }),
    );
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: {
          status: "DEVICE_RECEIVED",
        },
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "STATUS_CHANGED",
          statusFrom: "REGISTRATION_COMPLETED",
          statusTo: "DEVICE_RECEIVED",
        }),
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "CUSTODY_CHANGED",
          statusFrom: "REGISTRATION_COMPLETED",
          statusTo: "DEVICE_RECEIVED",
          custodyFrom: "NOT_RECEIVED",
          custodyTo: "RECEIVED",
          metadata: expect.objectContaining({
            hasCheckInPhotos: true,
          }),
        }),
      }),
    );
    expect(body.custody.custody.status).toBe("RECEIVED");
    vi.unstubAllEnvs();
  });

  it("allows admins to check in a device", async () => {
    const cookie = await authCookie({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123", role: "ADMIN" }));
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket());
    mockPrisma.repairTicket.findUnique.mockResolvedValue(buildCustodyDetail());
    const { POST } = await import("./[ticketId]/custody/route");

    const response = await POST(
      buildRequest("/api/lead/tickets/ticket_123/custody", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          storageLocation: "Shelf A3",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.deviceCustody.create).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("blocks technicians from checking in devices", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    const { POST } = await import("./[ticketId]/custody/route");

    const response = await POST(
      buildRequest("/api/lead/tickets/ticket_123/custody", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          storageLocation: "Shelf A3",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(403);
    expect(mockPrisma.repairTicket.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.deviceCustody.create).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("blocks unauthenticated custody check-in", async () => {
    const { POST } = await import("./[ticketId]/custody/route");

    const response = await POST(
      buildRequest("/api/lead/tickets/ticket_123/custody", {
        method: "POST",
        body: JSON.stringify({
          storageLocation: "Shelf A3",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(401);
    expect(mockPrisma.deviceCustody.create).not.toHaveBeenCalled();
  });

  it("requires storage location for custody check-in", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { POST } = await import("./[ticketId]/custody/route");

    const response = await POST(
      buildRequest("/api/lead/tickets/ticket_123/custody", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          condition: "Good",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid device custody check-in data.");
    expect(mockPrisma.deviceCustody.create).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("moves custody through a valid lifecycle transition", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket({ custody: { id: "custody_123", status: "RECEIVED" } }));
    mockPrisma.repairTicket.findUnique.mockResolvedValue(buildCustodyDetail({ custody: buildCustody("IN_REPAIR_ROOM") }));
    const { PATCH } = await import("./[ticketId]/custody/status/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/custody/status", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          status: "IN_REPAIR_ROOM",
          note: "Moved to repair bench.",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.deviceCustody.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "custody_123" },
        data: { status: "IN_REPAIR_ROOM" },
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "CUSTODY_CHANGED",
          custodyFrom: "RECEIVED",
          custodyTo: "IN_REPAIR_ROOM",
        }),
      }),
    );
    vi.unstubAllEnvs();
  });

  it("creates a ready-for-pickup notification when custody is ready for collection", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "lead_123",
      fullName: "Lead Technician",
      email: "lead@example.invalid",
      phone: "+252610001111",
    });
    mockPrisma.repairTicket.findFirst.mockResolvedValue(
      buildMutationTicket({ status: "QUALITY_INSPECTION", custody: { id: "custody_123", status: "IN_REPAIR_ROOM" } }),
    );
    mockPrisma.repairTicket.findUnique
      .mockResolvedValueOnce(buildCustodyDetail({ status: "READY_FOR_COLLECTION", custody: buildCustody("READY_FOR_COLLECTION") }))
      .mockResolvedValueOnce(buildNotificationTicket());
    mockPrisma.notification.create.mockResolvedValue(buildNotification());
    const { PATCH } = await import("./[ticketId]/custody/status/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/custody/status", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          status: "READY_FOR_COLLECTION",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: expect.objectContaining({
          status: "READY_FOR_COLLECTION",
          readyForPickupAt: expect.any(Date),
        }),
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "READY_FOR_PICKUP",
          statusFrom: "QUALITY_INSPECTION",
          statusTo: "READY_FOR_COLLECTION",
          custodyFrom: "IN_REPAIR_ROOM",
          custodyTo: "READY_FOR_COLLECTION",
        }),
      }),
    );
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "lead_123",
          ticketId: "ticket_123",
          title: "Device ready for pickup",
        }),
      }),
    );
    vi.unstubAllEnvs();
  });

  it("requires quality inspection before custody can be marked ready for collection", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(
      buildMutationTicket({ status: "REPAIR_IN_PROGRESS", custody: { id: "custody_123", status: "IN_REPAIR_ROOM" } }),
    );
    const { PATCH } = await import("./[ticketId]/custody/status/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/custody/status", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          status: "READY_FOR_COLLECTION",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Repair ticket must pass quality inspection before the device can be marked ready for collection.");
    expect(mockPrisma.deviceCustody.update).not.toHaveBeenCalled();
    expect(mockPrisma.repairTicket.update).not.toHaveBeenCalled();
    expect(mockPrisma.repairEvent.create).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("rejects invalid custody transitions", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket({ custody: { id: "custody_123", status: "RECEIVED" } }));
    const { PATCH } = await import("./[ticketId]/custody/status/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/custody/status", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          status: "READY_FOR_COLLECTION",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(409);
    expect(mockPrisma.deviceCustody.update).not.toHaveBeenCalled();
    expect(mockPrisma.repairEvent.create).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("requires ready-for-collection custody before pickup", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket({ custody: { id: "custody_123", status: "IN_REPAIR_ROOM" } }));
    const { PATCH } = await import("./[ticketId]/custody/pickup/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/custody/pickup", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          collectedByName: "Asha Mohamed",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(409);
    expect(mockPrisma.deviceCustody.update).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("requires ready-for-collection ticket status before pickup", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(
      buildMutationTicket({
        status: "QUALITY_INSPECTION",
        custody: { id: "custody_123", status: "READY_FOR_COLLECTION" },
      }),
    );
    const { PATCH } = await import("./[ticketId]/custody/pickup/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/custody/pickup", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          collectedByName: "Asha Mohamed",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Repair ticket must be ready for collection before device pickup can be confirmed.");
    expect(mockPrisma.deviceCustody.update).not.toHaveBeenCalled();
    expect(mockPrisma.repairTicket.update).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("confirms pickup, stores collector info, updates compatible ticket status, and creates an event", async () => {
    const cookie = await authCookie({ id: "lead_123", role: "LEAD_TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(
      buildMutationTicket({
        status: "READY_FOR_COLLECTION",
        custody: { id: "custody_123", status: "READY_FOR_COLLECTION" },
      }),
    );
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "lead_123",
      fullName: "Lead Technician",
      email: "lead@example.invalid",
      phone: "+252610001111",
    });
    mockPrisma.repairTicket.findUnique
      .mockResolvedValueOnce(
        buildCustodyDetail({
          status: "DEVICE_COLLECTED",
          custody: buildCustody("COLLECTED", {
            collectedByName: "Asha Mohamed",
            collectedByPhone: "+252610000111",
            collectedAt: now,
            pickupCodeVerifiedAt: now,
          }),
        }),
      )
      .mockResolvedValueOnce(buildNotificationTicket());
    mockPrisma.notification.create.mockResolvedValue({
      ...buildNotification(),
      title: "Repair ticket closed",
    });
    const { PATCH } = await import("./[ticketId]/custody/pickup/route");

    const response = await PATCH(
      buildRequest("/api/lead/tickets/ticket_123/custody/pickup", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          collectedByName: "Asha Mohamed",
          collectedByPhone: "+252610000111",
          pickupCode: "123456",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.deviceCustody.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "custody_123" },
        data: expect.objectContaining({
          status: "COLLECTED",
          releasedById: "lead_123",
          collectedByName: "Asha Mohamed",
          collectedByPhone: "+252610000111",
          collectedAt: expect.any(Date),
          pickupCodeVerifiedAt: expect.any(Date),
        }),
      }),
    );
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: expect.objectContaining({
          status: "DEVICE_COLLECTED",
          closedAt: expect.any(Date),
        }),
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "PICKUP_CONFIRMED",
          custodyFrom: "READY_FOR_COLLECTION",
          custodyTo: "COLLECTED",
          statusFrom: "READY_FOR_COLLECTION",
          statusTo: "DEVICE_COLLECTED",
          metadata: expect.objectContaining({
            collectedByName: "Asha Mohamed",
            pickupCodeProvided: true,
          }),
        }),
      }),
    );
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "lead_123",
          ticketId: "ticket_123",
          title: "Repair ticket closed",
        }),
      }),
    );
    vi.unstubAllEnvs();
  });
});
