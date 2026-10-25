import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPublicTrackingInfo, isPublicRepairEvent, PublicTrackingValidationError, toPublicStatus } from "@/lib/service-desk/public-tracking";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe("public tracking rules", () => {
  it("shows requesters progress events and hides internal ones", () => {
    expect(isPublicRepairEvent({ eventType: "TICKET_CREATED" })).toBe(true);
    expect(isPublicRepairEvent({ eventType: "CHECKED_IN" })).toBe(true);
    expect(isPublicRepairEvent({ eventType: "CANNOT_REPAIR_PROPOSED" })).toBe(false);
    expect(isPublicRepairEvent({ eventType: "NOTE_ADDED" })).toBe(false);
    expect(isPublicRepairEvent({ eventType: "TECHNICIAN_REASSIGNED" })).toBe(false);
  });

  it("shows an unconfirmed cannot-repair proposal as in repair", () => {
    expect(toPublicStatus("CANNOT_REPAIR_PROPOSED")).toBe("IN_REPAIR");
    expect(toPublicStatus("READY_FOR_PICKUP")).toBe("READY_FOR_PICKUP");
  });

  it("rejects text that is not a tracking code", async () => {
    await expect(getPublicTrackingInfo("not-a-code")).rejects.toBeInstanceOf(PublicTrackingValidationError);
  });
});

describe.skipIf(!hasTestDatabase)("public tracking (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("never exposes the requester's full name, university ID or phone, nor storage details", async () => {
    const lead = await createStaff(prisma, "LEAD_TECHNICIAN");
    const ticket = await createSubmittedTicket(prisma, "SIM-26-ABCDEF");
    await performTicketAction(prisma, ticket.id, { kind: "staff", ...lead }, { action: { type: "CHECK_IN" }, checkIn: { storageLocation: "Shelf B3", condition: "Cracked hinge" } });

    const info = await getPublicTrackingInfo("sim26abcdef", prisma);
    const json = JSON.stringify(info);
    expect(info?.requesterFirstName).toBe("Amina");
    expect(json).not.toContain("Hassan");
    expect(json).not.toContain("CS1");
    expect(json).not.toContain("+252611234567");
    expect(json).not.toContain("Shelf B3");
    expect(json).not.toContain("Cracked hinge");
  });

  it("shows the desk number before assignment and the technician's after", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const techUser = await prisma.user.create({ data: { fullName: "Ahmed Nur", email: "ahmed@test.local", passwordHash: "x", role: "TECHNICIAN", phone: "+252615550000" } });
    const ticket = await createSubmittedTicket(prisma, "SIM-26-BCDEFG");

    expect((await getPublicTrackingInfo(ticket.trackingCode!, prisma))?.contact).toMatchObject({ kind: "desk", whatsapp: "+252611000000" });

    await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } });
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "ASSIGN", technicianId: techUser.id } });
    expect((await getPublicTrackingInfo(ticket.trackingCode!, prisma))?.contact).toEqual({ kind: "technician", name: "Ahmed", whatsapp: "+252615550000" });
  });

  it("shows what the requester must do while blocked, and hides an unconfirmed cannot-repair proposal", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const tech = { kind: "staff" as const, ...(await createStaff(prisma, "TECHNICIAN")) };
    const ticket = await createSubmittedTicket(prisma, "SIM-26-CDEFGH");
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } });
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "ASSIGN", technicianId: tech.id } });
    await performTicketAction(prisma, ticket.id, tech, { action: { type: "START" } });
    await performTicketAction(prisma, ticket.id, tech, { action: { type: "BLOCK", kind: "WAITING_FOR_PARTS", detail: "HP 65W charger" } });

    expect(await getPublicTrackingInfo(ticket.trackingCode!, prisma)).toMatchObject({ status: "WAITING_FOR_PARTS", detail: "HP 65W charger" });

    await performTicketAction(prisma, ticket.id, tech, { action: { type: "PROPOSE_CANNOT_REPAIR", reason: "Motherboard is burnt" } });
    const proposed = await getPublicTrackingInfo(ticket.trackingCode!, prisma);
    expect(proposed?.status).toBe("IN_REPAIR");
    expect(JSON.stringify(proposed)).not.toContain("Motherboard");

    await performTicketAction(prisma, ticket.id, lead, { action: { type: "CONFIRM_CANNOT_REPAIR" } });
    expect(await getPublicTrackingInfo(ticket.trackingCode!, prisma)).toMatchObject({ status: "CANNOT_BE_REPAIRED", detail: "Motherboard is burnt" });
  });
});
