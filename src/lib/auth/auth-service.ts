import type { PrismaClient } from "@prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { signSessionToken } from "@/lib/auth/session";
import { toPublicUser, type PublicUser } from "@/lib/auth/public-user";
import type { LoginInput } from "@/lib/validations/auth";

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

  if (!user.isActive) {
    return {
      ok: false,
      status: 403,
      message: "This account is inactive. Contact an administrator for access.",
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
