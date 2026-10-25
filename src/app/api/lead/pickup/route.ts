import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { findPickupTickets } from "@/lib/pickup/pickup-service";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRole(prisma, request, ["LEAD_TECHNICIAN", "ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  const universityId = new URL(request.url).searchParams.get("universityId") ?? "";
  return NextResponse.json(await findPickupTickets(prisma, universityId));
}
