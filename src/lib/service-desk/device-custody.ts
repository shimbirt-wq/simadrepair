import { Prisma, type TicketStatus, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type DeviceCustodyErrorStatus = 403 | 404 | 409;

export type TicketCustodyDetail = {
  ticket: {
    id: string;
    ticketId: string;
    trackingCode: string | null;
    status: TicketStatus;
    createdAt: Date;
  };
  requester: {
    fullName: string | null;
    requesterType: string | null;
    universityId: string | null;
    faculty: string | null;
    department: string | null;
    phone: string | null;
    email: string | null;
  };
  device: {
    id: string;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string | null;
    assetTag: string | null;
    description: string | null;
  };
  custody: {
    id: string;
    receivedAt: Date | null;
    condition: string | null;
    storageLocation: string | null;
    releasedById: string | null;
    readyForCollectionAt: Date | null;
    collectedByName: string | null;
    collectedByPhone: string | null;
    collectedAt: Date | null;
    receivedBy: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
    } | null;
    releasedBy: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
    } | null;
  } | null;
};

export type DeviceCustodyResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: DeviceCustodyErrorStatus;
      message: string;
    };


const staffUserSummarySelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  fullName: true,
  email: true,
  role: true,
});

const custodyDetailSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  id: true,
  ticketId: true,
  trackingCode: true,
  status: true,
  createdAt: true,
  requester: {
    select: {
      fullName: true,
      requesterType: true,
      universityId: true,
      faculty: true,
      department: true,
      phone: true,
      email: true,
    },
  },
  device: {
    select: {
      id: true,
      deviceType: true,
      brand: true,
      model: true,
      serialNumber: true,
      assetTag: true,
      description: true,
    },
  },
  custody: {
    select: {
      id: true,
      receivedAt: true,
      condition: true,
      storageLocation: true,
      releasedById: true,
      readyForCollectionAt: true,
      collectedByName: true,
      collectedByPhone: true,
      collectedAt: true,
      receivedBy: {
        select: staffUserSummarySelect,
      },
      releasedBy: {
        select: staffUserSummarySelect,
      },
    },
  },
});

type CustodyDetailRecord = Prisma.RepairTicketGetPayload<{ select: typeof custodyDetailSelect }>;

function buildTicketLookupFilter(ticketIdOrTrackingCode: string) {
  return {
    OR: [
      { id: ticketIdOrTrackingCode },
      { ticketId: ticketIdOrTrackingCode },
      { trackingCode: ticketIdOrTrackingCode },
    ],
  };
}

function toCustodyDetail(ticket: CustodyDetailRecord): TicketCustodyDetail {
  return {
    ticket: {
      id: ticket.id,
      ticketId: ticket.ticketId,
      trackingCode: ticket.trackingCode,
      status: ticket.status,
      createdAt: ticket.createdAt,
    },
    requester: {
      fullName: ticket.requester?.fullName ?? null,
      requesterType: ticket.requester?.requesterType ?? null,
      universityId: ticket.requester?.universityId ?? null,
      faculty: ticket.requester?.faculty ?? null,
      department: ticket.requester?.department ?? null,
      phone: ticket.requester?.phone ?? null,
      email: ticket.requester?.email ?? null,
    },
    device: ticket.device,
    custody: ticket.custody,
  };
}





export async function getCustodyForTicket(ticketIdOrTrackingCode: string): Promise<DeviceCustodyResult<TicketCustodyDetail>> {
  const ticket = await prisma.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: custodyDetailSelect,
  });

  if (!ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  return {
    ok: true,
    data: toCustodyDetail(ticket),
  };
}
