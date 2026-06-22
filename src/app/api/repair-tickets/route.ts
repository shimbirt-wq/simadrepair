import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { INTERNAL_USER_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { listRepairTickets } from "@/lib/repair-tickets/repair-ticket-service";
import { repairTicketListQuerySchema } from "@/lib/validations/repair-ticket-filters";

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedRole(prisma, request, INTERNAL_USER_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const url = new URL(request.url);
  const parsedQuery = repairTicketListQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    ticketId: url.searchParams.get("ticketId") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Invalid repair ticket list query.",
        issues: parsedQuery.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await listRepairTickets(prisma, authResult.user, parsedQuery.data);

  return NextResponse.json(result);
}

export function POST(_request: Request) {
  void _request;

  return apiErrorResponse(
    403,
    "FORBIDDEN",
    "Authenticated requester ticket creation has been removed. Use the public repair request flow.",
  );
}
