import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const result = await requireAuthenticatedUser(prisma, request);

  if (!result.ok) {
    return authorizationErrorResponse(result);
  }

  return NextResponse.json({ user: result.user });
}
