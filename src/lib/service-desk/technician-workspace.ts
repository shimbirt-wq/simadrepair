import { Prisma, type CustodyStatus, type RepairEventType, type RepairStatus, type UserRole } from "@prisma/client";
import { ZodError } from "zod";
import type { PublicUser } from "@/lib/auth/public-user";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { prisma } from "@/lib/db/prisma";
import { canTechnicianWorkOnTicket } from "@/lib/service-desk/workflow";
import { technicianStatusUpdateInputSchema, type TechnicianStatusUpdateInput } from "@/lib/service-desk/validations";

type TechnicianWorkspaceErrorStatus = 403 | 404 | 409;

export type TechnicianQueueTicket = {
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
  custody: {
    status: CustodyStatus;
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
    custodyFrom: CustodyStatus | null;
    custodyTo: CustodyStatus | null;
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

export class TechnicianWorkspaceValidationError extends Error {
  constructor(readonly validationError: ZodError) {
    super("Invalid technician workspace data.");
    this.name = "TechnicianWorkspaceValidationError";
  }
}

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
      status: true,
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
      custodyFrom: true,
      custodyTo: true,
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

async function findTicketForMutation(tx: Prisma.TransactionClient, ticketIdOrTrackingCode: string) {
  return tx.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: {
      id: true,
      status: true,
      technicianId: true,
      custody: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });
}

function ensureTicketAccess(user: PublicUser, ticket: { technicianId: string | null }): TechnicianWorkspaceError | null {
  if (canTechnicianWorkOnTicket(user, ticket)) {
    return null;
  }

  return {
    ok: false,
    status: 403,
    message: "You can only access tickets assigned to you.",
  };
}

function validateStatusTransition(ticket: { status: RepairStatus; custody: { status: CustodyStatus } | null }, next: RepairStatus) {
  if (next === "REPAIR_IN_PROGRESS") {
    if (ticket.status !== "DEVICE_RECEIVED" && ticket.status !== "REPAIR_IN_PROGRESS") {
      return "Work can start only after the lead has received the device.";
    }

    if (!ticket.custody || (ticket.custody.status !== "RECEIVED" && ticket.custody.status !== "IN_REPAIR_ROOM")) {
      return "Device custody must be received before repair starts.";
    }

    return null;
  }

  if (next === "READY_FOR_COLLECTION") {
    if (ticket.status !== "REPAIR_IN_PROGRESS" && ticket.status !== "READY_FOR_COLLECTION") {
      return "A ticket must be in repair before it can be marked ready for pickup.";
    }

    return null;
  }

  return "Unsupported technician status.";
}

export async function listTechnicianQueue(userId: string): Promise<TechnicianQueueTicket[]> {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      technicianId: userId,
      status: { not: "DEVICE_COLLECTED" },
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

export async function updateTechnicianRepairStatus(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
  data: unknown;
}): Promise<TechnicianWorkspaceResult<TechnicianTicketDetail>> {
  const parsedInput = technicianStatusUpdateInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new TechnicianWorkspaceValidationError(parsedInput.error);
  }

  const statusData: TechnicianStatusUpdateInput = parsedInput.data;
  const nextStatus = statusData.status as RepairStatus;
  const updatedTicket = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    const accessError = ensureTicketAccess(input.actor, ticket);

    if (accessError) {
      return { kind: "forbidden" as const, error: accessError };
    }

    const validationMessage = validateStatusTransition(ticket, nextStatus);

    if (validationMessage) {
      return {
        kind: "transition-error" as const,
        error: {
          ok: false,
          status: 409,
          message: validationMessage,
        } satisfies TechnicianWorkspaceError,
      };
    }

    const now = new Date();
    const custodyTo: CustodyStatus = nextStatus === "READY_FOR_COLLECTION" ? "READY_FOR_COLLECTION" : "IN_REPAIR_ROOM";

    if (ticket.custody) {
      await tx.deviceCustody.update({
        where: { id: ticket.custody.id },
        data: {
          status: custodyTo,
          ...(custodyTo === "READY_FOR_COLLECTION" ? { readyForCollectionAt: now } : {}),
        },
      });
    }

    await tx.repairTicket.update({
      where: { id: ticket.id },
      data: {
        status: nextStatus,
        ...(nextStatus === "READY_FOR_COLLECTION"
          ? {
              completedAt: now,
              readyForPickupAt: now,
            }
          : {}),
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: nextStatus === "READY_FOR_COLLECTION" ? "READY_FOR_PICKUP" : "STATUS_CHANGED",
        statusFrom: ticket.status,
        statusTo: nextStatus,
        custodyFrom: ticket.custody?.status ?? null,
        custodyTo,
        note:
          statusData.note ??
          `Status changed from ${REPAIR_STATUS_LABELS[ticket.status]} to ${REPAIR_STATUS_LABELS[nextStatus]}.`,
        metadata: {
          source: "technician_workspace",
        },
      },
    });

    return {
      kind: "updated" as const,
      ticket: await tx.repairTicket.findUnique({
        where: { id: ticket.id },
        select: technicianTicketDetailSelect,
      }),
    };
  });

  return toMutationResult(updatedTicket);
}

function toMutationResult(
  result:
    | { kind: "not-found" }
    | { kind: "forbidden"; error: TechnicianWorkspaceError }
    | { kind: "transition-error"; error: TechnicianWorkspaceError }
    | { kind: "updated"; ticket: TechnicianTicketDetailRecord | null },
): TechnicianWorkspaceResult<TechnicianTicketDetail> {
  if (result.kind === "not-found") {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  if (result.kind === "forbidden" || result.kind === "transition-error") {
    return result.error;
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
