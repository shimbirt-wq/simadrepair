import type { PrismaClient, User } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { loginUser } from "./auth-service";
import { hashPassword } from "./password";

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Test Technician",
    universityId: "SIMAD-AUTH-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "tech@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "TECHNICIAN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildMockPrisma() {
  return {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe("loginUser", () => {
  it("rejects missing users with a generic error", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await loginUser(prisma, {
      email: "student@example.invalid",
      password: "WrongPassword123!",
    });

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: "Invalid email or password.",
    });
  });

  it("rejects invalid passwords with a generic error", async () => {
    const prisma = buildMockPrisma();
    const passwordHash = await hashPassword("StrongPassword123!");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUser({ passwordHash }));

    const result = await loginUser(prisma, {
      email: "student@example.invalid",
      password: "WrongPassword123!",
    });

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: "Invalid email or password.",
    });
  });

  it("rejects inactive users before issuing a session", async () => {
    const prisma = buildMockPrisma();
    const passwordHash = await hashPassword("StrongPassword123!");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUser({ isActive: false, passwordHash }));

    const result = await loginUser(prisma, {
      email: "student@example.invalid",
      password: "StrongPassword123!",
    });

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: "This account is inactive. Contact an administrator for access.",
    });
  });

  it("returns a token and public user for valid credentials", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const prisma = buildMockPrisma();
    const passwordHash = await hashPassword("StrongPassword123!");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(buildUser({ passwordHash }));

    const result = await loginUser(prisma, {
      email: "student@example.invalid",
      password: "StrongPassword123!",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("tech@example.invalid");
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result.token.length).toBeGreaterThan(20);
    }
    vi.unstubAllEnvs();
  });
});

