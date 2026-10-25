import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { getBoard } from "@/lib/board/board-service";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRole(prisma, request, ["LEAD_TECHNICIAN", "ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  return NextResponse.json(await getBoard(prisma));
}
