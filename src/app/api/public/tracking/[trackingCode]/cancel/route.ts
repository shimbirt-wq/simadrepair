import { NextResponse } from "next/server";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { cancelMyRequest, cancelSchema } from "@/lib/self-service/self-service";

type RouteContext = { params: Promise<{ trackingCode: string }> };

export async function POST(request: Request, context: RouteContext) {
  const limit = await checkRateLimit(prisma, `cancel:${getRequestIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) return apiErrorResponse(429, "RATE_LIMITED", "Too many tries. Wait a few minutes.");
  const { trackingCode } = await context.params;
  const parsed = cancelSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Check the highlighted fields.", parsed.error);
  const result = await cancelMyRequest(prisma, decodeURIComponent(trackingCode), parsed.data.universityId);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  return NextResponse.json({ status: "CANCELLED" });
}
