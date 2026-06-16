import type { PrismaClient, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { publicUserSelect, toPublicUser, type PublicUser } from "@/lib/auth/public-user";
import { readSessionTokenFromRequest, verifySessionToken } from "@/lib/auth/session";

export type AuthorizationErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND";

export type AuthorizationError = {
  ok: false;
  status: 401 | 403 | 404;
  code: AuthorizationErrorCode;
  message: string;
};

export type AuthorizationSuccess<T> = {
  ok: true;
  user: PublicUser;
  data: T;
};

export type AuthorizationResult<T = PublicUser> = AuthorizationSuccess<T> | AuthorizationError;

export type AuthorizedTicketAccess = {
  id: string;
  ownerId: string;
  technicianId: string | null;
};

export const AUTHORIZATION_ERRORS = {
  unauthenticated: {
    ok: false,
    status: 401,
    code: "UNAUTHENTICATED",
    message: "Authentication required.",
  },
  forbidden: {
    ok: false,
    status: 403,
    code: "FORBIDDEN",
    message: "You do not have permission to access this resource.",
  },
  notFound: {
    ok: false,
    status: 404,
    code: "NOT_FOUND",
    message: "Resource not found.",
  },
} as const satisfies Record<string, AuthorizationError>;

export function authorizationErrorResponse(error: AuthorizationError) {
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
    },
    { status: error.status },
  );
}

export async function requireAuthenticatedUser(
  prisma: PrismaClient,
  request: Request,
): Promise<AuthorizationResult<PublicUser>> {
  const token = readSessionTokenFromRequest(request);

  if (!token) {
    return AUTHORIZATION_ERRORS.unauthenticated;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return AUTHORIZATION_ERRORS.unauthenticated;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: publicUserSelect,
  });

  if (!user) {
    return AUTHORIZATION_ERRORS.unauthenticated;
  }

  const publicUser = toPublicUser(user);

  return {
    ok: true,
    user: publicUser,
    data: publicUser,
  };
}

export function requireAnyRole(user: PublicUser, allowedRoles: readonly UserRole[]): AuthorizationResult<PublicUser> {
  if (!allowedRoles.includes(user.role)) {
    return AUTHORIZATION_ERRORS.forbidden;
  }

  return {
    ok: true,
    user,
    data: user,
  };
}

export function requireRole(user: PublicUser, role: UserRole): AuthorizationResult<PublicUser> {
  return requireAnyRole(user, [role]);
}

export async function requireAuthenticatedRole(
  prisma: PrismaClient,
  request: Request,
  allowedRoles: readonly UserRole[],
): Promise<AuthorizationResult<PublicUser>> {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authResult;
  }

  return requireAnyRole(authResult.user, allowedRoles);
}

export async function requireTicketAccess(
  prisma: PrismaClient,
  user: PublicUser,
  ticketId: string,
): Promise<AuthorizationResult<AuthorizedTicketAccess>> {
  const ticket = await prisma.repairTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      technicianId: true,
      device: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!ticket) {
    return AUTHORIZATION_ERRORS.notFound;
  }

  const accessData: AuthorizedTicketAccess = {
    id: ticket.id,
    ownerId: ticket.device.ownerId,
    technicianId: ticket.technicianId,
  };

  if (user.role === "ADMIN") {
    return {
      ok: true,
      user,
      data: accessData,
    };
  }

  if ((user.role === "STUDENT" || user.role === "LECTURER") && ticket.device.ownerId === user.id) {
    return {
      ok: true,
      user,
      data: accessData,
    };
  }

  if (user.role === "TECHNICIAN" && ticket.technicianId === user.id) {
    return {
      ok: true,
      user,
      data: accessData,
    };
  }

  return AUTHORIZATION_ERRORS.forbidden;
}
