import { apiErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getEventReport } from "@/lib/reports/event-report";
import { exportFileName } from "@/lib/reports/export-name";
import { renderEventReportPdf } from "@/lib/reports/report-pdf";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["LEAD_TECHNICIAN", "ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  const { eventId } = await context.params;
  const report = await getEventReport(prisma, eventId);
  if (!report) return apiErrorResponse(404, "NOT_FOUND", "Event not found.");

  return new Response(new Uint8Array(renderEventReportPdf(report)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${exportFileName(report.event.name, "report", "pdf")}"`,
      "Cache-Control": "no-store",
    },
  });
}
