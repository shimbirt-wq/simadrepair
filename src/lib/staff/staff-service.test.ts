import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { verifyPassword } from "@/lib/auth/password";
import { hasAccess } from "@/lib/auth/public-user";
import { bulkAddTechnicians, updateStaff } from "@/lib/staff/staff-service";
import { createActiveEvent, createStaff, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe("volunteer access", () => {
  const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

  it("lasts through the last event day in Mogadishu time", () => {
    const user = { isActive: true, accessExpiresOn: day("2026-11-05") };
    expect(hasAccess(user, new Date("2026-11-05T20:59:00Z"))).toBe(true); // 23:59 local
    expect(hasAccess(user, new Date("2026-11-05T21:00:00Z"))).toBe(false); // 00:00 next day
  });

  it("never applies to inactive accounts, and has no end without a date", () => {
    expect(hasAccess({ isActive: false, accessExpiresOn: null })).toBe(false);
    expect(hasAccess({ isActive: true, accessExpiresOn: null })).toBe(true);
  });
});

describe.skipIf(!hasTestDatabase)("staff service (database)", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("bulk-adds volunteers that expire with the active event and returns passwords once", async () => {
    const event = await createActiveEvent(prisma);
    const results = await bulkAddTechnicians(prisma, "Ahmed Nur, ahmed@test.so, 061 234 5678\n\nnot a line\nHodan Ali;hodan@test.so", ["HARDWARE"]);

    expect(results.filter((row) => row.ok)).toHaveLength(2);
    expect(results.find((row) => !row.ok)).toMatchObject({ line: 3, ok: false });

    const ahmed = await prisma.user.findUniqueOrThrow({ where: { email: "ahmed@test.so" } });
    expect(ahmed).toMatchObject({ role: "TECHNICIAN", phone: "+252612345678", skills: ["HARDWARE"], accessExpiresOn: event.endsOn });
    const created = results.find((row) => row.ok && row.email === "ahmed@test.so");
    expect(created?.ok && (await verifyPassword(created.password, ahmed.passwordHash))).toBe(true);
  });

  it("reports duplicate emails per line", async () => {
    await createActiveEvent(prisma);
    await bulkAddTechnicians(prisma, "Ahmed Nur, ahmed@test.so");
    expect(await bulkAddTechnicians(prisma, "Ahmed Again, ahmed@test.so")).toEqual([expect.objectContaining({ ok: false, error: "This email already has an account." })]);
  });

  it("renews an expired volunteer for the active event", async () => {
    const event = await createActiveEvent(prisma);
    const admin = await createStaff(prisma, "ADMIN");
    const tech = await prisma.user.create({ data: { fullName: "Old Volunteer", email: "old@test.so", passwordHash: "x", role: "TECHNICIAN", accessExpiresOn: new Date("2025-11-05T00:00:00Z") } });
    expect(hasAccess(tech)).toBe(false);

    const result = await updateStaff(prisma, admin.id, tech.id, { renew: true });
    expect(result.ok && result.user.accessExpiresOn?.getTime()).toBe(event.endsOn.getTime());
    expect(result.ok && hasAccess(result.user)).toBe(true);
  });

  it("keeps at least one active admin and stops admins demoting themselves", async () => {
    const admin = await createStaff(prisma, "ADMIN");
    expect(await updateStaff(prisma, admin.id, admin.id, { role: "TECHNICIAN" })).toMatchObject({ ok: false, status: 409 });
    const other = await createStaff(prisma, "ADMIN");
    expect(await updateStaff(prisma, other.id, admin.id, { isActive: false })).toMatchObject({ ok: true });
    expect(await updateStaff(prisma, admin.id, other.id, { isActive: false })).toMatchObject({ ok: false, status: 409 });
  });
});
