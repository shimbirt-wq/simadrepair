import type { CustodyStatus, RepairEventType, RepairMethod, RepairStatus, Severity } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const publicTrackingCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^SIM-\d{4}-\d+$/, "Tracking code format is invalid");

const PUBLIC_REPAIR_EVENT_TYPES = new Set<RepairEventType>([
  "TICKET_CREATED",
  "TRIAGE_UPDATED",
  "STATUS_CHANGED",
  "TECHNICIAN_ASSIGNED",
  "STUDENT_ACTION_REQUESTED",
  "PART_REQUIREMENT_ADDED",
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
  severity: Severity | null;
  repairMethod: RepairMethod | null;
  submittedAt: Date;
  assignedAt: Date | null;
  readyForPickupAt: Date | null;
  requesterName: string;
  device: {
    deviceType: string;
    brand: string;
  };
  issueCategory: string | null;
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
      severity: true,
      repairMethod: true,
      createdAt: true,
      assignedAt: true,
      readyForPickupAt: true,
      issueCategory: true,
      requester: {
        select: {
          fullName: true,
        },
      },
      device: {
        select: {
          deviceType: true,
          brand: true,
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
    severity: ticket.severity,
    repairMethod: ticket.repairMethod,
    submittedAt: ticket.createdAt,
    assignedAt: ticket.assignedAt,
    readyForPickupAt: ticket.readyForPickupAt,
    requesterName: getDisplaySafeName(ticket.requester?.fullName),
    device: {
      deviceType: ticket.device.deviceType,
      brand: ticket.device.brand,
    },
    issueCategory: ticket.issueCategory,
    timeline: ticket.events.filter(isPublicRepairEvent).map(toPublicTimelineEvent),
  };
}
