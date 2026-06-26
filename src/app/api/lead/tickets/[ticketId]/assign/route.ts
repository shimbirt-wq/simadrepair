import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { assignTicketToTechnician, LeadWorkspaceValidationError } from "@/lib/service-desk/lead-workspace";

const LEAD_ROUTE_ROLES = ["LEAD_TECHNICIAN", "ADMIN"] as const;

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, LEAD_ROUTE_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const { ticketId } = await context.params;

  try {
    const result = await assignTicketToTechnician({
      ticketIdOrTrackingCode: ticketId,
      actor: authResult.user,
      data: body,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({ ticket: result.data });
  } catch (error) {
    if (error instanceof LeadWorkspaceValidationError) {
      return validationErrorResponse("Invalid lead assignment data.", error.validationError);
    }

    return internalErrorResponse();
  }
}
