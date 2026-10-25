import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { closeUnfinished, moveUncollectedToOffice, previewEndOfEvent } from "@/lib/events/end-of-event";
import { getEvent } from "@/lib/events/event-service";

type RouteContext = { params: Promise<{ eventId: string }> };
const bodySchema = z.object({ action: z.enum(["MOVE_UNCOLLECTED", "CLOSE_UNFINISHED"]) });

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["LEAD_TECHNICIAN", "ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  const { eventId } = await context.params;
  if (!(await getEvent(prisma, eventId))) return apiErrorResponse(404, "NOT_FOUND", "Event not found.");
  return NextResponse.json(await previewEndOfEvent(prisma, eventId));
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["LEAD_TECHNICIAN", "ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  const { eventId } = await context.params;
  if (!(await getEvent(prisma, eventId))) return apiErrorResponse(404, "NOT_FOUND", "Event not found.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Choose an action.", parsed.error);

  const actor = { kind: "staff" as const, id: auth.user.id, role: auth.user.role };
  if (parsed.data.action === "MOVE_UNCOLLECTED") return NextResponse.json({ moved: await moveUncollectedToOffice(prisma, actor, eventId) });
  return NextResponse.json(await closeUnfinished(prisma, actor, eventId));
}
