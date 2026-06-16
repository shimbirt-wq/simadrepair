import type { User } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
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

function buildJsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const validRegistration = {
  fullName: "Test Student",
  universityId: "SIMAD-AUTH-001",
  faculty: "Computing",
  department: "Computer Science",
  phone: "+252610001111",
  email: "student@example.invalid",
  password: "StrongPassword123!",
  role: "STUDENT",
};

describe("auth route handlers", () => {
  it("rejects invalid registration data", async () => {
    const { POST } = await import("./register/route");

    const response = await POST(buildJsonRequest("/api/auth/register", { email: "bad" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid registration data.");
  });

  it("registers a user and sets an http-only session cookie", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(buildUser());
    const { POST } = await import("./register/route");

    const response = await POST(buildJsonRequest("/api/auth/register", validRegistration));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user.email).toBe("student@example.invalid");
    expect(body.user.passwordHash).toBeUndefined();
    expect(response.headers.get("set-cookie")).toContain("farsamotech_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    vi.unstubAllEnvs();
  });

  it("rejects duplicate registration", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "existing_user" });
    const { POST } = await import("./register/route");

    const response = await POST(buildJsonRequest("/api/auth/register", validRegistration));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("An account already exists for this email or university ID.");
  });

  it("rejects invalid login credentials with a generic error", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const { POST } = await import("./login/route");

    const response = await POST(
      buildJsonRequest("/api/auth/login", {
        email: "student@example.invalid",
        password: "WrongPassword123!",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid email or password.");
  });

  it("logs in with valid credentials and sets an http-only session cookie", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const passwordHash = await hashPassword("StrongPassword123!");
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ passwordHash }));
    const { POST } = await import("./login/route");

    const response = await POST(
      buildJsonRequest("/api/auth/login", {
        email: "student@example.invalid",
        password: "StrongPassword123!",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.email).toBe("student@example.invalid");
    expect(body.user.passwordHash).toBeUndefined();
    expect(response.headers.get("set-cookie")).toContain("farsamotech_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    vi.unstubAllEnvs();
  });

  it("returns the current user without a password hash", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { GET } = await import("./me/route");

    const response = await GET(
      new Request("http://localhost/api/auth/me", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.id).toBe("user_123");
    expect(body.user.passwordHash).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it("rejects unauthenticated profile requests", async () => {
    const { GET } = await import("./me/route");

    const response = await GET(new Request("http://localhost/api/auth/me"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
  });

  it("clears the session cookie on logout", async () => {
    const { POST } = await import("./logout/route");

    const response = POST();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("farsamotech_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
