import type { PrismaClient, UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  AUTHORIZATION_ERRORS,
  authorizationErrorResponse,
  requireAnyRole,
  requireAuthenticatedRole,
  requireAuthenticatedUser,
  requireRole,
  requireTicketAccess,
} from "./authorization";
import type { PublicUser } from "./public-user";
import { SESSION_COOKIE_NAME, signSessionToken } from "./session";

const now = new Date("2026-01-01T00:00:00.000Z");

function buildPublicUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user_technician",
    fullName: "Test Technician",
    universityId: "SIMAD-AUTHZ-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "tech@example.invalid",
    role: "TECHNICIAN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildMockPrisma() {
  const userFindUnique = vi.fn();
  const repairTicketFindUnique = vi.fn();
  const prisma = {
    user: {
      findUnique: userFindUnique,
    },
    repairTicket: {
      findUnique: repairTicketFindUnique,
    },
  } as unknown as PrismaClient;

  return {
    prisma,
    userFindUnique,
    repairTicketFindUnique,
  };
}

function buildRequestWithSession(token: string): Request {
  return new Request("http://localhost/protected", {
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
    },
  });
}

describe("authorization error responses", () => {
  it("returns a shared JSON response for authorization errors", async () => {
    const response = authorizationErrorResponse(AUTHORIZATION_ERRORS.forbidden);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error: "You do not have permission to access this resource.",
      code: "FORBIDDEN",
    });
  });
});

describe("requireAuthenticatedUser", () => {
  it("rejects unauthenticated requests by default", async () => {
    const { prisma, userFindUnique } = buildMockPrisma();

    const result = await requireAuthenticatedUser(prisma, new Request("http://localhost/protected"));

    expect(result).toEqual(AUTHORIZATION_ERRORS.unauthenticated);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("rejects invalid session tokens", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const { prisma, userFindUnique } = buildMockPrisma();

    const result = await requireAuthenticatedUser(prisma, buildRequestWithSession("invalid-token"));

    expect(result).toEqual(AUTHORIZATION_ERRORS.unauthenticated);
    expect(userFindUnique).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("authenticates users from valid sessions and database records", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const { prisma, userFindUnique } = buildMockPrisma();
    const user = buildPublicUser();
    userFindUnique.mockResolvedValue(user);
    const token = await signSessionToken({ id: user.id, role: user.role });

    const result = await requireAuthenticatedUser(prisma, buildRequestWithSession(token));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe(user.id);
      expect(result.user.role).toBe("TECHNICIAN");
      expect(result.user).not.toHaveProperty("passwordHash");
    }
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: user.id },
      select: expect.objectContaining({ id: true, role: true }),
    });
    vi.unstubAllEnvs();
  });

  it("rejects valid tokens when the user no longer exists", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const { prisma, userFindUnique } = buildMockPrisma();
    userFindUnique.mockResolvedValue(null);
    const token = await signSessionToken({ id: "missing_user", role: "TECHNICIAN" });

    const result = await requireAuthenticatedUser(prisma, buildRequestWithSession(token));

    expect(result).toEqual(AUTHORIZATION_ERRORS.unauthenticated);
    vi.unstubAllEnvs();
  });

  it("rejects valid tokens for inactive users", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const { prisma, userFindUnique } = buildMockPrisma();
    const user = buildPublicUser({ isActive: false });
    userFindUnique.mockResolvedValue(user);
    const token = await signSessionToken({ id: user.id, role: user.role });

    const result = await requireAuthenticatedUser(prisma, buildRequestWithSession(token));

    expect(result).toEqual(AUTHORIZATION_ERRORS.unauthenticated);
    vi.unstubAllEnvs();
  });

});

describe("role guards", () => {
  it("allows users with the required role", () => {
    const admin = buildPublicUser({ role: "ADMIN" });

    const result = requireRole(admin, "ADMIN");

    expect(result.ok).toBe(true);
  });

  it("rejects users without the required role", () => {
    const technician = buildPublicUser({ role: "TECHNICIAN" });

    const result = requireRole(technician, "ADMIN");

    expect(result).toEqual(AUTHORIZATION_ERRORS.forbidden);
  });

  it("allows users with any accepted role", () => {
    const technician = buildPublicUser({ role: "TECHNICIAN" });

    const result = requireAnyRole(technician, ["TECHNICIAN", "ADMIN"]);

    expect(result.ok).toBe(true);
  });

  it("composes authentication and role checks", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const { prisma, userFindUnique } = buildMockPrisma();
    const user = buildPublicUser({ role: "TECHNICIAN" });
    userFindUnique.mockResolvedValue(user);
    const token = await signSessionToken({ id: user.id, role: user.role });

    const result = await requireAuthenticatedRole(prisma, buildRequestWithSession(token), ["TECHNICIAN", "ADMIN"]);

    expect(result.ok).toBe(true);
    vi.unstubAllEnvs();
  });

  it("does not trust client-selected roles because authenticated role comes from the database", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const { prisma, userFindUnique } = buildMockPrisma();
    const databaseUser = buildPublicUser({ id: "user_technician_2", role: "TECHNICIAN" });
    userFindUnique.mockResolvedValue(databaseUser);
    const token = await signSessionToken({ id: databaseUser.id, role: "ADMIN" as UserRole });

    const result = await requireAuthenticatedRole(prisma, buildRequestWithSession(token), ["ADMIN"]);

    expect(result).toEqual(AUTHORIZATION_ERRORS.forbidden);
    vi.unstubAllEnvs();
  });
});

describe("requireTicketAccess", () => {
  it("allows a technician to access an assigned ticket", async () => {
    const { prisma, repairTicketFindUnique } = buildMockPrisma();
    const technician = buildPublicUser({ id: "technician_assigned", role: "TECHNICIAN" });
    repairTicketFindUnique.mockResolvedValue({
      id: "ticket_1",
      technicianId: "technician_assigned",
      device: { ownerId: "student_owner" },
    });

    const result = await requireTicketAccess(prisma, technician, "ticket_1");

    expect(result.ok).toBe(true);
  });

  it("rejects a technician accessing an unassigned ticket", async () => {
    const { prisma, repairTicketFindUnique } = buildMockPrisma();
    const technician = buildPublicUser({ id: "technician_assigned", role: "TECHNICIAN" });
    repairTicketFindUnique.mockResolvedValue({
      id: "ticket_1",
      technicianId: null,
      device: { ownerId: "student_owner" },
    });

    const result = await requireTicketAccess(prisma, technician, "ticket_1");

    expect(result).toEqual(AUTHORIZATION_ERRORS.forbidden);
  });

  it("rejects a technician accessing another technician's ticket", async () => {
    const { prisma, repairTicketFindUnique } = buildMockPrisma();
    const technician = buildPublicUser({ id: "technician_other", role: "TECHNICIAN" });
    repairTicketFindUnique.mockResolvedValue({
      id: "ticket_1",
      technicianId: "technician_assigned",
      device: { ownerId: "student_owner" },
    });

    const result = await requireTicketAccess(prisma, technician, "ticket_1");

    expect(result).toEqual(AUTHORIZATION_ERRORS.forbidden);
  });

  it("allows admins to access any ticket", async () => {
    const { prisma, repairTicketFindUnique } = buildMockPrisma();
    const admin = buildPublicUser({ id: "admin_user", role: "ADMIN" });
    repairTicketFindUnique.mockResolvedValue({
      id: "ticket_1",
      technicianId: "technician_assigned",
      device: { ownerId: "student_owner" },
    });

    const result = await requireTicketAccess(prisma, admin, "ticket_1");

    expect(result.ok).toBe(true);
  });

  it("returns not found for missing tickets", async () => {
    const { prisma, repairTicketFindUnique } = buildMockPrisma();
    const admin = buildPublicUser({ id: "admin_user", role: "ADMIN" });
    repairTicketFindUnique.mockResolvedValue(null);

    const result = await requireTicketAccess(prisma, admin, "missing_ticket");

    expect(result).toEqual(AUTHORIZATION_ERRORS.notFound);
  });
});

