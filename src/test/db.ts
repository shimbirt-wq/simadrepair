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

const TABLES = ["repair_events", "device_custody", "repair_tickets", "devices", "requesters", "users", "tracking_code_counters"];

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

let sequence = 0;

export async function createStaff(prisma: PrismaClient, role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN", name = role) {
  sequence += 1;
  return prisma.user.create({
    data: { fullName: name, email: `${role.toLowerCase()}-${sequence}@test.local`, passwordHash: "x", role },
    select: { id: true, role: true },
  });
}

export async function createSubmittedTicket(prisma: PrismaClient, code = `SIM-TEST-${++sequence}`) {
  const requester = await prisma.requester.create({
    data: { requesterType: "STUDENT", fullName: "Amina Hassan", universityId: `CS${100000 + sequence}`, phone: "+252611234567" },
  });
  const device = await prisma.device.create({ data: { requesterId: requester.id, deviceType: "Laptop", brand: "HP", model: "ProBook 450" } });
  return prisma.repairTicket.create({
    data: { ticketId: code, trackingCode: code, deviceId: device.id, requesterId: requester.id, issueDescription: "Laptop will not boot." },
  });
}
