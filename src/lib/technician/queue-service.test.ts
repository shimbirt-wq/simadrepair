import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTechnicianQueue } from "@/lib/technician/queue-service";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("technician queue (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("lists my open tickets, the pool with urgent first, and what I finished today", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const techUser = await createStaff(prisma, "TECHNICIAN");
    const tech = { kind: "staff" as const, ...techUser };
    const [normal, urgent, mine, done] = [await createSubmittedTicket(prisma), await createSubmittedTicket(prisma), await createSubmittedTicket(prisma), await createSubmittedTicket(prisma)];
    await performTicketAction(prisma, normal.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true } });
    await performTicketAction(prisma, urgent.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true, priority: "URGENT" } });
    for (const ticket of [mine, done]) {
      await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true } });
      await performTicketAction(prisma, ticket.id, tech, { action: { type: "CLAIM" } });
    }
    await performTicketAction(prisma, done.id, tech, { action: { type: "START" } });
    await performTicketAction(prisma, done.id, tech, { action: { type: "MARK_READY" } });

    const queue = await getTechnicianQueue(prisma, techUser.id);
    expect(queue.mine.map((t) => t.id)).toEqual([mine.id]);
    expect(queue.pool.map((t) => t.id)).toEqual([urgent.id, normal.id]);
    expect(queue.doneToday.map((t) => t.id)).toEqual([done.id]);
    expect(queue.openCount).toBe(1);
  });
});
