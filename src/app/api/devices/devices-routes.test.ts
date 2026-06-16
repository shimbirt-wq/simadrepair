import type { Device, User } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  device: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Device Owner",
    universityId: "SIMAD-DEVICE-001",
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

function buildDevice(overrides: Partial<Device> = {}) {
  return {
    id: "device_123",
    ownerId: "user_123",
    deviceType: "Laptop",
    brand: "Lenovo",
    model: "ThinkPad",
    serialNumber: "SERIAL-123",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildDeviceWithOwner(overrides: Partial<Device> = {}) {
  const device = buildDevice(overrides);

  return {
    ...device,
    owner: {
      id: device.ownerId,
      fullName: "Device Owner",
      email: "owner@example.invalid",
      universityId: "SIMAD-DEVICE-001",
    },
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

describe("device route handlers", () => {
  it("creates a valid device for the authenticated user", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.device.create.mockResolvedValue(buildDeviceWithOwner());
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/devices", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          deviceType: "Laptop",
          brand: "Lenovo",
          model: "ThinkPad",
          serialNumber: "SERIAL-123",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.device.ownerId).toBe("user_123");
    expect(mockPrisma.device.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: "user_123",
        }),
      }),
    );
    vi.unstubAllEnvs();
  });

  it("rejects missing required device fields", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/devices", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          deviceType: "Laptop",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid device data.");
    vi.unstubAllEnvs();
  });

  it("prevents a non-admin user from creating a device for another owner", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/devices", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          ownerId: "other_user",
          deviceType: "Laptop",
          brand: "Lenovo",
          model: "ThinkPad",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You can only create devices for your own account.");
    vi.unstubAllEnvs();
  });

  it("prevents a user from reading another user's device", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.device.findUnique.mockResolvedValue(buildDeviceWithOwner({ ownerId: "other_user" }));
    const { GET } = await import("./[deviceId]/route");

    const response = await GET(
      buildRequest("/api/devices/device_123", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
      { params: Promise.resolve({ deviceId: "device_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You do not have permission to access this device.");
    vi.unstubAllEnvs();
  });

  it("allows an admin to look up devices with pagination", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123", role: "ADMIN" }));
    mockPrisma.device.findMany.mockResolvedValue([
      buildDeviceWithOwner({ id: "device_1", brand: "Dell", ownerId: "user_1" }),
      buildDeviceWithOwner({ id: "device_2", brand: "HP", ownerId: "user_2" }),
    ]);
    mockPrisma.device.count.mockResolvedValue(12);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/devices?page=2&pageSize=2&query=laptop", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 2,
        take: 2,
      }),
    );
    expect(body.devices).toHaveLength(2);
    expect(body.pagination.totalPages).toBe(6);
    vi.unstubAllEnvs();
  });
});
