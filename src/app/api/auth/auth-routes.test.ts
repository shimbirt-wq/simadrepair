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

function buildJsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("auth route handlers", () => {
  it("returns a configuration error when auth runtime is not ready", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:[PASSWORD]@[PROJECT_REF].pooler.supabase.com:6543/postgres");
    vi.stubEnv("DIRECT_URL", "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres");
    const { POST } = await import("./login/route");

    const response = await POST(
      buildJsonRequest("/api/auth/login", {
        email: "student@example.invalid",
        password: "StrongPassword123!",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("Database configuration is incomplete.");
    vi.unstubAllEnvs();
  });

  it("rejects invalid login credentials with a generic error", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/simadrepair");
    vi.stubEnv("DIRECT_URL", "postgresql://localhost:5432/simadrepair");
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const { POST } = await import("./login/route");

    const response = await POST(
      buildJsonRequest("/api/auth/login", {
        email: "tech@example.invalid",
        password: "WrongPassword123!",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid email or password.");
    vi.unstubAllEnvs();
  });

  it("logs in with valid credentials and sets an http-only session cookie", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/simadrepair");
    vi.stubEnv("DIRECT_URL", "postgresql://localhost:5432/simadrepair");
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
    expect(body.user.email).toBe("tech@example.invalid");
    expect(body.user.passwordHash).toBeUndefined();
    expect(response.headers.get("set-cookie")).toContain("simadrepair_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    vi.unstubAllEnvs();
  });

  it("returns the current user without a password hash", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { GET } = await import("./me/route");

    const response = await GET(
      new Request("http://localhost/api/auth/me", {
        headers: {
          cookie: `simadrepair_session=${token}`,
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
    expect(response.headers.get("set-cookie")).toContain("simadrepair_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

