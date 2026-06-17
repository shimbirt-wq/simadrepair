import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { updateRepairTicketStatus } from "@/lib/repair-tickets/repair-ticket-service";
import { updateRepairTicketStatusSchema } from "@/lib/validations/repair-ticket";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = updateRepairTicketStatusSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid repair ticket status update data.",
        issues: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { ticketId } = await context.params;
  const result = await updateRepairTicketStatus(prisma, authResult.user, ticketId, parsedBody.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ ticket: result.ticket });
}
