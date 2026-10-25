import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getBoard } from "@/lib/board/board-service";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("board service (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("places tickets in columns and reports technician load", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const tech = await createStaff(prisma, "TECHNICIAN", "Ahmed Nur");
    const waiting = await createSubmittedTicket(prisma);
    const toAssign = await createSubmittedTicket(prisma);
    const assigned = await createSubmittedTicket(prisma);
    await performTicketAction(prisma, toAssign.id, lead, { action: { type: "CHECK_IN" } });
    await performTicketAction(prisma, assigned.id, lead, { action: { type: "CHECK_IN" } });
    await performTicketAction(prisma, assigned.id, lead, { action: { type: "ASSIGN", technicianId: tech.id } });

    const board = await getBoard(prisma);
    const column = (id: string) => board.tickets.find((ticket) => ticket.id === id)?.column;
    expect(column(waiting.id)).toBe("DROP_OFF");
    expect(column(toAssign.id)).toBe("TO_ASSIGN");
    expect(column(assigned.id)).toBe("IN_REPAIR");
    expect(board.technicians.find((t) => t.id === tech.id)?.openCount).toBe(1);
  });

  it("flags a received ticket left unassigned for over an hour", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const ticket = await createSubmittedTicket(prisma);
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } });
    const later = new Date(Date.now() + 2 * 60 * 60 * 1000);
    expect((await getBoard(prisma, later)).tickets[0]).toMatchObject({ column: "TO_ASSIGN", stuck: true });
  });
});
