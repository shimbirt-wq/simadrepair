import { NextResponse } from "next/server";
import { internalErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { staffTicketActionSchema } from "@/lib/tickets/action-schema";
import { performStaffTicketAction } from "@/lib/tickets/staff-actions";

type RouteContext = { params: Promise<{ ticketId: string }> };

/** Every staff change to a ticket: check-in, assign, claim, start, block, ready, pickup… */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(prisma, request);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const parsed = staffTicketActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Invalid ticket action.", parsed.error);

  const { ticketId } = await context.params;

  try {
    const result = await performStaffTicketAction(prisma, auth.user, ticketId, parsed.data);
    if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
    return NextResponse.json({ ticket: { id: result.ticketId, status: result.status } });
  } catch (error) {
    console.error("Ticket action failed.", error instanceof Error ? error.message : error);
    return internalErrorResponse();
  }
}
