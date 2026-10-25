import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { canViewTicket, getStaffTicketDetail } from "@/lib/tickets/ticket-detail";

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(prisma, request);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const { ticketId } = await context.params;
  const ticket = await getStaffTicketDetail(prisma, ticketId);
  if (!ticket || !canViewTicket(auth.user, ticket)) return apiErrorResponse(404, "NOT_FOUND", "Ticket not found.");
  return NextResponse.json({ ticket });
}
