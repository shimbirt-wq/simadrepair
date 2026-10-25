import { PrismaClient } from "@prisma/client";

/**
 * Integration tests run against a real PostgreSQL database named by
 * TEST_DATABASE_URL (migrated with `npm run test:db:prepare`). Without it the
 * suites are skipped, so `npm test` still works on machines with no database.
 */
export const testDatabaseUrl = process.env.TEST_DATABASE_URL;
export const hasTestDatabase = Boolean(testDatabaseUrl);

export function createTestPrisma() {
  return new PrismaClient({ datasourceUrl: testDatabaseUrl });
}

const TABLES = ["ticket_photos", "events", "repair_events", "device_custody", "repair_tickets", "devices", "requesters", "users", "rate_limit_buckets"];

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

let sequence = 0;

export async function createStaff(prisma: PrismaClient, role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN", name: string = role) {
  sequence += 1;
  return prisma.user.create({
    data: { fullName: name, email: `${role.toLowerCase()}-${sequence}@test.local`, passwordHash: "x", role },
    select: { id: true, role: true },
  });
}

export async function createActiveEvent(prisma: PrismaClient, overrides: Partial<{ registrationOpensOn: Date; registrationClosesOn: Date }> = {}) {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
  const day = 24 * 60 * 60 * 1000;
  return prisma.event.create({
    data: {
      name: "Maintenance Week (test)",
      startsOn: new Date(today.getTime() - day),
      endsOn: new Date(today.getTime() + 3 * day),
      registrationOpensOn: overrides.registrationOpensOn ?? new Date(today.getTime() - 7 * day),
      registrationClosesOn: overrides.registrationClosesOn ?? new Date(today.getTime() + 2 * day),
      venue: "Main Hall, Block B",
      hours: "8:00–16:00",
      deskWhatsapp: "+252611000000",
      isActive: true,
    },
  });
}

async function ensureEvent(prisma: PrismaClient) {
  return (await prisma.event.findFirst({ where: { isActive: true } })) ?? createActiveEvent(prisma);
}

export async function createSubmittedTicket(prisma: PrismaClient, code = `SIM-TEST-${++sequence}`) {
  const event = await ensureEvent(prisma);
  const requester = await prisma.requester.create({
    data: { requesterType: "STUDENT", fullName: "Amina Hassan", universityId: `CS${100000 + ++sequence}`, phone: "+252611234567" },
  });
  const device = await prisma.device.create({ data: { requesterId: requester.id, deviceType: "Laptop", brand: "HP", model: "ProBook 450" } });
  return prisma.repairTicket.create({
    data: { eventId: event.id, ticketId: code, trackingCode: code, deviceId: device.id, requesterId: requester.id, issueDescription: "Laptop will not boot." },
  });
}
