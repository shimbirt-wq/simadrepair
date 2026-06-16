import type { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { signSessionToken } from "@/lib/auth/session";
import { publicUserSelect, toPublicUser, type PublicUser } from "@/lib/auth/public-user";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";

type AuthServiceResult =
  | {
      ok: true;
      user: PublicUser;
      token: string;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

export async function registerUser(prisma: PrismaClient, input: RegisterInput): Promise<AuthServiceResult> {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { universityId: input.universityId }],
    },
    select: { id: true },
  });

  if (existingUser) {
    return {
      ok: false,
      status: 409,
      message: "An account already exists for this email or university ID.",
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
    },
    select: publicUserSelect,
  });
  const token = await signSessionToken({ id: user.id, role: user.role });

  return {
    ok: true,
    user: toPublicUser(user),
    token,
  };
}

export async function loginUser(prisma: PrismaClient, input: LoginInput): Promise<AuthServiceResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    return {
      ok: false,
      status: 401,
      message: "Invalid email or password.",
    };
  }

  const passwordIsValid = await verifyPassword(input.password, user.passwordHash);

  if (!passwordIsValid) {
    return {
      ok: false,
      status: 401,
      message: "Invalid email or password.",
    };
  }

  const token = await signSessionToken({ id: user.id, role: user.role });

  return {
    ok: true,
    user: toPublicUser(user),
    token,
  };
}

export const getCurrentUser = requireAuthenticatedUser;
