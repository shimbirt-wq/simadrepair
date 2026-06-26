import type { CustodyStatus, RepairEventType, RepairStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const publicTrackingCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^SIM-\d{4}-\d+$/, "Tracking code format is invalid");

const PUBLIC_REPAIR_EVENT_TYPES = new Set<RepairEventType>([
  "TICKET_CREATED",
  "STATUS_CHANGED",
  "CUSTODY_CHANGED",
  "TECHNICIAN_ASSIGNED",
  "READY_FOR_PICKUP",
  "PICKUP_CONFIRMED",
  "TICKET_CLOSED",
  "TICKET_CANCELLED",
]);

export type PublicRepairTimelineEvent = {
  eventType: RepairEventType;
  occurredAt: Date;
  statusFrom: string | null;
  statusTo: string | null;
  custodyFrom: CustodyStatus | null;
  custodyTo: CustodyStatus | null;
};

export type PublicTrackingInfo = {
  trackingCode: string;
  status: RepairStatus;
  submittedAt: Date;
  assignedAt: Date | null;
  readyForPickupAt: Date | null;
  requesterName: string;
  device: {
    deviceType: string;
    brand: string;
    model: string;
  };
  technician: {
    fullName: string;
    phone: string | null;
  } | null;
  custody: {
    status: CustodyStatus;
    storageLocation: string | null;
    receivedAt: Date | null;
    readyForCollectionAt: Date | null;
    collectedAt: Date | null;
  } | null;
  timeline: PublicRepairTimelineEvent[];
};

export class PublicTrackingValidationError extends Error {
  constructor() {
    super("Invalid tracking code format.");
    this.name = "PublicTrackingValidationError";
  }
}

type PublicRepairEventCandidate = {
  eventType: RepairEventType;
};

type PublicTrackingEventRecord = PublicRepairEventCandidate & {
  createdAt: Date;
  statusFrom: string | null;
  statusTo: string | null;
  custodyFrom: CustodyStatus | null;
  custodyTo: CustodyStatus | null;
};

export function isPublicRepairEvent(event: PublicRepairEventCandidate) {
  return PUBLIC_REPAIR_EVENT_TYPES.has(event.eventType);
}

function getDisplaySafeName(fullName: string | null | undefined) {
  const firstName = fullName?.trim().split(/\s+/)[0];

  return firstName || "Requester";
}

function parseTrackingCode(trackingCode: string) {
  const parsed = publicTrackingCodeSchema.safeParse(trackingCode);

  if (!parsed.success) {
    throw new PublicTrackingValidationError();
  }

  return parsed.data;
}

function toPublicTimelineEvent(event: PublicTrackingEventRecord): PublicRepairTimelineEvent {
  return {
    eventType: event.eventType,
    occurredAt: event.createdAt,
    statusFrom: event.statusFrom,
    statusTo: event.statusTo,
    custodyFrom: event.custodyFrom,
    custodyTo: event.custodyTo,
  };
}

export async function getPublicTrackingInfo(trackingCode: string): Promise<PublicTrackingInfo | null> {
  const safeTrackingCode = parseTrackingCode(trackingCode);
  const ticket = await prisma.repairTicket.findUnique({
    where: { trackingCode: safeTrackingCode },
    select: {
      trackingCode: true,
      ticketId: true,
      status: true,
      createdAt: true,
      assignedAt: true,
      readyForPickupAt: true,
      requester: {
        select: {
          fullName: true,
        },
      },
      device: {
        select: {
          deviceType: true,
          brand: true,
          model: true,
        },
      },
      technician: {
        select: {
          fullName: true,
          phone: true,
        },
      },
      custody: {
        select: {
          status: true,
          storageLocation: true,
          receivedAt: true,
          readyForCollectionAt: true,
          collectedAt: true,
        },
      },
      events: {
        orderBy: { createdAt: "asc" },
        select: {
          eventType: true,
          createdAt: true,
          statusFrom: true,
          statusTo: true,
          custodyFrom: true,
          custodyTo: true,
        },
      },
    },
  });

  if (!ticket) {
    return null;
  }

  return {
    trackingCode: ticket.trackingCode ?? ticket.ticketId,
    status: ticket.status,
    submittedAt: ticket.createdAt,
    assignedAt: ticket.assignedAt,
    readyForPickupAt: ticket.readyForPickupAt,
    requesterName: getDisplaySafeName(ticket.requester?.fullName),
    device: {
      deviceType: ticket.device.deviceType,
      brand: ticket.device.brand,
      model: ticket.device.model,
    },
    technician: ticket.technician
      ? {
          fullName: ticket.technician.fullName,
          phone: ticket.technician.phone,
        }
      : null,
    custody: ticket.custody
      ? {
          status: ticket.custody.status,
          storageLocation: ticket.custody.storageLocation,
          receivedAt: ticket.custody.receivedAt,
          readyForCollectionAt: ticket.custody.readyForCollectionAt,
          collectedAt: ticket.custody.collectedAt,
        }
      : null,
    timeline: ticket.events.filter(isPublicRepairEvent).map(toPublicTimelineEvent),
  };
}
