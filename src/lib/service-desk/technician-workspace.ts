import { Prisma, type RepairEventType, type TicketStatus, type UserRole } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";

import { prisma } from "@/lib/db/prisma";

type TechnicianWorkspaceErrorStatus = 403 | 404 | 409;

export type TechnicianQueueTicket = {
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
  custody: {
    receivedAt: Date | null;
    storageLocation: string | null;
    readyForCollectionAt: Date | null;
  } | null;
};

export type TechnicianTicketDetail = TechnicianQueueTicket & {
  technicianId: string | null;
  issueDescription: string;
  requester: TechnicianQueueTicket["requester"] & {
    email: string | null;
  };
  device: TechnicianQueueTicket["device"] & {
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
      email: string;
      role: UserRole;
    } | null;
  }>;
};

export type TechnicianWorkspaceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: TechnicianWorkspaceErrorStatus;
      message: string;
    };

type TechnicianWorkspaceError = Extract<TechnicianWorkspaceResult<never>, { ok: false }>;

const staffUserSummarySelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  fullName: true,
  email: true,
  role: true,
});

const technicianQueueTicketSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
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
  custody: {
    select: {
      receivedAt: true,
      storageLocation: true,
      readyForCollectionAt: true,
    },
  },
});

const technicianTicketDetailSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  ...technicianQueueTicketSelect,
  technicianId: true,
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
        select: staffUserSummarySelect,
      },
    },
  },
});

type TechnicianQueueTicketRecord = Prisma.RepairTicketGetPayload<{ select: typeof technicianQueueTicketSelect }>;
type TechnicianTicketDetailRecord = Prisma.RepairTicketGetPayload<{ select: typeof technicianTicketDetailSelect }>;

function buildTicketLookupFilter(ticketIdOrTrackingCode: string) {
  return {
    OR: [
      { id: ticketIdOrTrackingCode },
      { ticketId: ticketIdOrTrackingCode },
      { trackingCode: ticketIdOrTrackingCode },
    ],
  };
}

function toQueueTicket(ticket: TechnicianQueueTicketRecord): TechnicianQueueTicket {
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
    custody: ticket.custody,
  };
}

function toTicketDetail(ticket: TechnicianTicketDetailRecord): TechnicianTicketDetail {
  return {
    ...toQueueTicket(ticket),
    technicianId: ticket.technicianId,
    issueDescription: ticket.issueDescription,
    requester: {
      ...toQueueTicket(ticket).requester,
      email: ticket.requester?.email ?? null,
    },
    device: ticket.device,
    events: ticket.events,
  };
}

function ensureTicketAccess(user: PublicUser, ticket: { technicianId: string | null }): TechnicianWorkspaceError | null {
  if (user.role === "ADMIN" || user.role === "LEAD_TECHNICIAN" || ticket.technicianId === user.id) {
    return null;
  }

  return {
    ok: false,
    status: 403,
    message: "You can only access tickets assigned to you.",
  };
}

export async function listTechnicianQueue(userId: string): Promise<TechnicianQueueTicket[]> {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      technicianId: userId,
      status: { notIn: ["COLLECTED", "CANCELLED"] },
    },
    select: technicianQueueTicketSelect,
    orderBy: [{ assignedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });

  return tickets.map(toQueueTicket);
}

export async function getTechnicianTicket(
  userId: string,
  ticketIdOrTrackingCode: string,
  actorRole: UserRole = "TECHNICIAN",
): Promise<TechnicianWorkspaceResult<TechnicianTicketDetail>> {
  const ticket = await prisma.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: technicianTicketDetailSelect,
  });

  if (!ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  const accessError = ensureTicketAccess({ id: userId, role: actorRole } as PublicUser, ticket);

  if (accessError) {
    return accessError;
  }

  return {
    ok: true,
    data: toTicketDetail(ticket),
  };
}
