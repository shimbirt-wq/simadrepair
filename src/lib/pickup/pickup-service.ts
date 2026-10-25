import type { PrismaClient } from "@prisma/client";
import { ACCESSORIES, labelOf } from "@/lib/intake/options";
import { normalizeUniversityId } from "@/lib/intake/university-id";

export type PickupCandidate = {
  id: string;
  trackingCode: string;
  tagNumber: number | null;
  status: "READY_FOR_PICKUP" | "CANNOT_BE_REPAIRED";
  device: string;
  zone: string | null;
  eventName: string;
  accessoriesReceived: Array<{ value: string; label: string }>;
};

export type PickupLookup = { requester: { fullName: string; universityId: string; phone: string } | null; tickets: PickupCandidate[] };

/** Everything ready to hand back to the owner of this university ID, in any event (held devices included). */
export async function findPickupTickets(prisma: PrismaClient, universityIdInput: string): Promise<PickupLookup> {
  const universityId = normalizeUniversityId(universityIdInput);
  if (!universityId) return { requester: null, tickets: [] };

  const requester = await prisma.requester.findUnique({
    where: { universityId },
    select: {
      fullName: true,
      universityId: true,
      phone: true,
      tickets: {
        where: { status: { in: ["READY_FOR_PICKUP", "CANNOT_BE_REPAIRED"] } },
        orderBy: { readyForPickupAt: "asc" },
        select: {
          id: true,
          trackingCode: true,
          ticketId: true,
          tagNumber: true,
          status: true,
          device: { select: { brand: true, model: true } },
          custody: { select: { storageLocation: true, accessoriesReceived: true } },
          event: { select: { name: true } },
        },
      },
    },
  });
  if (!requester) return { requester: null, tickets: [] };

  return {
    requester: { fullName: requester.fullName, universityId: requester.universityId, phone: requester.phone },
    tickets: requester.tickets.map((ticket) => ({
      id: ticket.id,
      trackingCode: ticket.trackingCode ?? ticket.ticketId,
      tagNumber: ticket.tagNumber,
      status: ticket.status as PickupCandidate["status"],
      device: `${ticket.device.brand} ${ticket.device.model}`,
      zone: ticket.custody?.storageLocation ?? null,
      eventName: ticket.event.name,
      accessoriesReceived: (ticket.custody?.accessoriesReceived ?? []).map((value) => ({ value, label: labelOf(ACCESSORIES, value) })),
    })),
  };
}
