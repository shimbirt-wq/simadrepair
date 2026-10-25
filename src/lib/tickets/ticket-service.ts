import type { Prisma, PrismaClient } from "@prisma/client";
import { encryptDevicePassword } from "@/lib/secrets/device-password";
import { decide, OPEN_REPAIR_STATUSES, type WorkflowAction, type WorkflowActor } from "@/lib/tickets/workflow";

/**
 * Persists workflow decisions. Every status change in the app goes through
 * `performTicketAction`: load → decide → write ticket, custody data and event
 * in one transaction. Callers never set `status` themselves.
 */

export type CheckInData = {
  idChecked?: boolean;
  conditionChecks?: string[];
  condition?: string | null;
  accessoriesReceived?: string[];
  zone?: string | null;
  priority?: "NORMAL" | "URGENT";
  devicePassword?: string | null;
};
export type PickupData = { collectedByName: string; collectedByPhone?: string | null };

export type TicketActionInput =
  | { action: Exclude<WorkflowAction, { type: "CHECK_IN" } | { type: "PICKUP" } | { type: "CLAIM" }> }
  | { action: { type: "CHECK_IN" }; checkIn?: CheckInData }
  | { action: { type: "PICKUP" }; pickup: PickupData }
  | { action: { type: "CLAIM" } };

export type TicketActionResult =
  | { ok: true; ticketId: string; status: string; tagNumber?: number | null }
  | { ok: false; status: 400 | 403 | 404 | 409; message: string };

type Db = PrismaClient | Prisma.TransactionClient;

export function ticketLookupWhere(ref: string): Prisma.RepairTicketWhereInput {
  return { OR: [{ id: ref }, { ticketId: ref }, { trackingCode: ref }] };
}

async function countOpenRepairs(db: Db, technicianId: string) {
  return db.repairTicket.count({ where: { technicianId, status: { in: [...OPEN_REPAIR_STATUSES] } } });
}

export async function performTicketAction(
  prisma: PrismaClient,
  ticketRef: string,
  actor: WorkflowActor,
  input: TicketActionInput,
): Promise<TicketActionResult> {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.repairTicket.findFirst({
      where: ticketLookupWhere(ticketRef),
      select: { id: true, eventId: true, deviceId: true, status: true, technicianId: true, custody: { select: { id: true } } },
    });

    if (!ticket) return { ok: false, status: 404, message: "Repair ticket not found." } as const;

    const action: WorkflowAction =
      input.action.type === "CLAIM" && actor.kind === "staff"
        ? { type: "CLAIM", openRepairCount: await countOpenRepairs(tx, actor.id) }
        : (input.action as WorkflowAction);

    if (action.type === "ASSIGN") {
      const technician = await tx.user.findFirst({
        where: { id: action.technicianId, isActive: true, role: { in: ["TECHNICIAN", "LEAD_TECHNICIAN"] } },
        select: { id: true },
      });
      if (!technician) return { ok: false, status: 409, message: "Choose an active technician." } as const;
    }

    const decision = decide({ status: ticket.status, technicianId: ticket.technicianId }, actor, action);

    if (!decision.ok) {
      const status = decision.code === "FORBIDDEN" ? 403 : decision.code === "INVALID_INPUT" ? 400 : 409;
      return { ok: false, status, message: decision.message } as const;
    }

    const now = new Date();
    const ticketData: Prisma.RepairTicketUpdateManyMutationInput & { technicianId?: string | null } = {
      status: decision.status,
      technicianId: decision.technicianId,
    };

    if (decision.technicianId && decision.technicianId !== ticket.technicianId) ticketData.assignedAt = now;
    if (!decision.technicianId) ticketData.assignedAt = null;
    if (decision.event.type === "REPAIR_STARTED") ticketData.startedAt = now;
    // The device password is only needed while the device is with us.
    if (decision.status === "COLLECTED" || decision.status === "CANCELLED") ticketData.devicePasswordEnc = null;
    if (decision.status === "READY_FOR_PICKUP") {
      ticketData.readyForPickupAt = now;
      ticketData.completedAt = now;
    }
    if (decision.status === "CANNOT_BE_REPAIRED") ticketData.completedAt = now;
    if (decision.status === "COLLECTED") ticketData.closedAt = now;
    if (decision.status === "CANCELLED") ticketData.cancelledAt = now;

    // Optimistic check: the ticket must still be in the status we decided from.
    const updated = await tx.repairTicket.updateMany({ where: { id: ticket.id, status: ticket.status }, data: ticketData });
    if (updated.count !== 1) return { ok: false, status: 409, message: "This ticket just changed. Refresh and try again." } as const;

    let tagNumber: number | null = null;
    if (action.type === "CHECK_IN") {
      const checkIn = ("checkIn" in input ? input.checkIn : undefined) ?? {};
      // Row lock on the event serialises tag allocation across simultaneous check-ins.
      const event = await tx.event.update({ where: { id: ticket.eventId }, data: { lastTagNumber: { increment: 1 } }, select: { lastTagNumber: true } });
      tagNumber = event.lastTagNumber;
      await tx.repairTicket.update({
        where: { id: ticket.id },
        data: {
          tagNumber,
          priority: checkIn.priority ?? "NORMAL",
          devicePasswordEnc: checkIn.devicePassword ? encryptDevicePassword(checkIn.devicePassword) : null,
        },
      });
      const custodyData = {
        receivedById: actor.kind === "staff" ? actor.id : null,
        receivedAt: now,
        idChecked: Boolean(checkIn.idChecked),
        conditionChecks: checkIn.conditionChecks ?? [],
        condition: checkIn.condition ?? null,
        accessoriesReceived: checkIn.accessoriesReceived ?? [],
        storageLocation: checkIn.zone ?? null,
      };
      if (ticket.custody) await tx.deviceCustody.update({ where: { id: ticket.custody.id }, data: custodyData });
      else await tx.deviceCustody.create({ data: { ticketId: ticket.id, deviceId: ticket.deviceId, ...custodyData } });
    }

    if (decision.status === "READY_FOR_PICKUP" && ticket.custody) {
      await tx.deviceCustody.update({ where: { id: ticket.custody.id }, data: { readyForCollectionAt: now } });
    }

    if ("pickup" in input) {
      const custodyData = {
        releasedById: actor.kind === "staff" ? actor.id : null,
        collectedByName: input.pickup.collectedByName.trim(),
        collectedByPhone: input.pickup.collectedByPhone?.trim() || null,
        collectedAt: now,
      };
      if (ticket.custody) await tx.deviceCustody.update({ where: { id: ticket.custody.id }, data: custodyData });
      else await tx.deviceCustody.create({ data: { ticketId: ticket.id, deviceId: ticket.deviceId, ...custodyData } });
    }

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: actor.kind === "staff" ? actor.id : null,
        actorRole: actor.kind === "staff" ? actor.role : null,
        eventType: decision.event.type,
        statusFrom: decision.event.statusFrom,
        statusTo: decision.event.statusTo,
        note: decision.event.note,
        metadata: {
          ...(decision.event.metadata ?? {}),
          ...("pickup" in input ? { collectedByName: input.pickup.collectedByName, collectedByPhone: input.pickup.collectedByPhone ?? null } : {}),
          ...(tagNumber !== null ? { tagNumber } : {}),
          ...("checkIn" in input && input.checkIn?.zone ? { zone: input.checkIn.zone } : {}),
          ...("checkIn" in input && input.checkIn?.priority === "URGENT" ? { priority: "URGENT" } : {}),
        },
      },
    });

    return { ok: true, ticketId: ticket.id, status: decision.status, tagNumber } as const;
  });
}
