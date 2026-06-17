import type { User } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Admin User",
    universityId: "SIMAD-ADMIN-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "admin@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "ADMIN",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

describe("user route handlers", () => {
  it("returns the current profile without a password hash", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: "STUDENT" }));
    const { GET } = await import("./me/route");

    const response = await GET(
      buildRequest("/api/users/me", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.email).toBe("admin@example.invalid");
    expect(body.user.passwordHash).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it("blocks non-admin users from listing all users", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "student_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "student_123", role: "STUDENT" }));
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/users", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You do not have permission to access this resource.");
    vi.unstubAllEnvs();
  });

  it("allows admins to list users with pagination", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123" }));
    mockPrisma.user.findMany.mockResolvedValue([
      buildUser({ id: "user_1", fullName: "First User", email: "first@example.invalid", role: "STUDENT" }),
      buildUser({ id: "user_2", fullName: "Second User", email: "second@example.invalid", role: "LECTURER" }),
    ]);
    mockPrisma.user.count.mockResolvedValue(12);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/users?page=2&pageSize=2&query=simad", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 2,
        take: 2,
      }),
    );
    expect(body.users).toHaveLength(2);
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.totalPages).toBe(6);
    expect(body.users[0].passwordHash).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it("rejects invalid role updates", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123" }));
    const { PATCH } = await import("./[userId]/route");

    const response = await PATCH(
      buildRequest("/api/users/user_123", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({ role: "OWNER" }),
      }),
      { params: Promise.resolve({ userId: "user_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid user update data.");
    vi.unstubAllEnvs();
  });

  it("prevents removing the last admin role", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(buildUser({ id: "admin_123" }))
      .mockResolvedValueOnce({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.count.mockResolvedValue(1);
    const { PATCH } = await import("./[userId]/route");

    const response = await PATCH(
      buildRequest("/api/users/admin_123", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({ role: "TECHNICIAN" }),
      }),
      { params: Promise.resolve({ userId: "admin_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("At least one admin account must remain active.");
    vi.unstubAllEnvs();
  });
});
