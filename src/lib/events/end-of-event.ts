import type { PrismaClient } from "@prisma/client";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import type { WorkflowActor } from "@/lib/tickets/workflow";

/** Last-day bulk actions (LD11, D11). */

const UNCOLLECTED = ["READY_FOR_PICKUP", "CANNOT_BE_REPAIRED"] as const;
const UNFINISHED = ["SUBMITTED", "RECEIVED", "IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED", "CANNOT_REPAIR_PROPOSED"] as const;

export type EndOfEventPreview = { uncollectedAtDesk: number; unfinished: number; notDroppedOff: number; storedPasswords: number };

export async function previewEndOfEvent(prisma: PrismaClient, eventId: string): Promise<EndOfEventPreview> {
  const [uncollectedAtDesk, unfinished, notDroppedOff, storedPasswords] = await Promise.all([
    prisma.repairTicket.count({ where: { eventId, status: { in: [...UNCOLLECTED] }, custody: { location: "EVENT_DESK" } } }),
    prisma.repairTicket.count({ where: { eventId, status: { in: [...UNFINISHED.filter((s) => s !== "SUBMITTED")] } } }),
    prisma.repairTicket.count({ where: { eventId, status: "SUBMITTED" } }),
    prisma.repairTicket.count({ where: { eventId, devicePasswordEnc: { not: null } } }),
  ]);
  return { uncollectedAtDesk, unfinished, notDroppedOff, storedPasswords };
}

/** Moves ready-but-uncollected devices to the IT office; returns them so reminders can be sent. */
export async function moveUncollectedToOffice(prisma: PrismaClient, actor: Extract<WorkflowActor, { kind: "staff" }>, eventId: string) {
  const tickets = await prisma.repairTicket.findMany({
    where: { eventId, status: { in: [...UNCOLLECTED] }, custody: { location: "EVENT_DESK" } },
    select: { id: true, trackingCode: true, ticketId: true, tagNumber: true, status: true, custody: { select: { id: true } } },
  });
  for (const ticket of tickets) {
    await prisma.$transaction([
      prisma.deviceCustody.update({ where: { id: ticket.custody!.id }, data: { location: "IT_OFFICE" } }),
      prisma.repairEvent.create({
        data: { ticketId: ticket.id, actorId: actor.id, actorRole: actor.role, eventType: "CUSTODY_CHANGED", statusFrom: ticket.status, statusTo: ticket.status, note: "Moved to the IT office after the event.", metadata: { location: "IT_OFFICE" } },
      }),
    ]);
  }
  return tickets.map((ticket) => ({ id: ticket.id, trackingCode: ticket.trackingCode ?? ticket.ticketId, tagNumber: ticket.tagNumber }));
}

/** Closes every unfinished ticket through the workflow and deletes stored device passwords. */
export async function closeUnfinished(prisma: PrismaClient, actor: Extract<WorkflowActor, { kind: "staff" }>, eventId: string) {
  const tickets = await prisma.repairTicket.findMany({ where: { eventId, status: { in: [...UNFINISHED] } }, select: { id: true } });
  let closed = 0;
  for (const ticket of tickets) {
    const result = await performTicketAction(prisma, ticket.id, actor, { action: { type: "CLOSE_EVENT_ENDED" } });
    if (result.ok) closed += 1;
  }
  const passwords = await prisma.repairTicket.updateMany({ where: { eventId, devicePasswordEnc: { not: null } }, data: { devicePasswordEnc: null } });
  return { closed, passwordsDeleted: passwords.count };
}
