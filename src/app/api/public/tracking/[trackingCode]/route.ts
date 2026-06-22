import { apiErrorResponse, internalErrorResponse } from "@/lib/api/responses";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getPublicTrackingInfo, PublicTrackingValidationError } from "@/lib/service-desk/public-tracking";

type RouteContext = {
  params: Promise<{
    trackingCode?: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit(`tracking:${getRequestIp(request)}`, 20, 60_000);

  if (!rateLimit.allowed) {
    return apiErrorResponse(429, "RATE_LIMITED", "Too many tracking lookups. Try again shortly.", {
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  const { trackingCode } = await context.params;

  if (!trackingCode) {
    return apiErrorResponse(400, "BAD_REQUEST", "Invalid tracking code format.");
  }

  try {
    const trackingInfo = await getPublicTrackingInfo(trackingCode);

    if (!trackingInfo) {
      return apiErrorResponse(404, "NOT_FOUND", "Tracking code not found.");
    }

    return Response.json(trackingInfo);
  } catch (error) {
    if (error instanceof PublicTrackingValidationError) {
      return apiErrorResponse(400, "BAD_REQUEST", "Invalid tracking code format.");
    }

    return internalErrorResponse();
  }
}
