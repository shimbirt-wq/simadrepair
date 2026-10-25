import { NextResponse } from "next/server";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { findMyRequests, findSchema } from "@/lib/self-service/self-service";

export async function POST(request: Request) {
  const limit = await checkRateLimit(prisma, `find:${getRequestIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) return apiErrorResponse(429, "RATE_LIMITED", "Too many tries. Wait a few minutes.");

  const parsed = findSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Check the highlighted fields.", parsed.error);
  return NextResponse.json({ requests: await findMyRequests(prisma, parsed.data) });
}
