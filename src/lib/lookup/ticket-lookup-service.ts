import type { PrismaClient, RepairStatus } from "@prisma/client";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";

export type SafeTicketLookup = {
  ticketId: string;
  status: RepairStatus;
  statusLabel: string;
  deviceType: string;
  submittedAt: Date;
  updatedAt: Date;
  lookupUrl: string;
  qrCodeUrl: string;
};

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function buildTicketLookupUrl(ticketId: string) {
  return `${getAppUrl()}/lookup/${encodeURIComponent(ticketId)}`;
}

export function buildTicketQrCodeUrl(ticketId: string) {
  const lookupUrl = buildTicketLookupUrl(ticketId);

  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(lookupUrl)}`;
}

export async function getSafeTicketLookup(prisma: PrismaClient, ticketId: string) {
  const ticket = await prisma.repairTicket.findUnique({
    where: { ticketId },
    select: {
      ticketId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      device: {
        select: {
          deviceType: true,
        },
      },
    },
  });

  if (!ticket) {
    return null;
  }

  return {
    ticketId: ticket.ticketId,
    status: ticket.status,
    statusLabel: REPAIR_STATUS_LABELS[ticket.status],
    deviceType: ticket.device.deviceType,
    submittedAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    lookupUrl: buildTicketLookupUrl(ticket.ticketId),
    qrCodeUrl: buildTicketQrCodeUrl(ticket.ticketId),
  } satisfies SafeTicketLookup;
}
