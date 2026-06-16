import { NextResponse } from "next/server";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { createDevice, listDevices } from "@/lib/devices/device-service";
import { createDeviceSchema, deviceListQuerySchema } from "@/lib/validations/devices";

export async function GET(request: Request) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const url = new URL(request.url);
  const parsedQuery = deviceListQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    query: url.searchParams.get("query") ?? undefined,
    ownerId: url.searchParams.get("ownerId") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Invalid device list query.",
        issues: parsedQuery.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await listDevices(prisma, authResult.user, parsedQuery.data);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = createDeviceSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid device data.",
        issues: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await createDevice(prisma, authResult.user, parsedBody.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ device: result.device }, { status: 201 });
}
