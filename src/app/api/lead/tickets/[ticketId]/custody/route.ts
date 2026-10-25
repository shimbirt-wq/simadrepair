import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { getCustodyForTicket } from "@/lib/service-desk/device-custody";

const LEAD_CUSTODY_ROLES = ["LEAD_TECHNICIAN", "ADMIN"] as const;

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, LEAD_CUSTODY_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const { ticketId } = await context.params;

  try {
    const result = await getCustodyForTicket(ticketId);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ custody: result.data });
  } catch {
    return internalErrorResponse();
  }
}
