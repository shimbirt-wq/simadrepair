import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getTechnicianQueue } from "@/lib/technician/queue-service";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRole(prisma, request, ["TECHNICIAN", "LEAD_TECHNICIAN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  return NextResponse.json(await getTechnicianQueue(prisma, auth.user.id));
}
