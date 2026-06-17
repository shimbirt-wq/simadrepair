import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  repairTicket: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-01-01T00:00:00.000Z");

describe("lookup route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid ticket IDs", async () => {
    const { GET } = await import("./[ticketId]/route");

    const response = await GET(new Request("http://localhost/api/lookup/not-a-ticket"), {
      params: Promise.resolve({ ticketId: "not-a-ticket" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns not found for unknown tickets", async () => {
    mockPrisma.repairTicket.findUnique.mockResolvedValue(null);
    const { GET } = await import("./[ticketId]/route");

    const response = await GET(new Request("http://localhost/api/lookup/TCK-20260101-ABC123"), {
      params: Promise.resolve({ ticketId: "TCK-20260101-ABC123" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns limited lookup data without owner details or notes", async () => {
    mockPrisma.repairTicket.findUnique.mockResolvedValue({
      ticketId: "TCK-20260101-ABC123",
      status: "DEVICE_RECEIVED",
      createdAt: now,
      updatedAt: now,
      device: {
        deviceType: "Laptop",
      },
    });
    const { GET } = await import("./[ticketId]/route");

    const response = await GET(new Request("http://localhost/api/lookup/TCK-20260101-ABC123"), {
      params: Promise.resolve({ ticketId: "TCK-20260101-ABC123" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ticket).toEqual(
      expect.objectContaining({
        ticketId: "TCK-20260101-ABC123",
        statusLabel: "Device Received",
        deviceType: "Laptop",
      }),
    );
    expect(body.ticket.owner).toBeUndefined();
    expect(body.ticket.logs).toBeUndefined();
    expect(body.ticket.issueDescription).toBeUndefined();
    expect(body.ticket.photoUrl).toBeUndefined();
    expect(body.ticket.technician).toBeUndefined();
  });
});
