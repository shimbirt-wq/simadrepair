import type { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { publicUserSelect, toPublicUser, type PublicUser } from "@/lib/auth/public-user";
import { INTERNAL_USER_ROLES } from "@/lib/auth/roles";
import type { CreateStaffAccountInput, UpdateUserRoleInput, UserListQuery } from "@/lib/validations/users";

export type UserListResult = {
  users: PublicUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type AssignableTechnician = PublicUser;

function buildUserSearchFilter(query?: string) {
  if (!query) {
    return {};
  }

  return {
    OR: [
      { fullName: { contains: query, mode: "insensitive" as const } },
      { email: { contains: query, mode: "insensitive" as const } },
      { universityId: { contains: query, mode: "insensitive" as const } },
    ],
  };
}

export async function listUsers(prisma: PrismaClient, input: UserListQuery): Promise<UserListResult> {
  const where = {
    role: {
      in: [...INTERNAL_USER_ROLES],
    },
    ...buildUserSearchFilter(input.query),
  };
  const skip = (input.page - 1) * input.pageSize;

  const [users, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: input.pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(toPublicUser),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
    },
  };
}

export async function getUserById(prisma: PrismaClient, userId: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  return user ? toPublicUser(user) : null;
}

export async function createStaffAccount(
  prisma: PrismaClient,
  actor: PublicUser,
  input: CreateStaffAccountInput,
): Promise<{ ok: true; user: PublicUser } | { ok: false; status: 403 | 409; message: string }> {
  if (actor.role === "LEAD_TECHNICIAN" && input.role !== "TECHNICIAN") {
    return {
      ok: false,
      status: 403,
      message: "Lead technicians can only create technician accounts.",
    };
  }

  if (actor.role !== "ADMIN" && actor.role !== "LEAD_TECHNICIAN") {
    return {
      ok: false,
      status: 403,
      message: "You do not have permission to create staff accounts.",
    };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { universityId: input.universityId }] },
    select: { id: true },
  });

  if (existing) {
    return {
      ok: false,
      status: 409,
      message: "An account with this email or university ID already exists.",
    };
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      universityId: input.universityId,
      faculty: input.faculty,
      department: input.department,
      phone: input.phone,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: true,
    },
    select: publicUserSelect,
  });

  return { ok: true, user: toPublicUser(user) };
}

export async function listAssignableTechnicians(prisma: PrismaClient): Promise<AssignableTechnician[]> {
  const users = await prisma.user.findMany({
    where: {
      role: "TECHNICIAN" satisfies UserRole,
      isActive: true,
    },
    select: publicUserSelect,
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
  });

  return users.map(toPublicUser);
}

export async function updateUserRole(
  prisma: PrismaClient,
  userId: string,
  input: UpdateUserRoleInput,
): Promise<
  | {
      ok: true;
      user: PublicUser;
    }
  | {
      ok: false;
      status: 404 | 409;
      message: string;
    }
> {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!existingUser) {
    return {
      ok: false,
      status: 404,
      message: "User not found.",
    };
  }

  const wouldRemoveActiveAdmin =
    existingUser.role === "ADMIN" && existingUser.isActive && (input.role !== "ADMIN" || input.isActive === false);

  if (wouldRemoveActiveAdmin) {
    const adminCount = await prisma.user.count({
      where: {
        role: "ADMIN" satisfies UserRole,
        isActive: true,
      },
    });

    if (adminCount <= 1) {
      return {
        ok: false,
        status: 409,
        message: "At least one admin account must remain active.",
      };
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      role: input.role,
      ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
    },
    select: publicUserSelect,
  });

  return {
    ok: true,
    user: toPublicUser(user),
  };
}
