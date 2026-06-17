import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { listUsers } from "@/lib/users/user-service";
import { userListQuerySchema } from "@/lib/validations/users";

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
