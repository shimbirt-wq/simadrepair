import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { createStaffAccount, listUsers } from "@/lib/users/user-service";
import { createStaffAccountSchema, userListQuerySchema } from "@/lib/validations/users";

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const url = new URL(request.url);
  const parsedQuery = userListQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    query: url.searchParams.get("query") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Invalid user list query.",
        issues: parsedQuery.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await listUsers(prisma, parsedQuery.data);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedRole(prisma, request, ["ADMIN", "LEAD_TECHNICIAN"]);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createStaffAccountSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse("Invalid staff account data.", parsed.error);
  }

  const result = await createStaffAccount(prisma, authResult.user, parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ user: result.user }, { status: 201 });
}
