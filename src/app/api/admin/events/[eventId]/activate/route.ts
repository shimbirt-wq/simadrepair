import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { activateEvent, deactivateEvent, getEvent, LEGACY_EVENT_ID } from "@/lib/events/event-service";

type RouteContext = { params: Promise<{ eventId: string }> };

/** POST activates the event (deactivating any other); DELETE deactivates it. */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const { eventId } = await context.params;
  if (eventId === LEGACY_EVENT_ID || !(await getEvent(prisma, eventId))) return apiErrorResponse(404, "NOT_FOUND", "Event not found.");

  return NextResponse.json({ event: await activateEvent(prisma, eventId) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const { eventId } = await context.params;
  if (!(await getEvent(prisma, eventId))) return apiErrorResponse(404, "NOT_FOUND", "Event not found.");

  return NextResponse.json({ event: await deactivateEvent(prisma, eventId) });
}
