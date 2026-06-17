import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { getReportsOverview } from "@/lib/reports/report-service";
import { reportDateRangeSchema } from "@/lib/validations/reports";

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const url = new URL(request.url);
  const parsedQuery = reportDateRangeSchema.safeParse({
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
  });

  if (!parsedQuery.success) {
    return validationErrorResponse("Invalid report filters.", parsedQuery.error);
  }

  try {
    const overview = await getReportsOverview(prisma, parsedQuery.data);

    return Response.json({ overview });
  } catch {
    return apiErrorResponse(500, "INTERNAL_ERROR", "Unable to load reports.");
  }
}
