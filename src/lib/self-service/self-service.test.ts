import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { cancelMyRequest, findMyRequests, rateMyRequest } from "@/lib/self-service/self-service";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { READY_RECORD } from "@/test/fixtures";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("requester self-service (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  const universityIdOf = async (requesterId: string | null) => (await prisma.requester.findUniqueOrThrow({ where: { id: requesterId! } })).universityId;

  it("finds open requests only with the right university ID and phone digits", async () => {
    const ticket = await createSubmittedTicket(prisma, "SIM-26-FNDMEZ");
    const universityId = await universityIdOf(ticket.requesterId);
    expect(await findMyRequests(prisma, { universityId: universityId.toLowerCase(), phoneLast4: "4567" })).toEqual([expect.objectContaining({ trackingCode: "SIM-26-FNDMEZ", status: "SUBMITTED" })]);
    expect(await findMyRequests(prisma, { universityId, phoneLast4: "0000" })).toEqual([]);
    expect(await findMyRequests(prisma, { universityId: "ZZ999999", phoneLast4: "4567" })).toEqual([]);
  });

  it("cancels only before drop-off and only with the matching ID", async () => {
    const ticket = await createSubmittedTicket(prisma, "SIM-26-CNCXYZ");
    const universityId = await universityIdOf(ticket.requesterId);
    expect(await cancelMyRequest(prisma, "SIM-26-CNCXYZ", "XX123456")).toMatchObject({ ok: false, status: 403 });
    expect(await cancelMyRequest(prisma, "sim26cncxyz", universityId)).toMatchObject({ ok: true, status: "CANCELLED" });

    const lead = await createStaff(prisma, "LEAD_TECHNICIAN");
    const received = await createSubmittedTicket(prisma, "SIM-26-RCVDXX");
    await performTicketAction(prisma, received.id, { kind: "staff", ...lead }, { action: { type: "CHECK_IN" } });
    expect(await cancelMyRequest(prisma, "SIM-26-RCVDXX", await universityIdOf(received.requesterId))).toMatchObject({ ok: false, status: 409 });
  });

  it("accepts one rating, only after collection", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const ticket = await createSubmittedTicket(prisma, "SIM-26-RATEME");
    expect(await rateMyRequest(prisma, "SIM-26-RATEME", { rating: 5, comment: null })).toMatchObject({ ok: false, status: 409 });

    await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } });
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "ASSIGN", technicianId: lead.id } });
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "START" } });
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "MARK_READY", record: READY_RECORD } });
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "PICKUP" }, pickup: { collectedByName: "Amina Hassan" } });

    expect(await rateMyRequest(prisma, "SIM-26-RATEME", { rating: 4, comment: "Fast and friendly" })).toEqual({ ok: true });
    expect(await rateMyRequest(prisma, "SIM-26-RATEME", { rating: 1, comment: null })).toMatchObject({ ok: false, status: 409 });
    expect(await prisma.repairTicket.findUniqueOrThrow({ where: { id: ticket.id } })).toMatchObject({ rating: 4, ratingComment: "Fast and friendly" });
  });
});
