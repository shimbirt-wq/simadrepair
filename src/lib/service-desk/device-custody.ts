import { Prisma, type CustodyStatus, type RepairMethod, type RepairStatus, type Severity, type UserRole } from "@prisma/client";
import { ZodError } from "zod";
import type { PublicUser } from "@/lib/auth/public-user";
import { canTransitionRepairStatus } from "@/lib/constants/repair-status";
import { prisma } from "@/lib/db/prisma";
import { createNotificationForTicketEvent } from "@/lib/service-desk/notifications";
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
    severity: Severity | null;
    repairMethod: RepairMethod | null;
    issueCategory: string | null;
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
    screenCondition: string | null;
    keyboardCondition: string | null;
    batteryCondition: string | null;
    bodyCondition: string | null;
    accessories: Prisma.JsonValue;
    storageLocation: string | null;
    checkInPhotoUrls: Prisma.JsonValue;
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
  severity: true,
  repairMethod: true,
  issueCategory: true,
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
      screenCondition: true,
      keyboardCondition: true,
      batteryCondition: true,
      bodyCondition: true,
      accessories: true,
      storageLocation: true,
      checkInPhotoUrls: true,
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
      severity: ticket.severity,
      repairMethod: ticket.repairMethod,
      issueCategory: ticket.issueCategory,
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
      ticketId: true,
      trackingCode: true,
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

function getTicketStatusAfterCheckIn(status: RepairStatus) {
  return canTransitionRepairStatus(status, "DEVICE_RECEIVED") ? "DEVICE_RECEIVED" : status;
}

function canMarkTicketReadyForCollection(status: RepairStatus) {
  return status === "READY_FOR_COLLECTION" || canTransitionRepairStatus(status, "READY_FOR_COLLECTION");
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

    if (ticket.custody && !canTransitionCustody(ticket.custody.status, "RECEIVED")) {
      return {
        kind: "transition-error" as const,
        message: "Device custody cannot be checked in from the current custody status.",
      };
    }

    const custodyData = {
      status: "RECEIVED" as const,
      receivedById: input.actor.id,
      receivedAt: new Date(),
      condition: checkInData.condition ?? null,
      screenCondition: checkInData.screenCondition ?? null,
      keyboardCondition: checkInData.keyboardCondition ?? null,
      batteryCondition: checkInData.batteryCondition ?? null,
      bodyCondition: checkInData.bodyCondition ?? null,
      accessories: checkInData.accessories ?? [],
      storageLocation: checkInData.storageLocation,
      checkInPhotoUrls: checkInData.checkInPhotoUrls ?? [],
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

    const statusTo = getTicketStatusAfterCheckIn(ticket.status);

    if (statusTo !== ticket.status) {
      await tx.repairTicket.update({
        where: { id: ticket.id },
        data: {
          status: statusTo,
        },
      });

      await tx.repairEvent.create({
        data: {
          ticketId: ticket.id,
          actorId: input.actor.id,
          actorRole: input.actor.role,
          eventType: "STATUS_CHANGED",
          statusFrom: ticket.status,
          statusTo,
          custodyFrom,
          custodyTo: "RECEIVED",
          note: "Ticket marked device received after physical check-in.",
          metadata: {
            source: "lead_custody_check_in",
          },
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
        note: "Device checked in.",
        metadata: {
          storageLocation: checkInData.storageLocation,
          hasCheckInPhotos: Boolean(checkInData.checkInPhotoUrls?.length),
        },
      },
    });

    return { kind: "updated" as const, ticket: await findCustodyDetailInTransaction(tx, ticket.id) };
  });

  if (result.kind === "updated" && result.ticket) {
    await createNotificationForTicketEvent({
      ticketId: result.ticket.id,
      eventType: "DEVICE_RECEIVED",
    }).catch(() => null);
  }

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

    const shouldMarkTicketReady = statusData.status === "READY_FOR_COLLECTION" && ticket.status !== "READY_FOR_COLLECTION";

    if (statusData.status === "READY_FOR_COLLECTION" && !canMarkTicketReadyForCollection(ticket.status)) {
      return {
        kind: "transition-error" as const,
        message: "Repair ticket must pass quality inspection before the device can be marked ready for collection.",
      };
    }

    const movedAt = new Date();

    await tx.deviceCustody.update({
      where: { id: ticket.custody.id },
      data: {
        status: statusData.status,
        ...(statusData.status === "READY_FOR_COLLECTION" ? { readyForCollectionAt: movedAt } : {}),
      },
    });

    if (shouldMarkTicketReady) {
      await tx.repairTicket.update({
        where: { id: ticket.id },
        data: {
          status: "READY_FOR_COLLECTION",
          readyForPickupAt: movedAt,
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
        statusTo: shouldMarkTicketReady ? "READY_FOR_COLLECTION" : ticket.status,
        custodyFrom: ticket.custody.status,
        custodyTo: statusData.status,
        note: statusData.note ?? `Custody moved to ${statusData.status.replaceAll("_", " ")}.`,
        metadata: {
          source: "lead_custody",
        },
      },
    });

    if (shouldMarkTicketReady) {
      await tx.repairEvent.create({
        data: {
          ticketId: ticket.id,
          actorId: input.actor.id,
          actorRole: input.actor.role,
          eventType: "READY_FOR_PICKUP",
          statusFrom: ticket.status,
          statusTo: "READY_FOR_COLLECTION",
          custodyFrom: ticket.custody.status,
          custodyTo: "READY_FOR_COLLECTION",
          note: "Device marked ready for pickup.",
          metadata: {
            source: "lead_custody",
          },
        },
      });
    }

    return { kind: "updated" as const, ticket: await findCustodyDetailInTransaction(tx, ticket.id) };
  });

  if (result.kind === "updated" && result.ticket && statusData.status === "READY_FOR_COLLECTION") {
    await createNotificationForTicketEvent({
      ticketId: result.ticket.id,
      eventType: "READY_FOR_PICKUP",
    }).catch(() => null);
  }

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

    if (ticket.custody.status !== "READY_FOR_COLLECTION") {
      return {
        kind: "transition-error" as const,
        message: "Device pickup can only be confirmed after custody is ready for collection.",
      };
    }

    if (!canMarkTicketCollected(ticket.status)) {
      return {
        kind: "transition-error" as const,
        message: "Repair ticket must be ready for collection before device pickup can be confirmed.",
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
        pickupCodeVerifiedAt: pickupData.pickupCode ? pickupTime : null,
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
          pickupCodeProvided: Boolean(pickupData.pickupCode),
        },
      },
    });

    return { kind: "updated" as const, ticket: await findCustodyDetailInTransaction(tx, ticket.id) };
  });

  if (result.kind === "updated" && result.ticket) {
    await createNotificationForTicketEvent({
      ticketId: result.ticket.id,
      eventType: "TICKET_CLOSED",
    }).catch(() => null);
  }

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
      message: "Device custody has not been checked in yet.",
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
