import { beforeEach, describe, expect, it, vi } from "vitest";

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
  },
  trackingCodeCounter: {
    create: vi.fn(),
    update: vi.fn(),
  },
  repairEvent: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-06-18T08:00:00.000Z");

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/public/repair-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

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

describe("public repair request route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockPrisma.repairEvent.create.mockResolvedValue({ id: "event_123" });
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
  });

  it("creates a public repair request without requiring login", async () => {
    const { POST } = await import("./route");

    const response = await POST(buildRequest(validPublicRequest));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.request).toEqual({
      trackingCode: "SIM-2026-000001",
      requesterName: "Asha Mohamed",
      submittedAt: now.toISOString(),
      status: "REGISTRATION_COMPLETED",
      message: "Repair request submitted.",
    });
    expect(body.request.pickupCodeHash).toBeUndefined();
    expect(body.request.triageNotes).toBeUndefined();
    expect(body.request.technician).toBeUndefined();
  });

  it("returns 400 for invalid payloads", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest({
        requester: {
          requesterType: "STUDENT",
          fullName: "",
          phone: "",
        },
        issueDescription: "",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid public repair request data.");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("logs unexpected create failures and returns a safe 500 response", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockPrisma.$transaction.mockRejectedValueOnce(new Error("database unavailable"));
    const { POST } = await import("./route");

    const response = await POST(buildRequest(validPublicRequest));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("An unexpected error occurred.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Public repair request submission failed.",
      expect.objectContaining({
        message: "database unavailable",
        name: "Error",
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});
