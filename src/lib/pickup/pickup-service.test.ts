import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { findPickupTickets } from "@/lib/pickup/pickup-service";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { READY_RECORD } from "@/test/fixtures";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("pickup lookup (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("finds only the ready devices of the person whose ID card is shown, and records the hand-back", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const tech = { kind: "staff" as const, ...(await createStaff(prisma, "TECHNICIAN")) };
    const ready = await createSubmittedTicket(prisma);
    const waiting = await createSubmittedTicket(prisma);
    await performTicketAction(prisma, ready.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true, accessoriesReceived: ["CHARGER", "BAG"] } });
    await performTicketAction(prisma, ready.id, lead, { action: { type: "ASSIGN", technicianId: tech.id } });
    await performTicketAction(prisma, ready.id, tech, { action: { type: "START" } });
    await performTicketAction(prisma, ready.id, tech, { action: { type: "MARK_READY", record: READY_RECORD } });

    const universityId = (await prisma.requester.findUniqueOrThrow({ where: { id: ready.requesterId! } })).universityId;
    const lookup = await findPickupTickets(prisma, universityId.toLowerCase());
    expect(lookup.tickets.map((t) => t.id)).toEqual([ready.id]);
    expect(lookup.tickets[0].accessoriesReceived.map((a) => a.value)).toEqual(["CHARGER", "BAG"]);
    expect(waiting.id).not.toBe(ready.id);

    await performTicketAction(prisma, ready.id, lead, { action: { type: "PICKUP" }, pickup: { collectedByName: "Hodan Ali", accessoriesReturned: ["CHARGER"] } });
    expect((await prisma.deviceCustody.findUniqueOrThrow({ where: { ticketId: ready.id } })).accessoriesReturned).toEqual(["CHARGER"]);
    expect((await findPickupTickets(prisma, universityId)).tickets).toEqual([]);
  });

  it("returns nothing for an unknown or malformed ID", async () => {
    expect(await findPickupTickets(prisma, "XX999999")).toEqual({ requester: null, tickets: [] });
    expect(await findPickupTickets(prisma, "hello")).toEqual({ requester: null, tickets: [] });
  });
});
