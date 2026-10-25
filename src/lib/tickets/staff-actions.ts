import type { PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import type { StaffTicketAction } from "@/lib/tickets/action-schema";
import { performTicketAction, type TicketActionResult } from "@/lib/tickets/ticket-service";

/** Maps a validated staff request onto the ticket service. */
export function performStaffTicketAction(prisma: PrismaClient, user: PublicUser, ticketRef: string, body: StaffTicketAction): Promise<TicketActionResult> {
  const actor = { kind: "staff" as const, id: user.id, role: user.role };

  switch (body.type) {
    case "CHECK_IN":
      return performTicketAction(prisma, ticketRef, actor, {
        action: { type: "CHECK_IN" },
        checkIn: {
          idChecked: body.idChecked,
          conditionChecks: body.conditionChecks,
          condition: body.condition,
          accessoriesReceived: body.accessoriesReceived,
          zone: body.zone,
          priority: body.priority,
          devicePassword: body.devicePassword,
        },
      });
    case "PICKUP":
      return performTicketAction(prisma, ticketRef, actor, { action: { type: "PICKUP" }, pickup: { collectedByName: body.collectedByName, collectedByPhone: body.collectedByPhone, accessoriesReturned: body.accessoriesReturned } });
    case "CLAIM":
      return performTicketAction(prisma, ticketRef, actor, { action: { type: "CLAIM" } });
    default:
      return performTicketAction(prisma, ticketRef, actor, { action: body });
  }
}
