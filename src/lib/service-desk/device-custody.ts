import { Prisma, type CustodyStatus, type RepairStatus, type UserRole } from "@prisma/client";
import { ZodError } from "zod";
import type { PublicUser } from "@/lib/auth/public-user";
import { canTransitionRepairStatus } from "@/lib/constants/repair-status";
import { prisma } from "@/lib/db/prisma";
import { canTransitionCustody } from "@/lib/service-desk/workflow";
import {
  custodyCheckInInputSchema,
  custodyStatusTransitionInputSchema,
  pickupConfirmationInputSchema,
  type CustodyCheckInInput,
  type CustodyStatusTransitionInput,
  type PickupConfirmationInput,
} from "@/lib/service-desk/validations";

type DeviceCustodyErrorStatus = 403 | 404 | 409;

export type TicketCustodyDetail = {
  ticket: {
    id: string;
    ticketId: string;
    trackingCode: string | null;
    status: RepairStatus;
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
    status: CustodyStatus;
    receivedAt: Date | null;
    condition: string | null;
    storageLocation: string | null;
    releasedById: string | null;
    readyForCollectionAt: Date | null;
    collectedByName: string | null;
    collectedByPhone: string | null;
    collectedAt: Date | null;
    pickupCodeVerifiedAt: Date | null;
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

export class DeviceCustodyValidationError extends Error {
  constructor(readonly validationError: ZodError) {
    super("Invalid device custody data.");
    this.name = "DeviceCustodyValidationError";
  }
}

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
      status: true,
      receivedAt: true,
      condition: true,
      storageLocation: true,
      releasedById: true,
      readyForCollectionAt: true,
      collectedByName: true,
      collectedByPhone: true,
      collectedAt: true,
      pickupCodeVerifiedAt: true,
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

async function findTicketForCustodyMutation(tx: Prisma.TransactionClient, ticketIdOrTrackingCode: string) {
  return tx.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: {
      id: true,
      status: true,
      deviceId: true,
      custody: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });
}

async function findCustodyDetailInTransaction(tx: Prisma.TransactionClient, ticketId: string) {
  return tx.repairTicket.findUnique({
    where: { id: ticketId },
    select: custodyDetailSelect,
  });
}

function ensureCustodyManager(actor: PublicUser): DeviceCustodyResult<never> | null {
  if (actor.role === "LEAD_TECHNICIAN" || actor.role === "ADMIN") {
    return null;
  }

  return {
    ok: false,
    status: 403,
    message: "Only lead technicians or admins can manage device custody.",
  };
}

function canMarkTicketCollected(status: RepairStatus) {
  return status === "READY_FOR_COLLECTION" && canTransitionRepairStatus(status, "DEVICE_COLLECTED");
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

export async function checkInDevice(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
  data: unknown;
}): Promise<DeviceCustodyResult<TicketCustodyDetail>> {
  const roleError = ensureCustodyManager(input.actor);

  if (roleError) {
    return roleError;
  }

  const parsedInput = custodyCheckInInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new DeviceCustodyValidationError(parsedInput.error);
  }

  const checkInData: CustodyCheckInInput = parsedInput.data;
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForCustodyMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    const custodyFrom = ticket.custody?.status ?? "NOT_RECEIVED";

    if (ticket.custody && !canTransitionCustody(ticket.custody.status, "RECEIVED") && ticket.custody.status !== "RECEIVED") {
      return {
        kind: "transition-error" as const,
        message: "Device cannot be received from the current custody status.",
      };
    }

    const receivedAt = new Date();
    const custodyData = {
      status: "RECEIVED" as const,
      receivedById: input.actor.id,
      receivedAt,
      condition: checkInData.condition ?? null,
      storageLocation: checkInData.storageLocation,
    };

    if (ticket.custody) {
      await tx.deviceCustody.update({
        where: { id: ticket.custody.id },
        data: custodyData,
      });
    } else {
      await tx.deviceCustody.create({
        data: {
          ticketId: ticket.id,
          deviceId: ticket.deviceId,
          ...custodyData,
        },
      });
    }

    const statusTo = ticket.status === "REGISTRATION_COMPLETED" ? "DEVICE_RECEIVED" : ticket.status;

    if (statusTo !== ticket.status) {
      await tx.repairTicket.update({
        where: { id: ticket.id },
        data: {
          status: statusTo,
        },
      });
    }

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "CUSTODY_CHANGED",
        statusFrom: ticket.status,
        statusTo,
        custodyFrom,
        custodyTo: "RECEIVED",
        note: "Device received.",
        metadata: {
          storageLocation: checkInData.storageLocation,
          source: "lead_custody_receive",
        },
      },
    });

    return { kind: "updated" as const, ticket: await findCustodyDetailInTransaction(tx, ticket.id) };
  });

  return toMutationResult(result);
}

export async function moveCustodyStatus(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
  data: unknown;
}): Promise<DeviceCustodyResult<TicketCustodyDetail>> {
  const roleError = ensureCustodyManager(input.actor);

  if (roleError) {
    return roleError;
  }

  const parsedInput = custodyStatusTransitionInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new DeviceCustodyValidationError(parsedInput.error);
  }

  const statusData: CustodyStatusTransitionInput = parsedInput.data;
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForCustodyMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    if (!ticket.custody) {
      return { kind: "missing-custody" as const };
    }

    if (!canTransitionCustody(ticket.custody.status, statusData.status)) {
      return {
        kind: "transition-error" as const,
        message: "Custody status must follow the next custody lifecycle step.",
      };
    }

    const movedAt = new Date();
    const shouldMarkReady = statusData.status === "READY_FOR_COLLECTION";

    await tx.deviceCustody.update({
      where: { id: ticket.custody.id },
      data: {
        status: statusData.status,
        ...(shouldMarkReady ? { readyForCollectionAt: movedAt } : {}),
      },
    });

    const statusTo = shouldMarkReady ? "READY_FOR_COLLECTION" : ticket.status;

    if (statusTo !== ticket.status) {
      await tx.repairTicket.update({
        where: { id: ticket.id },
        data: {
          status: statusTo,
          readyForPickupAt: movedAt,
          completedAt: movedAt,
        },
      });
    }

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: shouldMarkReady ? "READY_FOR_PICKUP" : "CUSTODY_CHANGED",
        statusFrom: ticket.status,
        statusTo,
        custodyFrom: ticket.custody.status,
        custodyTo: statusData.status,
        note: statusData.note ?? `Custody moved to ${statusData.status.replaceAll("_", " ")}.`,
        metadata: {
          source: "lead_custody",
        },
      },
    });

    return { kind: "updated" as const, ticket: await findCustodyDetailInTransaction(tx, ticket.id) };
  });

  return toMutationResult(result);
}

export async function confirmPickup(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
  data: unknown;
}): Promise<DeviceCustodyResult<TicketCustodyDetail>> {
  const roleError = ensureCustodyManager(input.actor);

  if (roleError) {
    return roleError;
  }

  const parsedInput = pickupConfirmationInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new DeviceCustodyValidationError(parsedInput.error);
  }

  const pickupData: PickupConfirmationInput = parsedInput.data;
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForCustodyMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    if (!ticket.custody) {
      return { kind: "missing-custody" as const };
    }

    if (ticket.custody.status !== "READY_FOR_COLLECTION" || !canMarkTicketCollected(ticket.status)) {
      return {
        kind: "transition-error" as const,
        message: "Pickup can only be confirmed after the ticket is ready for collection.",
      };
    }

    const pickupTime = new Date();

    await tx.deviceCustody.update({
      where: { id: ticket.custody.id },
      data: {
        status: "COLLECTED",
        releasedById: input.actor.id,
        collectedByName: pickupData.collectedByName,
        collectedByPhone: pickupData.collectedByPhone ?? null,
        collectedAt: pickupTime,
      },
    });

    await tx.repairTicket.update({
      where: { id: ticket.id },
      data: {
        status: "DEVICE_COLLECTED",
        closedAt: pickupTime,
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "PICKUP_CONFIRMED",
        statusFrom: ticket.status,
        statusTo: "DEVICE_COLLECTED",
        custodyFrom: "READY_FOR_COLLECTION",
        custodyTo: "COLLECTED",
        note: "Device pickup confirmed.",
        metadata: {
          collectedByName: pickupData.collectedByName,
          collectedByPhone: pickupData.collectedByPhone ?? null,
          source: "lead_custody_pickup",
        },
      },
    });

    return { kind: "updated" as const, ticket: await findCustodyDetailInTransaction(tx, ticket.id) };
  });

  return toMutationResult(result);
}

function toMutationResult(
  result:
    | { kind: "not-found" }
    | { kind: "missing-custody" }
    | { kind: "transition-error"; message: string }
    | { kind: "updated"; ticket: CustodyDetailRecord | null },
): DeviceCustodyResult<TicketCustodyDetail> {
  if (result.kind === "not-found") {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  if (result.kind === "missing-custody") {
    return {
      ok: false,
      status: 409,
      message: "Device custody has not been created yet.",
    };
  }

  if (result.kind === "transition-error") {
    return {
      ok: false,
      status: 409,
      message: result.message,
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
    data: toCustodyDetail(result.ticket),
  };
}
