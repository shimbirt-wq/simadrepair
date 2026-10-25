import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { decryptDevicePassword } from "@/lib/secrets/device-password";
import { ticketLookupWhere } from "@/lib/tickets/ticket-service";

type RouteContext = { params: Promise<{ ticketId: string }> };

/** The device password, for the assigned technician only (TD2). Each view is logged. */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(prisma, request);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const { ticketId } = await context.params;
  const ticket = await prisma.repairTicket.findFirst({ where: ticketLookupWhere(ticketId), select: { id: true, technicianId: true, devicePasswordEnc: true } });
  if (!ticket || ticket.technicianId !== auth.user.id) return apiErrorResponse(404, "NOT_FOUND", "Only the assigned technician can see the password.");
  if (!ticket.devicePasswordEnc) return apiErrorResponse(404, "NOT_FOUND", "No password was given.");

  await prisma.repairEvent.create({
    data: { ticketId: ticket.id, actorId: auth.user.id, actorRole: auth.user.role, eventType: "NOTE_ADDED", note: "Viewed the device password.", metadata: { kind: "password_viewed" } },
  });
  return NextResponse.json({ password: decryptDevicePassword(ticket.devicePasswordEnc) }, { headers: { "cache-control": "no-store" } });
}
