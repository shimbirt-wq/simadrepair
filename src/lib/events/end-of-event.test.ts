import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeUnfinished, moveUncollectedToOffice, previewEndOfEvent } from "@/lib/events/end-of-event";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { READY_RECORD } from "@/test/fixtures";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("end of event (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("moves uncollected devices, closes unfinished ones and deletes passwords", async () => {
    const leadUser = await createStaff(prisma, "LEAD_TECHNICIAN");
    const lead = { kind: "staff" as const, ...leadUser };
    const notDroppedOff = await createSubmittedTicket(prisma);
    const inRepair = await createSubmittedTicket(prisma);
    const ready = await createSubmittedTicket(prisma);
    for (const ticket of [inRepair, ready]) {
      await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true, devicePassword: "secret" } });
      await performTicketAction(prisma, ticket.id, lead, { action: { type: "ASSIGN", technicianId: leadUser.id } });
      await performTicketAction(prisma, ticket.id, lead, { action: { type: "START" } });
    }
    await performTicketAction(prisma, ready.id, lead, { action: { type: "MARK_READY", record: READY_RECORD } });
    const eventId = ready.eventId;

    expect(await previewEndOfEvent(prisma, eventId)).toEqual({ uncollectedAtDesk: 1, unfinished: 1, notDroppedOff: 1, storedPasswords: 2 });

    expect((await moveUncollectedToOffice(prisma, lead, eventId)).map((t) => t.id)).toEqual([ready.id]);
    expect((await prisma.deviceCustody.findUniqueOrThrow({ where: { ticketId: ready.id } })).location).toBe("IT_OFFICE");

    expect(await closeUnfinished(prisma, lead, eventId)).toEqual({ closed: 2, passwordsDeleted: 2 });
    const status = async (id: string) => (await prisma.repairTicket.findUniqueOrThrow({ where: { id } })).status;
    expect(await status(notDroppedOff.id)).toBe("CANCELLED");
    expect(await status(inRepair.id)).toBe("CANNOT_BE_REPAIRED");
    expect(await status(ready.id)).toBe("READY_FOR_PICKUP");
    // The unrepaired device now waits at the desk to be handed back (or moved to the office).
    expect(await previewEndOfEvent(prisma, eventId)).toEqual({ uncollectedAtDesk: 1, unfinished: 0, notDroppedOff: 0, storedPasswords: 0 });
  });
});
