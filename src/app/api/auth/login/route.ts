import { NextResponse } from "next/server";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { loginUser } from "@/lib/auth/auth-service";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";
import { createSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`login:${getRequestIp(request)}`, 10, 60_000);

  if (!rateLimit.allowed) {
    return apiErrorResponse(429, "RATE_LIMITED", "Too many login attempts. Try again shortly.", {
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  const runtimeIssue = getAuthRuntimeIssue();

  if (runtimeIssue) {
    return apiErrorResponse(503, "SERVICE_UNAVAILABLE", runtimeIssue);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = loginSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse("Invalid login data.", parsedBody.error);
  }

  const result = await loginUser(prisma, parsedBody.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const response = NextResponse.json({ user: result.user });
  response.cookies.set(createSessionCookie(result.token));

  return response;
}
