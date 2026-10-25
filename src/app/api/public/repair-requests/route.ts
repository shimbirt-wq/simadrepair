import { NextResponse } from "next/server";
import { apiErrorResponse, internalErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { intakeSchema } from "@/lib/intake/intake-schema";
import { createRepairRequest, DAILY_LIMIT } from "@/lib/intake/intake-service";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const parsed = intakeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Check the highlighted fields.", parsed.error);

  const rateLimit = await checkRateLimit(prisma, `intake:${getRequestIp(request)}`, 20, 60 * 60 * 1000);
  if (!rateLimit.allowed) return apiErrorResponse(429, "RATE_LIMITED", "Too many requests from this network. Try again later.");

  try {
    const result = await createRepairRequest(prisma, parsed.data);
    if (result.ok) {
      return NextResponse.json({ request: { trackingCode: result.trackingCode, firstName: result.firstName, eventName: result.eventName } }, { status: 201 });
    }

    switch (result.reason) {
      case "REGISTRATION_CLOSED":
        return apiErrorResponse(409, "REGISTRATION_CLOSED", "Registration is closed.", { state: result.state });
      case "DUPLICATE":
        return apiErrorResponse(409, "DUPLICATE", `You already have an open request for this device: ${result.trackingCode}.`, { trackingCode: result.trackingCode });
      case "DAILY_LIMIT":
        return apiErrorResponse(429, "DAILY_LIMIT", `You can send up to ${DAILY_LIMIT} requests a day. Ask at the desk if you need more.`);
      case "SPAM":
        return apiErrorResponse(400, "BAD_REQUEST", "We couldn't accept this request.");
    }
  } catch (error) {
    console.error("Repair request failed.", error instanceof Error ? error.message : error);
    return internalErrorResponse();
  }
}
