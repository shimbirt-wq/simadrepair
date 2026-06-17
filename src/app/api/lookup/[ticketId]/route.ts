import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { getSafeTicketLookup } from "@/lib/lookup/ticket-lookup-service";
import { ticketLookupSchema } from "@/lib/validations/lookup";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { ticketId } = await context.params;
  const parsed = ticketLookupSchema.safeParse({ ticketId });

  if (!parsed.success) {
    return validationErrorResponse("Invalid ticket lookup.", parsed.error);
  }

  const lookup = await getSafeTicketLookup(prisma, parsed.data.ticketId);

  if (!lookup) {
    return apiErrorResponse(404, "NOT_FOUND", "Ticket not found.");
  }

  return Response.json({ ticket: lookup });
}
