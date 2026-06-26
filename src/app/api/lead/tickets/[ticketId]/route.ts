import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { getLeadTicket } from "@/lib/service-desk/lead-workspace";

const LEAD_ROUTE_ROLES = ["LEAD_TECHNICIAN", "ADMIN"] as const;

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, LEAD_ROUTE_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const { ticketId } = await context.params;

  try {
    const result = await getLeadTicket(ticketId);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ ticket: result.data });
  } catch {
    return internalErrorResponse();
  }
}
