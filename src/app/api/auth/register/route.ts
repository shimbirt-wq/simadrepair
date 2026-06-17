import { NextResponse } from "next/server";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { registerUser } from "@/lib/auth/auth-service";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";
import { createSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`register:${getRequestIp(request)}`, 5, 60_000);

  if (!rateLimit.allowed) {
    return apiErrorResponse(429, "RATE_LIMITED", "Too many registration attempts. Try again shortly.", {
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  const runtimeIssue = getAuthRuntimeIssue();

  if (runtimeIssue) {
    return apiErrorResponse(503, "SERVICE_UNAVAILABLE", runtimeIssue);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse("Invalid registration data.", parsedBody.error);
  }

  const result = await registerUser(prisma, parsedBody.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const response = NextResponse.json({ user: result.user }, { status: 201 });
  response.cookies.set(createSessionCookie(result.token));

  return response;
}
