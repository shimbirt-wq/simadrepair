import { apiErrorResponse, internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getPublicTrackingInfo, PublicTrackingValidationError } from "@/lib/service-desk/public-tracking";

type RouteContext = { params: Promise<{ trackingCode?: string }> };

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = await checkRateLimit(prisma, `tracking:${getRequestIp(request)}`, 20, 60_000);

  if (!rateLimit.allowed) {
    return apiErrorResponse(429, "RATE_LIMITED", "Too many lookups. Try again in a minute.", { retryAfterSeconds: rateLimit.retryAfterSeconds });
  }

  const { trackingCode } = await context.params;
  if (!trackingCode) return apiErrorResponse(400, "BAD_REQUEST", "Enter your tracking code, e.g. SIM-26-K7P3QX.");

  try {
    const info = await getPublicTrackingInfo(decodeURIComponent(trackingCode));
    if (!info) return apiErrorResponse(404, "NOT_FOUND", "No repair found with this code.");
    return Response.json(info);
  } catch (error) {
    if (error instanceof PublicTrackingValidationError) {
      return apiErrorResponse(400, "BAD_REQUEST", "That doesn't look like a tracking code. It looks like SIM-26-K7P3QX.");
    }
    return internalErrorResponse();
  }
}
