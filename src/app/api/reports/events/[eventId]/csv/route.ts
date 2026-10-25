import { apiErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getEvent } from "@/lib/events/event-service";
import { exportFileName } from "@/lib/reports/export-name";
import { ticketsCsv } from "@/lib/reports/tickets-csv";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["LEAD_TECHNICIAN", "ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  const { eventId } = await context.params;
  const event = await getEvent(prisma, eventId);
  if (!event) return apiErrorResponse(404, "NOT_FOUND", "Event not found.");

  return new Response(await ticketsCsv(prisma, eventId), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(event.name, "tickets", "csv")}"`,
      "Cache-Control": "no-store",
    },
  });
}
