import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  BOOTSTRAP_ADMIN_DEFAULT_PASSWORD,
  BOOTSTRAP_ADMIN_EMAIL,
  BOOTSTRAP_ADMIN_ID,
  BOOTSTRAP_ADMIN_PASSWORD_ENV,
  LEGACY_LOCAL_SEED_EMAILS,
  buildBootstrapAdminSeed,
  getBootstrapAdminPassword,
  hashBootstrapAdminPassword,
} from "./seed-helpers";

describe("getBootstrapAdminPassword", () => {
  it("uses the requested local default password when no seed password is configured", () => {
    expect(getBootstrapAdminPassword({})).toBe(BOOTSTRAP_ADMIN_DEFAULT_PASSWORD);
  });

  it("uses SEED_ADMIN_PASSWORD when it is configured", () => {
    expect(getBootstrapAdminPassword({ [BOOTSTRAP_ADMIN_PASSWORD_ENV]: "StrongerPass123!" })).toBe(
      "StrongerPass123!",
    );
  });

  it("rejects short configured seed passwords", () => {
    expect(() => getBootstrapAdminPassword({ [BOOTSTRAP_ADMIN_PASSWORD_ENV]: "short" })).toThrow(
      BOOTSTRAP_ADMIN_PASSWORD_ENV,
    );
  });
});

describe("hashBootstrapAdminPassword", () => {
  it("hashes the bootstrap password without storing the plain value", async () => {
    const hash = await hashBootstrapAdminPassword(BOOTSTRAP_ADMIN_DEFAULT_PASSWORD);

    expect(hash).not.toBe(BOOTSTRAP_ADMIN_DEFAULT_PASSWORD);
    expect(hash.startsWith("$2")).toBe(true);
    await expect(bcrypt.compare(BOOTSTRAP_ADMIN_DEFAULT_PASSWORD, hash)).resolves.toBe(true);
  });
});

describe("buildBootstrapAdminSeed", () => {
  it("builds only the bootstrap admin account", () => {
    const admin = buildBootstrapAdminSeed("hashed-password");

    expect(admin).toMatchObject({
      id: BOOTSTRAP_ADMIN_ID,
      email: BOOTSTRAP_ADMIN_EMAIL,
      fullName: "Abdulsalam Shiikhow",
      passwordHash: "hashed-password",
      role: "ADMIN",
      isActive: true,
    });
  });

  it("does not include the removed demo login accounts", () => {
    const admin = buildBootstrapAdminSeed("hashed-password");

    for (const legacyEmail of LEGACY_LOCAL_SEED_EMAILS) {
      expect(admin.email).not.toBe(legacyEmail);
    }
  });

  it("does not include real production-looking secrets", () => {
    const admin = buildBootstrapAdminSeed("hashed-password");
    const serializedData = JSON.stringify(admin);

    expect(serializedData).not.toContain("supabase.co");
    expect(serializedData).not.toContain("DATABASE_URL");
    expect(Object.values(admin)).not.toContain(BOOTSTRAP_ADMIN_DEFAULT_PASSWORD);
  });
});
