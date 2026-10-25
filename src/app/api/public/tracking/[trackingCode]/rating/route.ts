import { NextResponse } from "next/server";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { rateMyRequest, ratingSchema } from "@/lib/self-service/self-service";

type RouteContext = { params: Promise<{ trackingCode: string }> };

export async function POST(request: Request, context: RouteContext) {
  const limit = await checkRateLimit(prisma, `rate:${getRequestIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) return apiErrorResponse(429, "RATE_LIMITED", "Too many tries. Wait a few minutes.");
  const parsed = ratingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Choose 1 to 5 stars.", parsed.error);
  const { trackingCode } = await context.params;
  const result = await rateMyRequest(prisma, decodeURIComponent(trackingCode), parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  return NextResponse.json({ ok: true });
}
