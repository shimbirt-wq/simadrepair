import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { INTERNAL_USER_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { getRepairTicketDetail } from "@/lib/repair-tickets/repair-ticket-service";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, INTERNAL_USER_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const { ticketId } = await context.params;
  const result = await getRepairTicketDetail(prisma, authResult.user, ticketId);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ ticket: result.ticket });
}
