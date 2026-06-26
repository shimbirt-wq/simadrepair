import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { createPublicRepairRequest, PublicRepairRequestValidationError } from "@/lib/service-desk/public-requests";

const mockPrisma = vi.hoisted(() => ({
  requester: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  device: {
    create: vi.fn(),
  },
  repairTicket: {
    count: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  trackingCodeCounter: {
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
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

const validPublicRequest = {
  requester: {
    requesterType: "STUDENT",
    fullName: "Asha Mohamed",
    universityId: "SIMAD-2026-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610000111",
    email: "asha@example.invalid",
  },
  deviceType: "Laptop",
  brand: "HP",
  model: "EliteBook",
  issueCategory: "PERFORMANCE_SLOW",
  issueDescription: "Laptop takes more than ten minutes to start and becomes slow during class work.",
};

function setupSuccessfulCreate() {
  mockPrisma.requester.findMany.mockResolvedValue([]);
  mockPrisma.requester.create.mockResolvedValue({ id: "requester_123" });
  mockPrisma.device.create.mockResolvedValue({ id: "device_123" });
  mockPrisma.repairTicket.count.mockResolvedValue(0);
  mockPrisma.repairTicket.findFirst.mockResolvedValue(null);
  mockPrisma.trackingCodeCounter.update.mockResolvedValue({ lastValue: 1 });
  mockPrisma.trackingCodeCounter.create.mockResolvedValue({ lastValue: 1 });
  mockPrisma.repairTicket.create.mockResolvedValue({
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    status: "REGISTRATION_COMPLETED",
    createdAt: now,
  });
  mockPrisma.repairTicket.findUnique.mockResolvedValue({
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    issueCategory: "PERFORMANCE_SLOW",
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
  });
  mockPrisma.user.findFirst.mockResolvedValue({
    id: "lead_123",
    fullName: "Lead Technician",
    email: "lead@example.invalid",
    phone: "+252610001111",
  });
  mockPrisma.notification.create.mockResolvedValue({
    id: "notification_123",
    userId: "lead_123",
    ticketId: "ticket_123",
    channel: "DASHBOARD",
    status: "PENDING",
    title: "Repair request received",
    message: "We received ticket SIM-2026-000001.",
    readAt: null,
    createdAt: now,
    updatedAt: now,
  });
  mockPrisma.repairEvent.create.mockResolvedValue({ id: "event_123" });
  mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
}

describe("createPublicRepairRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSuccessfulCreate();
  });

  it("creates a public requester, device, repair ticket, and initial repair event", async () => {
    const result = await createPublicRepairRequest(validPublicRequest);

    expect(result).toEqual({
      trackingCode: "SIM-2026-000001",
      requesterName: "Asha Mohamed",
      submittedAt: now,
      status: "REGISTRATION_COMPLETED",
      message: "Repair request submitted.",
    });
    expect(mockPrisma.requester.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: "Asha Mohamed",
          universityId: "SIMAD-2026-001",
          phone: "+252610000111",
        }),
      }),
    );
    expect(mockPrisma.device.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: null,
          requesterId: "requester_123",
          deviceType: "Laptop",
        }),
      }),
    );
    expect(mockPrisma.repairTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketId: "SIM-2026-000001",
          trackingCode: "SIM-2026-000001",
          requesterId: "requester_123",
          deviceId: "device_123",
          issueCategory: "PERFORMANCE_SLOW",
          status: "REGISTRATION_COMPLETED",
          severity: null,
          repairMethod: null,
          pickupCodeHash: null,
        }),
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "TICKET_CREATED",
          note: "Public repair request submitted",
        }),
      }),
    );
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "lead_123",
          ticketId: "ticket_123",
          channel: "DASHBOARD",
          status: "PENDING",
          title: "Repair request received",
        }),
      }),
    );
  });

  it("retries when a tracking code create collides", async () => {
    const collision = new Prisma.PrismaClientKnownRequestError("Unique constraint failed on tracking code", {
      clientVersion: "test",
      code: "P2002",
      meta: {
        target: ["tracking_code"],
      },
    });

    mockPrisma.$transaction
      .mockRejectedValueOnce(collision)
      .mockImplementationOnce(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));

    const result = await createPublicRepairRequest(validPublicRequest);

    expect(result.trackingCode).toBe("SIM-2026-000001");
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("rejects missing required fields", async () => {
    await expect(createPublicRepairRequest({ requester: { phone: "" }, issueDescription: "" })).rejects.toBeInstanceOf(
      PublicRepairRequestValidationError,
    );
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("reuses a requester by exact university id when one match exists", async () => {
    mockPrisma.requester.findMany.mockResolvedValueOnce([{ id: "existing_requester" }]);

    await createPublicRepairRequest(validPublicRequest);

    expect(mockPrisma.requester.create).not.toHaveBeenCalled();
    expect(mockPrisma.device.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requesterId: "existing_requester",
        }),
      }),
    );
  });

  it("reuses a requester by exact phone when university id is not provided", async () => {
    mockPrisma.requester.findMany.mockResolvedValueOnce([{ id: "phone_requester" }]);

    await createPublicRepairRequest({
      ...validPublicRequest,
      requester: {
        ...validPublicRequest.requester,
        universityId: undefined,
      },
    });

    expect(mockPrisma.requester.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { phone: "+252610000111" },
      }),
    );
    expect(mockPrisma.requester.create).not.toHaveBeenCalled();
    expect(mockPrisma.device.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requesterId: "phone_requester",
        }),
      }),
    );
  });
});
