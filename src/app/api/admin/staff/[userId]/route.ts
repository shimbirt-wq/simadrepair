import { NextResponse } from "next/server";
import { validationErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { staffUpdateSchema, updateStaff } from "@/lib/staff/staff-service";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const parsed = staffUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Invalid change.", parsed.error);

  const { userId } = await context.params;
  const result = await updateStaff(prisma, auth.user.id, userId, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  return NextResponse.json({ user: result.user });
}
