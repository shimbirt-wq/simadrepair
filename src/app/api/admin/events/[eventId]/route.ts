import { NextResponse } from "next/server";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { eventInputSchema } from "@/lib/events/event-schema";
import { getEvent, LEGACY_EVENT_ID, updateEvent } from "@/lib/events/event-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const { eventId } = await context.params;
  if (eventId === LEGACY_EVENT_ID || !(await getEvent(prisma, eventId))) return apiErrorResponse(404, "NOT_FOUND", "Event not found.");

  const parsed = eventInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Check the event details.", parsed.error);

  return NextResponse.json({ event: await updateEvent(prisma, eventId, parsed.data) });
}
