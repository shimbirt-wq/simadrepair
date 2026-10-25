import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getAuditTicket, searchFilters, searchTickets } from "@/lib/audit/audit-service";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe("searchFilters", () => {
  it("reads codes, tags and university IDs", () => {
    expect(searchFilters("sim 26 k7p3qx")).toEqual([{ trackingCode: "SIM-26-K7P3QX" }, { ticketId: "SIM-26-K7P3QX" }]);
    expect(searchFilters("#147")).toEqual([{ tagNumber: 147 }]);
    expect(searchFilters("cs383833")).toEqual([{ requester: { universityId: "CS383833" } }]);
    expect(searchFilters("  ")).toEqual([]);
    expect(searchFilters("laptop")).toEqual([]);
  });
});

describe.skipIf(!hasTestDatabase)("audit search (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("finds tickets across events and shows who did what and why", async () => {
    const leadUser = await createStaff(prisma, "LEAD_TECHNICIAN", "Hodan Warsame");
    const techA = await createStaff(prisma, "TECHNICIAN", "Ahmed Nur");
    const techB = await createStaff(prisma, "TECHNICIAN", "Faisal Omar");
    const lead = { kind: "staff" as const, ...leadUser };

    const old = await createSubmittedTicket(prisma, "SIM-25-ABCDEF");
    await performTicketAction(prisma, old.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true } });
    // A new event: tag numbers restart, so #001 exists in both.
    await prisma.event.updateMany({ data: { isActive: false } });
    const current = await createSubmittedTicket(prisma, "SIM-26-GHJKMN");
    await performTicketAction(prisma, current.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true, zone: "A" } });
    await performTicketAction(prisma, current.id, lead, { action: { type: "ASSIGN", technicianId: techA.id } });
    await performTicketAction(prisma, current.id, lead, { action: { type: "ASSIGN", technicianId: techB.id, reason: "Ahmed went home sick" } });

    expect((await searchTickets(prisma, "#1")).map((t) => t.trackingCode).sort()).toEqual(["SIM-25-ABCDEF", "SIM-26-GHJKMN"]);
    expect((await searchTickets(prisma, "sim-26-ghjkmn")).map((t) => t.id)).toEqual([current.id]);
    const requester = await prisma.requester.findFirstOrThrow({ where: { tickets: { some: { id: old.id } } } });
    expect((await searchTickets(prisma, requester.universityId)).map((t) => t.id)).toEqual([old.id]);

    const audit = (await getAuditTicket(prisma, current.id))!;
    expect(audit.entries.map((e) => e.action)).toEqual(["Checked in", "Technician assigned", "Reassigned"]);
    const reassigned = audit.entries.at(-1)!;
    expect(reassigned).toMatchObject({ actor: "Hodan Warsame", role: "LEAD_TECHNICIAN", reason: "Ahmed went home sick", details: ["From Ahmed Nur", "To Faisal Omar"] });
    expect(audit.entries.find((e) => e.type === "CHECKED_IN")).toMatchObject({ reason: null, details: ["Tag #001", "Zone A"] });
  });
});
