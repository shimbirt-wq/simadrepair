import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth/auth-service";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";
import { createSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const runtimeIssue = getAuthRuntimeIssue();

  if (runtimeIssue) {
    return NextResponse.json({ error: runtimeIssue }, { status: 503 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = loginSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid login data.",
        issues: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await loginUser(prisma, parsedBody.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const response = NextResponse.json({ user: result.user });
  response.cookies.set(createSessionCookie(result.token));

  return response;
}
