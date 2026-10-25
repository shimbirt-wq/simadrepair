import type { PrismaClient, TicketStatus } from "@prisma/client";
import { z } from "zod";
import { normalizeUniversityId } from "@/lib/intake/university-id";
import { toPublicStatus } from "@/lib/service-desk/public-tracking";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { normalizeTrackingCode } from "@/lib/tickets/tracking-code";

/**
 * Requester self-service without accounts (Q17, Q18, Q25):
 * find codes with university ID + last 4 phone digits, cancel before drop-off
 * with the university ID, rate once after collection.
 */

export const findSchema = z.object({
  universityId: z.string().trim().min(3, "Enter your university ID."),
  phoneLast4: z.string().trim().regex(/^\d{4}$/, "Enter the last 4 digits of your phone number."),
});

export type FoundRequest = { trackingCode: string; status: TicketStatus; device: string; submittedAt: string };

export async function findMyRequests(prisma: PrismaClient, input: z.infer<typeof findSchema>): Promise<FoundRequest[]> {
  const universityId = normalizeUniversityId(input.universityId);
  if (!universityId) return [];
  const requester = await prisma.requester.findUnique({
    where: { universityId },
    select: {
      phone: true,
      tickets: {
        where: { status: { notIn: ["COLLECTED", "CANCELLED"] } },
        orderBy: { createdAt: "desc" },
        select: { trackingCode: true, ticketId: true, status: true, createdAt: true, device: { select: { brand: true, model: true } } },
      },
    },
  });
  // Same answer for "no such ID" and "wrong digits": don't reveal which.
  if (!requester || !requester.phone.endsWith(input.phoneLast4)) return [];
  return requester.tickets.map((ticket) => ({
    trackingCode: ticket.trackingCode ?? ticket.ticketId,
    status: toPublicStatus(ticket.status),
    device: `${ticket.device.brand} ${ticket.device.model}`,
    submittedAt: ticket.createdAt.toISOString(),
  }));
}

export const cancelSchema = z.object({ universityId: z.string().trim().min(3, "Enter your university ID.") });

export async function cancelMyRequest(prisma: PrismaClient, code: string, universityIdInput: string) {
  const trackingCode = normalizeTrackingCode(code);
  const universityId = normalizeUniversityId(universityIdInput);
  const ticket = trackingCode
    ? await prisma.repairTicket.findFirst({ where: { trackingCode }, select: { id: true, requester: { select: { universityId: true } } } })
    : null;
  if (!ticket || !universityId || ticket.requester?.universityId !== universityId) {
    return { ok: false as const, status: 403 as const, message: "The university ID doesn't match this request." };
  }
  return performTicketAction(prisma, ticket.id, { kind: "requester" }, { action: { type: "CANCEL" } });
}

export const ratingSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose 1 to 5 stars.").max(5, "Choose 1 to 5 stars."),
  comment: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || null),
});

export async function rateMyRequest(prisma: PrismaClient, code: string, input: z.infer<typeof ratingSchema>) {
  const trackingCode = normalizeTrackingCode(code);
  if (!trackingCode) return { ok: false as const, status: 404 as const, message: "Request not found." };
  // Conditional update: only collected, only once — safe against double submits.
  const updated = await prisma.repairTicket.updateMany({
    where: { trackingCode, status: "COLLECTED", rating: null },
    data: { rating: input.rating, ratingComment: input.comment, ratedAt: new Date() },
  });
  if (updated.count !== 1) return { ok: false as const, status: 409 as const, message: "You can rate once, after collecting your device." };
  const ticket = await prisma.repairTicket.findFirstOrThrow({ where: { trackingCode }, select: { id: true } });
  await prisma.repairEvent.create({ data: { ticketId: ticket.id, eventType: "RATED", note: `Rated ${input.rating}/5`, metadata: { rating: input.rating } } });
  return { ok: true as const };
}
