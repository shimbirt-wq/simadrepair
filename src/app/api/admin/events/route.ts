import { NextResponse } from "next/server";
import { validationErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { eventInputSchema } from "@/lib/events/event-schema";
import { createEvent, listEvents } from "@/lib/events/event-service";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  return NextResponse.json({ events: await listEvents(prisma) });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const body = (await request.json().catch(() => null)) as { activate?: boolean } | null;
  const parsed = eventInputSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse("Check the event details.", parsed.error);

  const event = await createEvent(prisma, parsed.data, { activate: Boolean(body?.activate) });
  return NextResponse.json({ event }, { status: 201 });
}
