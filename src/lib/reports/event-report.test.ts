import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getEventReport, getLiveOverview } from "@/lib/reports/event-report";
import { ticketsCsv } from "@/lib/reports/tickets-csv";
import { FAULTS } from "@/lib/tickets/repair-record";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { READY_RECORD } from "@/test/fixtures";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("event report (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  async function seed() {
    const leadUser = await createStaff(prisma, "LEAD_TECHNICIAN", "Hodan Warsame");
    const techUser = await createStaff(prisma, "TECHNICIAN", "Ahmed Nur");
    const lead = { kind: "staff" as const, ...leadUser };
    const tech = { kind: "staff" as const, ...techUser };
    // Sequential: concurrent creation would race on the single active event.
    const tickets = [];
    for (let i = 0; i < 6; i++) tickets.push(await createSubmittedTicket(prisma));
    const [collected, ready, cannot, inRepair, cancelled] = tickets; // tickets[5] stays submitted

    for (const t of [collected, ready, cannot, inRepair]) {
      await performTicketAction(prisma, t.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true } });
      await performTicketAction(prisma, t.id, lead, { action: { type: "ASSIGN", technicianId: tech.id } });
      await performTicketAction(prisma, t.id, tech, { action: { type: "START" } });
    }
    for (const t of [collected, ready]) await performTicketAction(prisma, t.id, tech, { action: { type: "MARK_READY", record: READY_RECORD } });
    await performTicketAction(prisma, collected.id, lead, { action: { type: "PICKUP" }, pickup: { collectedByName: "Amina Hassan" } });
    await prisma.repairTicket.update({ where: { id: collected.id }, data: { rating: 4 } });
    await performTicketAction(prisma, cannot.id, tech, { action: { type: "PROPOSE_CANNOT_REPAIR", reason: "Motherboard failure" } });
    await performTicketAction(prisma, cannot.id, lead, { action: { type: "CONFIRM_CANNOT_REPAIR" } });
    await performTicketAction(prisma, cancelled.id, lead, { action: { type: "CANCEL" } });
    await prisma.requester.updateMany({ data: { faculty: "Computing" } });
    return { eventId: collected.eventId, tickets };
  }

  it("aggregates the event", async () => {
    const { eventId } = await seed();
    const report = (await getEventReport(prisma, eventId))!;

    expect(report.summary).toMatchObject({
      registered: 6,
      cancelled: 1,
      received: 4,
      fixed: 2,
      cannotRepair: 1,
      collected: 1,
      uncollected: 2,
      inProgress: 1,
      averageRating: 4,
      ratings: 1,
    });
    expect(report.summary.fixRate).toBeCloseTo(2 / 3);
    expect(report.summary.medianHoursToReady).not.toBeNull();
    expect(report.topFaults).toEqual([{ label: FAULTS.find((f) => f.value === "SLOW_VIRUS")!.label, count: 2 }]);
    expect(report.topActions.map((row) => row.count)).toEqual([2, 2]);
    expect(report.byFaculty).toEqual([{ label: "Computing", registered: 6, fixed: 2 }]);
    expect(report.byTechnician).toEqual([{ name: "Ahmed Nur", fixed: 2, cannotRepair: 1, open: 1, averageRating: 4 }]);
    expect(report.previous).toEqual([]);
  });

  it("compares with earlier events only", async () => {
    const { eventId } = await seed();
    const current = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    const year = 365 * 24 * 60 * 60 * 1000;
    await prisma.event.create({
      data: {
        name: "Maintenance Week 2025",
        startsOn: new Date(current.startsOn.getTime() - year),
        endsOn: new Date(current.endsOn.getTime() - year),
        registrationOpensOn: new Date(current.registrationOpensOn.getTime() - year),
        registrationClosesOn: new Date(current.registrationClosesOn.getTime() - year),
        venue: "Main Hall",
        hours: "8:00–16:00",
        deskWhatsapp: "+252615001122",
      },
    });
    const report = (await getEventReport(prisma, eventId))!;
    expect(report.previous.map((p) => [p.name, p.summary.registered])).toEqual([["Maintenance Week 2025", 0]]);
  });

  it("exports every ticket of the event as CSV", async () => {
    const { eventId, tickets } = await seed();
    const lines = (await ticketsCsv(prisma, eventId)).trim().split("\r\n");
    expect(lines).toHaveLength(1 + tickets.length);
    expect(lines[0]).toContain("Tracking code");
    for (const ticket of tickets) expect(lines.some((line) => line.startsWith(ticket.trackingCode!) || line.startsWith(`﻿${ticket.trackingCode}`))).toBe(true);
  });

  it("shows today's numbers and technician load on the live overview", async () => {
    await seed();
    const overview = await getLiveOverview(prisma);
    expect(overview.today).toEqual({ registered: 6, received: 4, ready: 2, collected: 1 });
    expect(overview.open).toEqual({ dropOff: 1, toAssign: 0, inRepair: 1, blocked: 0, ready: 2 });
    expect(overview.technicians.find((t) => t.name === "Ahmed Nur")?.openCount).toBe(1);
  });
});
