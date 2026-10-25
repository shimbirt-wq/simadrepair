import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { readSessionTokenFromRequest, verifySessionToken } from "@/lib/auth/session";
import { hasAccess } from "@/lib/auth/public-user";
import { getStaffById } from "@/lib/staff/staff-service";

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

  const user = await getStaffById(prisma, session.id);

  if (!user || !hasAccess(user)) {
    return null;
  }

  return user;
}
