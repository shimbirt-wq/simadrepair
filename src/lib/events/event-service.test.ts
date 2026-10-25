import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { activateEvent, createEvent, getRegistration } from "@/lib/events/event-service";
import { createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

const input = (name: string) => ({
  name,
  startsOn: "2026-11-10",
  endsOn: "2026-11-14",
  registrationOpensOn: "2026-11-01",
  registrationClosesOn: "2026-11-12",
  venue: "Main Hall, Block B",
  hours: "8:00–16:00",
  deskWhatsapp: "+252611000000",
  holdDays: 30,
});

describe.skipIf(!hasTestDatabase)("event service (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("keeps exactly one active event", async () => {
    const first = await createEvent(prisma, input("Week 2025"), { activate: true });
    const second = await createEvent(prisma, input("Week 2026"), { activate: true });
    expect(await prisma.event.count({ where: { isActive: true } })).toBe(1);
    expect((await prisma.event.findFirstOrThrow({ where: { isActive: true } })).id).toBe(second.id);

    await activateEvent(prisma, first.id);
    expect((await prisma.event.findFirstOrThrow({ where: { isActive: true } })).id).toBe(first.id);
  });

  it("reports the registration state of the active event", async () => {
    expect((await getRegistration(prisma)).state).toBe("NO_EVENT");
    await createEvent(prisma, input("Week 2026"), { activate: true });
    expect((await getRegistration(prisma, new Date("2026-11-05T09:00:00Z"))).state).toBe("OPEN");
    expect((await getRegistration(prisma, new Date("2026-11-13T09:00:00Z"))).state).toBe("CLOSED");
  });
});
