import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAverageRepairTime,
  getCustodyExceptions,
  getServiceDeskOverview,
  getServiceDeskReportBundle,
  getTechnicianWorkload,
  getTicketsByFaculty,
  getTicketsByIssueCategory,
} from "@/lib/service-desk/service-desk-reports";

const mockPrisma = vi.hoisted(() => ({
  repairTicket: {
    findMany: vi.fn(),
  },
  deviceCustody: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-06-18T08:00:00.000Z");
const oldReadyDate = new Date("2026-06-01T08:00:00.000Z");

function buildOverviewTicket(overrides: Record<string, unknown> = {}) {
  return {
    status: "REPAIR_IN_PROGRESS",
    closedAt: null,
    cancelledAt: null,
    studentActionRequired: null,
    partRequirement: null,
    readyForPickupAt: null,
    custody: null,
    ...overrides,
  };
}

function buildCustodyException(overrides: Record<string, unknown> = {}) {
  return {
    id: "custody_123",
    status: "READY_FOR_COLLECTION",
    storageLocation: "Shelf A3",
    receivedAt: now,
    readyForCollectionAt: oldReadyDate,
    ticket: {
      id: "ticket_123",
      ticketId: "SIM-2026-000001",
      trackingCode: "SIM-2026-000001",
      requester: {
        fullName: "Asha Mohamed",
      },
      device: {
        deviceType: "Laptop",
        brand: "HP",
        model: "EliteBook",
      },
    },
    ...overrides,
  };
}

describe("service desk reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes overview counts from representative tickets", async () => {
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      buildOverviewTicket({ status: "DIAGNOSIS_IN_PROGRESS", studentActionRequired: "Bring charger." }),
      buildOverviewTicket({ status: "REPAIR_IN_PROGRESS", partRequirement: "SSD replacement." }),
      buildOverviewTicket({
        status: "READY_FOR_COLLECTION",
        readyForPickupAt: oldReadyDate,
        custody: { status: "READY_FOR_COLLECTION", readyForCollectionAt: oldReadyDate, collectedAt: null },
      }),
      buildOverviewTicket({ status: "DEVICE_COLLECTED", closedAt: now }),
      buildOverviewTicket({ status: "REGISTRATION_COMPLETED", cancelledAt: now }),
    ]);
    mockPrisma.deviceCustody.findMany.mockResolvedValue([{ id: "custody_1" }, { id: "custody_2" }]);

    const overview = await getServiceDeskOverview();

    expect(overview).toEqual({
      totalTickets: 5,
      openTickets: 3,
      closedTickets: 1,
      cancelledTickets: 1,
      waitingForStudent: 1,
      waitingForReplacementPart: 1,
      readyForPickup: 1,
      devicesCurrentlyInCustody: 2,
      overdueReadyForPickup: 1,
    });
  });

  it("groups tickets by requester faculty", async () => {
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      { requester: { faculty: "Computing" } },
      { requester: { faculty: "  Computing  " } },
      { requester: { faculty: "Computing   " } },
      { requester: { faculty: null } },
    ]);

    await expect(getTicketsByFaculty()).resolves.toEqual([
      { faculty: "Computing", count: 3 },
      { faculty: "Unspecified", count: 1 },
    ]);
  });

  it("groups tickets by issue category", async () => {
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      { issueCategory: "HARDWARE_STORAGE" },
      { issueCategory: "HARDWARE_STORAGE" },
      { issueCategory: null },
    ]);

    await expect(getTicketsByIssueCategory()).resolves.toEqual([
      { issueCategory: "HARDWARE_STORAGE", count: 2 },
      { issueCategory: "Unspecified", count: 1 },
    ]);
  });

  it("summarizes technician workload without contact fields", async () => {
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      {
        technicianId: "tech_123",
        status: "REPAIR_IN_PROGRESS",
        closedAt: null,
        technician: {
          id: "tech_123",
          fullName: "Technician User",
          role: "TECHNICIAN",
          email: "tech@example.invalid",
          passwordHash: "must-not-leak",
        },
      },
      {
        technicianId: "tech_123",
        status: "DEVICE_COLLECTED",
        closedAt: now,
        technician: {
          id: "tech_123",
          fullName: "Technician User",
          role: "TECHNICIAN",
        },
      },
    ]);

    const workload = await getTechnicianWorkload();
    const serialized = JSON.stringify(workload);

    expect(workload).toEqual([
      {
        technicianId: "tech_123",
        fullName: "Technician User",
        role: "TECHNICIAN",
        assignedTickets: 2,
        completedTickets: 1,
      },
    ]);
    expect(serialized).not.toContain("tech@example.invalid");
    expect(serialized).not.toContain("must-not-leak");
  });

  it("returns custody exceptions with only internal-safe fields", async () => {
    mockPrisma.deviceCustody.findMany.mockResolvedValue([
      buildCustodyException({
        checkInPhotoUrls: ["private/photo.jpg"],
        pickupCodeHash: "hash",
      }),
    ]);

    const exceptions = await getCustodyExceptions();
    const serialized = JSON.stringify(exceptions);

    expect(exceptions).toEqual([
      {
        custodyId: "custody_123",
        ticketId: "ticket_123",
        trackingCode: "SIM-2026-000001",
        requesterName: "Asha Mohamed",
        device: {
          deviceType: "Laptop",
          brand: "HP",
          model: "EliteBook",
        },
        custodyStatus: "READY_FOR_COLLECTION",
        storageLocation: "Shelf A3",
        receivedAt: now,
        readyForCollectionAt: oldReadyDate,
      },
    ]);
    expect(serialized).not.toContain("private/photo.jpg");
    expect(serialized).not.toContain("hash");
    expect(serialized).not.toContain("phone");
    expect(serialized).not.toContain("email");
  });

  it("computes average repair time from closed tickets", async () => {
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      {
        status: "DEVICE_COLLECTED",
        issueCategory: "HARDWARE_STORAGE",
        createdAt: new Date("2026-06-01T08:00:00.000Z"),
        updatedAt: new Date("2026-06-04T20:00:00.000Z"),
        completedAt: null,
        closedAt: null,
      },
      {
        status: "DEVICE_COLLECTED",
        issueCategory: "HARDWARE_STORAGE",
        createdAt: new Date("2026-06-02T08:00:00.000Z"),
        updatedAt: new Date("2026-06-03T08:00:00.000Z"),
        completedAt: null,
        closedAt: new Date("2026-06-03T08:00:00.000Z"),
      },
    ]);

    const report = await getAverageRepairTime();

    expect(report.byIssueCategory).toEqual([{ issueCategory: "HARDWARE_STORAGE", days: 2.3, count: 2 }]);
    expect(report.weekly).toEqual([{ label: "W23", days: 2.3, count: 2 }]);
  });

  it("combines the service desk report bundle", async () => {
    mockPrisma.repairTicket.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ requester: { faculty: "Computing" } }])
      .mockResolvedValueOnce([{ issueCategory: "HARDWARE_STORAGE" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockPrisma.deviceCustody.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const bundle = await getServiceDeskReportBundle();

    expect(bundle.overview.totalTickets).toBe(0);
    expect(bundle.ticketsByFaculty).toEqual([{ faculty: "Computing", count: 1 }]);
    expect(bundle.ticketsByIssueCategory).toEqual([{ issueCategory: "HARDWARE_STORAGE", count: 1 }]);
    expect(bundle.technicianWorkload).toEqual([]);
    expect(bundle.custodyExceptions).toEqual([]);
    expect(bundle.averageRepairTime).toEqual({ weekly: [], byIssueCategory: [] });
  });
});
