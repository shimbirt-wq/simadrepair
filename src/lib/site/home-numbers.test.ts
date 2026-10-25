import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getHomeNumbers } from "@/lib/site/home-numbers";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { READY_RECORD } from "@/test/fixtures";
import { createActiveEvent, createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("home numbers (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("is hidden without an event or without tickets", async () => {
    expect(await getHomeNumbers(prisma)).toBeNull();
    await createActiveEvent(prisma);
    expect(await getHomeNumbers(prisma)).toBeNull();
  });

  it("shows registered, repaired and the rating once there is one", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const fixed = await createSubmittedTicket(prisma);
    await createSubmittedTicket(prisma);
    await performTicketAction(prisma, fixed.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true } });
    await performTicketAction(prisma, fixed.id, lead, { action: { type: "ASSIGN", technicianId: lead.id } });
    await performTicketAction(prisma, fixed.id, lead, { action: { type: "START" } });
    await performTicketAction(prisma, fixed.id, lead, { action: { type: "MARK_READY", record: READY_RECORD } });
    expect(await getHomeNumbers(prisma)).toMatchObject({ registered: 2, repaired: 1, averageRating: null, running: true });

    await prisma.repairTicket.update({ where: { id: fixed.id }, data: { rating: 5 } });
    expect(await getHomeNumbers(prisma)).toMatchObject({ averageRating: 5, ratings: 1 });
  });
});
