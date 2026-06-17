import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { readSessionTokenFromRequest, verifySessionToken } from "@/lib/auth/session";
import { getUserById } from "@/lib/users/user-service";

function buildRequestFromCookieHeader(cookieHeader: string): Request {
  return new Request("http://localhost", {
    headers: {
      cookie: cookieHeader,
    },
  });
}

export async function getCurrentServerUser() {
  const cookieStore = await cookies();
  const token = readSessionTokenFromRequest(buildRequestFromCookieHeader(cookieStore.toString()));

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  return getUserById(prisma, session.id);
}
