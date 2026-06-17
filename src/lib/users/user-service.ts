import type { PrismaClient, UserRole } from "@prisma/client";
import { publicUserSelect, toPublicUser, type PublicUser } from "@/lib/auth/public-user";
import type { UpdateUserRoleInput, UserListQuery } from "@/lib/validations/users";

export type UserListResult = {
  users: PublicUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

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
  const where = buildUserSearchFilter(input.query);
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
    select: { id: true, role: true },
  });

  if (!existingUser) {
    return {
      ok: false,
      status: 404,
      message: "User not found.",
    };
  }

  if (existingUser.role === "ADMIN" && input.role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" satisfies UserRole },
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
    data: { role: input.role },
    select: publicUserSelect,
  });

  return {
    ok: true,
    user: toPublicUser(user),
  };
}
