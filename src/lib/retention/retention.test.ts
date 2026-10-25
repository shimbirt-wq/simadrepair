import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getEventReport } from "@/lib/reports/event-report";
import { isAuthorizedCron } from "@/lib/retention/cron-auth";
import { retentionCutoff, runRetention } from "@/lib/retention/retention";
import { setPhotoStorage } from "@/lib/photos/storage";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { READY_RECORD } from "@/test/fixtures";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe("retention rules", () => {
  it("keeps 12 months", () => {
    expect(retentionCutoff(new Date("2027-11-10T00:00:00Z")).toISOString()).toBe("2026-11-10T00:00:00.000Z");
  });

  it("checks the cron secret", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorizedCron("Bearer wrong", "s3cret")).toBe(false);
    expect(isAuthorizedCron(null, "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
  });
});

describe.skipIf(!hasTestDatabase)("retention job (database)", () => {
  const prisma = createTestPrisma();
  const removed: string[] = [];
  beforeEach(async () => {
    await resetDatabase(prisma);
    removed.length = 0;
    setPhotoStorage({ put: vi.fn(), get: vi.fn(), remove: async (path) => void removed.push(path) });
  });
  afterAll(async () => {
    setPhotoStorage(null);
    await prisma.$disconnect();
  });

  it("erases only tickets of events that ended over 12 months ago, keeps stats, and is idempotent", async () => {
    const leadUser = await createStaff(prisma, "LEAD_TECHNICIAN");
    const lead = { kind: "staff" as const, ...leadUser };
    const oldTicket = await createSubmittedTicket(prisma);
    await performTicketAction(prisma, oldTicket.id, lead, { action: { type: "CHECK_IN" }, checkIn: { idChecked: true } });
    await performTicketAction(prisma, oldTicket.id, lead, { action: { type: "ASSIGN", technicianId: leadUser.id } });
    await performTicketAction(prisma, oldTicket.id, lead, { action: { type: "START" } });
    await performTicketAction(prisma, oldTicket.id, lead, { action: { type: "MARK_READY", record: READY_RECORD } });
    await performTicketAction(prisma, oldTicket.id, lead, { action: { type: "PICKUP" }, pickup: { collectedByName: "Amina Hassan", collectedByPhone: "+252611234567" } });
    await prisma.repairTicket.update({ where: { id: oldTicket.id }, data: { rating: 5, ratingComment: "Thanks Ahmed!" } });
    await prisma.requester.updateMany({ data: { faculty: "Computing" } });
    await prisma.ticketPhoto.create({ data: { ticketId: oldTicket.id, kind: "REQUESTER", storagePath: "old/photo.jpg", mimeType: "image/jpeg", sizeBytes: 10 } });

    // The old event ended 13 months before "now"; a new event is running.
    const now = new Date();
    const thirteenMonthsAgo = new Date(now);
    thirteenMonthsAgo.setUTCMonth(thirteenMonthsAgo.getUTCMonth() - 13);
    await prisma.event.update({ where: { id: oldTicket.eventId }, data: { isActive: false, startsOn: thirteenMonthsAgo, endsOn: thirteenMonthsAgo, registrationOpensOn: thirteenMonthsAgo, registrationClosesOn: thirteenMonthsAgo } });
    const recent = await createSubmittedTicket(prisma);
    expect(recent.eventId).not.toBe(oldTicket.eventId);

    const first = await runRetention(prisma, now);
    expect(first).toMatchObject({ ticketsAnonymized: 1, requestersDeleted: 1, photosDeleted: 1 });
    expect(removed).toEqual(["old/photo.jpg"]);

    const erased = await prisma.repairTicket.findUniqueOrThrow({ where: { id: oldTicket.id }, include: { custody: true, events: true, photos: true } });
    expect(erased).toMatchObject({ requesterId: null, issueDescription: "", ratingComment: null, rating: 5, requesterFaculty: "Computing", status: "COLLECTED" });
    expect(erased.anonymizedAt).not.toBeNull();
    expect(erased.custody).toMatchObject({ collectedByName: null, collectedByPhone: null });
    expect(erased.photos).toEqual([]);
    expect(erased.events.every((e) => e.note === null && JSON.stringify(e.metadata) === "{}")).toBe(true);

    // The recent ticket keeps its requester.
    expect((await prisma.repairTicket.findUniqueOrThrow({ where: { id: recent.id } })).requesterId).not.toBeNull();

    // Reports still work from anonymised tickets.
    const report = (await getEventReport(prisma, oldTicket.eventId))!;
    expect(report.summary).toMatchObject({ registered: 1, fixed: 1, collected: 1, averageRating: 5 });
    expect(report.byFaculty).toEqual([{ label: "Computing", registered: 1, fixed: 1 }]);

    expect(await runRetention(prisma, now)).toMatchObject({ ticketsAnonymized: 0, requestersDeleted: 0, photosDeleted: 0 });
  });
});
