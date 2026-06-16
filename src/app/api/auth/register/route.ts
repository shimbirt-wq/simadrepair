import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/auth-service";
import { createSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid registration data.",
        issues: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await registerUser(prisma, parsedBody.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const response = NextResponse.json({ user: result.user }, { status: 201 });
  response.cookies.set(createSessionCookie(result.token));

  return response;
}
