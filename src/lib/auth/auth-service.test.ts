import type { PrismaClient, User } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { loginUser, registerUser } from "./auth-service";
import { hashPassword } from "./password";

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Test Student",
    universityId: "SIMAD-AUTH-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "student@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "STUDENT",
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

const registerInput = {
  fullName: "Test Student",
  universityId: "SIMAD-AUTH-001",
  faculty: "Computing",
  department: "Computer Science",
  phone: "+252610001111",
  email: "student@example.invalid",
  password: "StrongPassword123!",
  role: "STUDENT" as const,
};

describe("registerUser", () => {
  it("hashes passwords, creates users, and excludes password hashes from the response", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const prisma = buildMockPrisma();
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(buildUser());

    const result = await registerUser(prisma, registerInput);

    expect(result.ok).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: registerInput.email,
          passwordHash: expect.not.stringMatching(registerInput.password),
        }),
      }),
    );
    if (result.ok) {
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result.token.length).toBeGreaterThan(20);
    }
    vi.unstubAllEnvs();
  });

  it("rejects duplicate email or university id before creating a user", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.user.findFirst).mockResolvedValue(buildUser({ id: "existing_user" }));

    const result = await registerUser(prisma, registerInput);

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "An account already exists for this email or university ID.",
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

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
      expect(result.user.email).toBe("student@example.invalid");
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result.token.length).toBeGreaterThan(20);
    }
    vi.unstubAllEnvs();
  });
});
