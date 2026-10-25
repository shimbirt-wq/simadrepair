import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { toPublicUser, publicUserSelect } from "@/lib/auth/public-user";
import { sendTicketMessage } from "@/lib/messaging/message-service";
import { performTicketAction } from "@/lib/tickets/ticket-service";
import { createStaff, createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe.skipIf(!hasTestDatabase)("message service (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());
  const publicUser = async (id: string) => toPublicUser(await prisma.user.findUniqueOrThrow({ where: { id }, select: publicUserSelect }));

  it("gives a WhatsApp link to the requester's number and logs the send", async () => {
    const lead = await createStaff(prisma, "LEAD_TECHNICIAN");
    const ticket = await createSubmittedTicket(prisma);
    const result = await sendTicketMessage(prisma, await publicUser(lead.id), ticket.id, "REGISTERED");

    expect(result.ok && result.openUrl).toMatch(/^https:\/\/wa\.me\/252611234567\?text=Salaan/);
    const event = await prisma.repairEvent.findFirstOrThrow({ where: { ticketId: ticket.id, eventType: "MESSAGE_SENT" } });
    expect(event).toMatchObject({ actorId: lead.id, metadata: { template: "REGISTERED", channel: "whatsapp_link" } });
  });

  it("uses the latest blocked detail and lets only the assigned technician or desk send", async () => {
    const lead = { kind: "staff" as const, ...(await createStaff(prisma, "LEAD_TECHNICIAN")) };
    const tech = await createStaff(prisma, "TECHNICIAN");
    const other = await createStaff(prisma, "TECHNICIAN");
    const ticket = await createSubmittedTicket(prisma);
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "CHECK_IN" } });
    await performTicketAction(prisma, ticket.id, lead, { action: { type: "ASSIGN", technicianId: tech.id } });
    await performTicketAction(prisma, ticket.id, { kind: "staff", ...tech }, { action: { type: "START" } });
    await performTicketAction(prisma, ticket.id, { kind: "staff", ...tech }, { action: { type: "BLOCK", kind: "WAITING_FOR_PARTS", detail: "Dell 65W charger" } });

    const sent = await sendTicketMessage(prisma, await publicUser(tech.id), ticket.id, "WAITING_FOR_PARTS");
    expect(sent.ok && sent.text).toContain("Dell 65W charger");
    expect(await sendTicketMessage(prisma, await publicUser(other.id), ticket.id, "WAITING_FOR_PARTS")).toMatchObject({ ok: false, status: 403 });
    expect(await sendTicketMessage(prisma, await publicUser(tech.id), ticket.id, "REGISTERED")).toMatchObject({ ok: false, status: 403 });
  });
});
