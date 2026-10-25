import { Prisma, type RepairEventType, type TicketStatus, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type LeadWorkspaceErrorStatus = 403 | 404 | 409;

export type LeadQueueTicket = {
  id: string;
  ticketId: string;
  trackingCode: string | null;
  status: TicketStatus;
  createdAt: Date;
  assignedAt: Date | null;
  requester: {
    fullName: string | null;
    requesterType: string | null;
    universityId: string | null;
    faculty: string | null;
    department: string | null;
    phone: string | null;
  };
  device: {
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string | null;
  };
  technician: {
    id: string;
    fullName: string;
    phone: string | null;
  } | null;
  custody: {
    receivedAt: Date | null;
    storageLocation: string | null;
    readyForCollectionAt: Date | null;
    collectedAt: Date | null;
  } | null;
};

export type LeadTicketDetail = LeadQueueTicket & {
  issueDescription: string;
  requester: LeadQueueTicket["requester"] & {
    email: string | null;
  };
  device: LeadQueueTicket["device"] & {
    id: string;
    assetTag: string | null;
    description: string | null;
  };
  events: Array<{
    id: string;
    eventType: RepairEventType;
    actorRole: UserRole | null;
    statusFrom: string | null;
    statusTo: string | null;
    note: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
    actor: {
      id: string;
      fullName: string;
      role: UserRole;
    } | null;
  }>;
};

export type LeadWorkspaceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: LeadWorkspaceErrorStatus;
      message: string;
    };

const leadQueueTicketSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  id: true,
  ticketId: true,
  trackingCode: true,
  status: true,
  createdAt: true,
  assignedAt: true,
  requester: {
    select: {
      fullName: true,
      requesterType: true,
      universityId: true,
      faculty: true,
      department: true,
      phone: true,
    },
  },
  device: {
    select: {
      deviceType: true,
      brand: true,
      model: true,
      serialNumber: true,
    },
  },
  technician: {
    select: {
      id: true,
      fullName: true,
      phone: true,
    },
  },
  custody: {
    select: {
      receivedAt: true,
      storageLocation: true,
      readyForCollectionAt: true,
      collectedAt: true,
    },
  },
});

const leadTicketDetailSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  ...leadQueueTicketSelect,
  issueDescription: true,
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
  events: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 20,
    select: {
      id: true,
      eventType: true,
      actorRole: true,
      statusFrom: true,
      statusTo: true,
      note: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  },
});

type LeadQueueTicketRecord = Prisma.RepairTicketGetPayload<{ select: typeof leadQueueTicketSelect }>;
type LeadTicketDetailRecord = Prisma.RepairTicketGetPayload<{ select: typeof leadTicketDetailSelect }>;

function buildTicketLookupFilter(ticketIdOrTrackingCode: string) {
  return {
    OR: [
      { id: ticketIdOrTrackingCode },
      { ticketId: ticketIdOrTrackingCode },
      { trackingCode: ticketIdOrTrackingCode },
    ],
  };
}

function toQueueTicket(ticket: LeadQueueTicketRecord): LeadQueueTicket {
  return {
    id: ticket.id,
    ticketId: ticket.ticketId,
    trackingCode: ticket.trackingCode,
    status: ticket.status,
    createdAt: ticket.createdAt,
    assignedAt: ticket.assignedAt,
    requester: {
      fullName: ticket.requester?.fullName ?? null,
      requesterType: ticket.requester?.requesterType ?? null,
      universityId: ticket.requester?.universityId ?? null,
      faculty: ticket.requester?.faculty ?? null,
      department: ticket.requester?.department ?? null,
      phone: ticket.requester?.phone ?? null,
    },
    device: ticket.device,
    technician: ticket.technician,
    custody: ticket.custody,
  };
}

function toTicketDetail(ticket: LeadTicketDetailRecord): LeadTicketDetail {
  return {
    ...toQueueTicket(ticket),
    issueDescription: ticket.issueDescription,
    requester: {
      ...toQueueTicket(ticket).requester,
      email: ticket.requester?.email ?? null,
    },
    device: ticket.device,
    events: ticket.events,
  };
}

export async function listLeadQueue(): Promise<LeadQueueTicket[]> {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      status: { notIn: ["COLLECTED", "CANCELLED"] },
    },
    select: leadQueueTicketSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  return tickets.map(toQueueTicket);
}

export async function getLeadTicket(ticketIdOrTrackingCode: string): Promise<LeadWorkspaceResult<LeadTicketDetail>> {
  const ticket = await prisma.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: leadTicketDetailSelect,
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
    data: toTicketDetail(ticket),
  };
}
