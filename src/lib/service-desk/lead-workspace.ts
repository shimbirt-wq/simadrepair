import { Prisma, type CustodyStatus, type RepairEventType, type RepairStatus, type UserRole } from "@prisma/client";
import { ZodError } from "zod";
import type { PublicUser } from "@/lib/auth/public-user";
import { prisma } from "@/lib/db/prisma";
import { serviceDeskAssignmentInputSchema } from "@/lib/service-desk/validations";

type LeadWorkspaceErrorStatus = 403 | 404 | 409;

export type LeadQueueTicket = {
  id: string;
  ticketId: string;
  trackingCode: string | null;
  status: RepairStatus;
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
    status: CustodyStatus;
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
    custodyFrom: CustodyStatus | null;
    custodyTo: CustodyStatus | null;
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

export class LeadWorkspaceValidationError extends Error {
  constructor(readonly validationError: ZodError) {
    super("Invalid lead workspace data.");
    this.name = "LeadWorkspaceValidationError";
  }
}

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
      status: true,
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
      custodyFrom: true,
      custodyTo: true,
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
      status: {
        not: "DEVICE_COLLECTED",
      },
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

export async function assignTicketToTechnician(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
  data: unknown;
}): Promise<LeadWorkspaceResult<LeadTicketDetail>> {
  const parsedInput = serviceDeskAssignmentInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new LeadWorkspaceValidationError(parsedInput.error);
  }

  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.repairTicket.findFirst({
      where: buildTicketLookupFilter(input.ticketIdOrTrackingCode),
      select: {
        id: true,
        status: true,
        technicianId: true,
      },
    });

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    if (ticket.status === "DEVICE_COLLECTED") {
      return { kind: "closed" as const };
    }

    const technician = await tx.user.findFirst({
      where: {
        id: parsedInput.data.technicianId,
        isActive: true,
        role: {
          in: ["TECHNICIAN", "LEAD_TECHNICIAN"],
        },
      },
      select: {
        id: true,
      },
    });

    if (!technician) {
      return { kind: "bad-technician" as const };
    }

    const assignedAt = new Date();
    await tx.repairTicket.update({
      where: { id: ticket.id },
      data: {
        technicianId: technician.id,
        assignedAt,
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "TECHNICIAN_ASSIGNED",
        statusFrom: ticket.status,
        statusTo: ticket.status,
        note: "Ticket assigned to technician.",
        metadata: {
          technicianId: technician.id,
          source: "lead_workspace",
        },
      },
    });

    return {
      kind: "updated" as const,
      ticket: await tx.repairTicket.findUnique({
        where: { id: ticket.id },
        select: leadTicketDetailSelect,
      }),
    };
  });

  if (result.kind === "not-found") {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  if (result.kind === "closed") {
    return {
      ok: false,
      status: 409,
      message: "Collected tickets cannot be assigned.",
    };
  }

  if (result.kind === "bad-technician") {
    return {
      ok: false,
      status: 409,
      message: "Choose an active technician.",
    };
  }

  if (!result.ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  return {
    ok: true,
    data: toTicketDetail(result.ticket),
  };
}
