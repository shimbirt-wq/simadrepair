import { NextResponse } from "next/server";
import { apiErrorResponse, internalErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { savePhoto } from "@/lib/photos/photo-service";
import { MAX_DAMAGE_PHOTOS } from "@/lib/tickets/check-in-options";
import { ticketLookupWhere } from "@/lib/tickets/ticket-service";

type RouteContext = { params: Promise<{ ticketId: string }> };

/** Damage photos taken at check-in (desk only, up to MAX_DAMAGE_PHOTOS). */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedRole(prisma, request, ["LEAD_TECHNICIAN", "ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const { ticketId } = await context.params;
  const ticket = await prisma.repairTicket.findFirst({ where: ticketLookupWhere(ticketId), select: { id: true, _count: { select: { photos: { where: { kind: "DAMAGE" } } } } } });
  if (!ticket) return apiErrorResponse(404, "NOT_FOUND", "Ticket not found.");
  if (ticket._count.photos >= MAX_DAMAGE_PHOTOS) return apiErrorResponse(400, "BAD_REQUEST", `Up to ${MAX_DAMAGE_PHOTOS} damage photos.`);

  const file = (await request.formData().catch(() => null))?.get("photo");
  if (!(file instanceof File)) return apiErrorResponse(400, "BAD_REQUEST", "Choose a photo.");

  try {
    const result = await savePhoto(prisma, new Uint8Array(await file.arrayBuffer()), { kind: "DAMAGE", ticketId: ticket.id, uploadedById: auth.user.id });
    if (!result.ok) return apiErrorResponse(400, "BAD_REQUEST", result.message);
    return NextResponse.json({ photo: { id: result.id, token: result.id } }, { status: 201 });
  } catch (error) {
    console.error("Damage photo upload failed.", error instanceof Error ? error.message : error);
    return internalErrorResponse();
  }
}
