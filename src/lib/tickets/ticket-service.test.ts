import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("ticket service (database)", () => {
  const prisma = createTestPrisma();

  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  const staff = (user: { id: string; role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN" }) => ({ kind: "staff" as const, ...user });

  it("runs a ticket from check-in to pickup and records every step", async () => {
    const lead = staff(await createStaff(prisma, "LEAD_TECHNICIAN"));
    const tech = staff(await createStaff(prisma, "TECHNICIAN"));
    const ticket = await createSubmittedTicket(prisma);

    expect(await performTicketAction(prisma, ticket.trackingCode!, lead, { action: { type: "CHECK_IN" }, checkIn: { storageLocation: "Zone A", condition: "Scratched lid" } })).toMatchObject({ ok: true, status: "RECEIVED" });
    expect(await performTicketAction(prisma, ticket.id, lead, { action: { type: "ASSIGN", technicianId: tech.id } })).toMatchObject({ ok: true });
    expect(await performTicketAction(prisma, ticket.id, tech, { action: { type: "START" } })).toMatchObject({ ok: true, status: "IN_REPAIR" });
    expect(await performTicketAction(prisma, ticket.id, tech, { action: { type: "MARK_READY" } })).toMatchObject({ ok: true, status: "READY_FOR_PICKUP" });
    expect(await performTicketAction(prisma, ticket.id, lead, { action: { type: "PICKUP" }, pickup: { collectedByName: "Hodan Ali", collectedByPhone: "+252615550000" } })).toMatchObject({ ok: true, status: "COLLECTED" });

    const stored = await prisma.repairTicket.findUniqueOrThrow({ where: { id: ticket.id }, include: { custody: true, events: { orderBy: { createdAt: "asc" } } } });
    expect(stored).toMatchObject({ status: "COLLECTED", technicianId: tech.id });
    expect(stored.assignedAt).not.toBeNull();
    expect(stored.readyForPickupAt).not.toBeNull();
    expect(stored.closedAt).not.toBeNull();
    expect(stored.custody).toMatchObject({ receivedById: lead.id, storageLocation: "Zone A", condition: "Scratched lid", releasedById: lead.id, collectedByName: "Hodan Ali" });
    expect(stored.events.map((event) => event.eventType)).toEqual(["CHECKED_IN", "TECHNICIAN_ASSIGNED", "REPAIR_STARTED", "READY_FOR_PICKUP", "PICKUP_CONFIRMED"]);
  });

  it("rejects actions the workflow forbids without changing the ticket", async () => {
    const tech = staff(await createStaff(prisma, "TECHNICIAN"));
    const ticket = await createSubmittedTicket(prisma);

    expect(await performTicketAction(prisma, ticket.id, tech, { action: { type: "CHECK_IN" } })).toMatchObject({ ok: false, status: 403 });
    expect(await performTicketAction(prisma, ticket.id, tech, { action: { type: "MARK_READY" } })).toMatchObject({ ok: false });
    expect(await prisma.repairTicket.findUniqueOrThrow({ where: { id: ticket.id } })).toMatchObject({ status: "SUBMITTED" });
    expect(await prisma.repairEvent.count()).toBe(0);
  });

  it("enforces the claim cap using the technician's real open tickets", async () => {
    const lead = staff(await createStaff(prisma, "LEAD_TECHNICIAN"));
    const tech = staff(await createStaff(prisma, "TECHNICIAN"));
    const tickets = [];
    for (let i = 0; i < 4; i += 1) {
      const ticket = await createSubmittedTicket(prisma);
      await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } });
      tickets.push(ticket);
    }

    for (const ticket of tickets.slice(0, 3)) {
      expect(await performTicketAction(prisma, ticket.id, tech, { action: { type: "CLAIM" } })).toMatchObject({ ok: true });
    }
    expect(await performTicketAction(prisma, tickets[3].id, tech, { action: { type: "CLAIM" } })).toMatchObject({ ok: false, status: 409 });
  });

  it("refuses to assign an inactive or non-technician user", async () => {
    const lead = staff(await createStaff(prisma, "LEAD_TECHNICIAN"));
    const admin = await createStaff(prisma, "ADMIN");
    const ticket = await createSubmittedTicket(prisma);
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } });

    expect(await performTicketAction(prisma, ticket.id, lead, { action: { type: "ASSIGN", technicianId: admin.id } })).toMatchObject({ ok: false, status: 409 });
  });

  it("lets only one of two simultaneous check-ins win", async () => {
    const lead = staff(await createStaff(prisma, "LEAD_TECHNICIAN"));
    const ticket = await createSubmittedTicket(prisma);

    const results = await Promise.all([
      performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } }),
      performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } }),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(await prisma.repairEvent.count({ where: { ticketId: ticket.id } })).toBe(1);
  });
});
