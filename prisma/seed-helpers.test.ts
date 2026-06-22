import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  buildLocalSeedData,
  hashLocalSeedPassword,
  LOCAL_SEED_EMAIL_DOMAIN,
  LOCAL_SEED_LOGIN_ACCOUNTS,
  LOCAL_SEED_PASSWORD,
} from "./seed-helpers";

describe("hashLocalSeedPassword", () => {
  it("hashes the local seed password without storing the plain value", async () => {
    const hash = await hashLocalSeedPassword();

    expect(hash).not.toBe(LOCAL_SEED_PASSWORD);
    expect(hash.startsWith("$2")).toBe(true);
    await expect(bcrypt.compare(LOCAL_SEED_PASSWORD, hash)).resolves.toBe(true);
  });
});

describe("buildLocalSeedData", () => {
  it("builds local-only seed users for each supported role", () => {
    const data = buildLocalSeedData("hashed-password");
    const roles = data.users.map((user) => user.role);

    expect(roles).toEqual(expect.arrayContaining(["ADMIN", "LEAD_TECHNICIAN", "TECHNICIAN"]));
    expect(data.users).toHaveLength(3);
  });

  it("uses non-routable example emails and test university ids", () => {
    const data = buildLocalSeedData("hashed-password");

    for (const user of data.users) {
      expect(user.email.endsWith(`@${LOCAL_SEED_EMAIL_DOMAIN}`)).toBe(true);
      expect(user.universityId.startsWith("SIMAD-TEST-")).toBe(true);
    }
  });

  it("exports login accounts only for active internal seed users", () => {
    const data = buildLocalSeedData("hashed-password");
    const seededEmails = data.users
      .filter((user) => user.isActive && ["ADMIN", "LEAD_TECHNICIAN", "TECHNICIAN"].includes(user.role))
      .map((user) => user.email)
      .sort();
    const loginEmails = LOCAL_SEED_LOGIN_ACCOUNTS.map((account) => account.email).sort();

    expect(loginEmails).toEqual(seededEmails);
  });

  it("links sample tickets to seeded devices and uses safe statuses", () => {
    const data = buildLocalSeedData("hashed-password");
    const deviceIds = new Set(data.devices.map((device) => device.id));
    const userIds = new Set(data.users.map((user) => user.id));

    for (const ticket of data.repairTickets) {
      expect(deviceIds.has(ticket.deviceId)).toBe(true);
      if (ticket.technicianId) {
        expect(userIds.has(ticket.technicianId)).toBe(true);
      }
      expect(ticket.ticketId.startsWith("TCK-LOCAL-")).toBe(true);
    }
  });

  it("does not include real production-looking secrets", () => {
    const serializedData = JSON.stringify(buildLocalSeedData("hashed-password"));

    expect(serializedData).not.toContain("supabase.co");
    expect(serializedData).not.toContain("DATABASE_URL");
    expect(serializedData).not.toContain(LOCAL_SEED_PASSWORD);
  });
});
