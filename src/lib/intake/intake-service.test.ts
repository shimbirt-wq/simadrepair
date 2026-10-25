import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { intakeSchema, type IntakeInput } from "@/lib/intake/intake-schema";
import { createRepairRequest, DAILY_LIMIT } from "@/lib/intake/intake-service";
import { createActiveEvent, createStaff, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

const form = (overrides: { requester?: object; device?: object; problem?: object } & Record<string, unknown> = {}) =>
  ({
    requester: { requesterType: "STUDENT", fullName: "Amina Hassan", universityId: "cs 383833", phone: "061 234 5678", ...overrides.requester },
    device: { deviceType: "LAPTOP", brand: "HP", model: "ProBook 450 G8", operatingSystem: "WINDOWS_10", ram: "8", storageType: "HDD", ageBand: "3_5", accessories: ["CHARGER"], ...overrides.device },
    problem: { categories: ["SLOW_VIRUS"], answers: { SLOW_VIRUS: { popups: "YES" } }, startedWhen: "THIS_WEEK", recentEvents: [], description: "Very slow and shows pop-ups.", ...overrides.problem },
    wipeAllowed: true,
    needsPassword: true,
    consent: true,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => !["requester", "device", "problem"].includes(key))),
  }) as unknown;

const parse = (value: unknown) => intakeSchema.parse(value);

describe("intake form validation", () => {
  it("normalises the university ID and phone", () => {
    expect(parse(form()).requester).toMatchObject({ universityId: "CS383833", phone: "+252612345678" });
  });

  it.each([
    ["requester.universityId", form({ requester: { universityId: "383833" } })],
    ["requester.phone", form({ requester: { phone: "12345" } })],
    ["device.brandOther", form({ device: { brand: "OTHER" } })],
    ["device.operatingSystem", form({ device: { operatingSystem: "" } })],
    ["problem.description", form({ problem: { description: "slow" } })],
    ["problem.categories", form({ problem: { categories: [] } })],
    ["problem.startedWhen", form({ problem: { startedWhen: "" } })],
    ["consent", form({ consent: false })],
  ])("reports %s", (path, value) => {
    const result = intakeSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(path);
  });
});

describe.skipIf(!hasTestDatabase)("intake service (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("creates a submitted ticket in the active event with the requester's details", async () => {
    const event = await createActiveEvent(prisma);
    const result = await createRepairRequest(prisma, parse(form()));
    expect(result).toMatchObject({ ok: true, firstName: "Amina" });
    if (!result.ok) return;

    const ticket = await prisma.repairTicket.findUniqueOrThrow({ where: { id: result.ticketId }, include: { requester: true, device: true, custody: true, events: true } });
    expect(ticket).toMatchObject({ eventId: event.id, status: "SUBMITTED", wipeAllowed: true, needsPassword: true, accessoriesLeft: ["CHARGER"] });
    expect(ticket.trackingCode).toMatch(/^SIM-\d{2}-[A-Z2-9]{6}$/);
    expect(ticket.requester).toMatchObject({ universityId: "CS383833", phone: "+252612345678" });
    expect(ticket.device).toMatchObject({ deviceType: "Laptop", brand: "HP", operatingSystem: "WINDOWS_10", ram: "8" });
    expect(ticket.custody).not.toBeNull();
    expect(ticket.events.map((e) => e.eventType)).toEqual(["TICKET_CREATED"]);
    expect(ticket).toMatchObject({ problemCategories: ["SLOW_VIRUS"], problemAnswers: { SLOW_VIRUS: { popups: "YES" } }, startedWhen: "THIS_WEEK" });
  });

  it("matches returning requesters by university ID and updates their contact details", async () => {
    await createActiveEvent(prisma);
    await createRepairRequest(prisma, parse(form()));
    await createRepairRequest(prisma, parse(form({ requester: { phone: "0619998877", fullName: "Amina H. Hassan" }, device: { deviceType: "DESKTOP" } })));
    const requesters = await prisma.requester.findMany();
    expect(requesters).toHaveLength(1);
    expect(requesters[0]).toMatchObject({ phone: "+252619998877", fullName: "Amina H. Hassan" });
  });

  it("blocks a second open request for the same device and returns the existing code", async () => {
    await createActiveEvent(prisma);
    const first = await createRepairRequest(prisma, parse(form()));
    const second = await createRepairRequest(prisma, parse(form()));
    expect(second).toEqual({ ok: false, reason: "DUPLICATE", trackingCode: first.ok ? first.trackingCode : "" });
  });

  it(`allows at most ${DAILY_LIMIT} public requests per university ID per day`, async () => {
    await createActiveEvent(prisma);
    for (const deviceType of ["LAPTOP", "DESKTOP", "TABLET"]) {
      expect((await createRepairRequest(prisma, parse(form({ device: { deviceType } })))).ok).toBe(true);
    }
    expect(await createRepairRequest(prisma, parse(form({ device: { deviceType: "ALL_IN_ONE" } })))).toEqual({ ok: false, reason: "DAILY_LIMIT" });
  });

  it("refuses public requests outside the window but lets the desk register during the event", async () => {
    const day = 24 * 60 * 60 * 1000;
    await createActiveEvent(prisma, { registrationOpensOn: new Date(Date.now() - 10 * day), registrationClosesOn: new Date(Date.now() - 2 * day) });
    expect(await createRepairRequest(prisma, parse(form()))).toMatchObject({ ok: false, reason: "REGISTRATION_CLOSED", state: "CLOSED" });

    const lead = await createStaff(prisma, "LEAD_TECHNICIAN");
    expect(await createRepairRequest(prisma, parse(form()), { kind: "desk", actorId: lead.id, actorRole: "LEAD_TECHNICIAN" })).toMatchObject({ ok: true });
  });

  it("rejects the honeypot", async () => {
    await createActiveEvent(prisma);
    expect(await createRepairRequest(prisma, { ...parse(form()), website: "spam" } as IntakeInput)).toEqual({ ok: false, reason: "SPAM" });
  });
});
