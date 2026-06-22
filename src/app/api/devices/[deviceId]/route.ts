import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { INTERNAL_USER_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { getDeviceById } from "@/lib/devices/device-service";

type RouteContext = {
  params: Promise<{
    deviceId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedRole(prisma, request, INTERNAL_USER_ROLES);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const { deviceId } = await context.params;
  const result = await getDeviceById(prisma, authResult.user, deviceId);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ device: result.device });
}
