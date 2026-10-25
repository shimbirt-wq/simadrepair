import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { countVolunteers, latestEvent } from "@/lib/site/volunteers";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("volunteer count (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("counts technicians who worked on the latest event", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const techA = await createStaff(prisma, "TECHNICIAN");
    const techB = await createStaff(prisma, "TECHNICIAN");
    await createStaff(prisma, "TECHNICIAN"); // never assigned
    const tickets = [];
    for (let i = 0; i < 3; i++) tickets.push(await createSubmittedTicket(prisma));
    const event = (await latestEvent(prisma))!;
    expect(await countVolunteers(prisma, event.id)).toBe(0);

    for (const [ticket, tech] of [[tickets[0], techA], [tickets[1], techA], [tickets[2], techB]] as const) {
      await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true } });
      await performTicketAction(prisma, ticket.id, lead, { action: { type: "ASSIGN", technicianId: tech.id } });
    }
    expect(await countVolunteers(prisma, event.id)).toBe(2);
  });
});
