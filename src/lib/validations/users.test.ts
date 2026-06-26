import { describe, expect, it } from "vitest";
import { createStaffAccountSchema } from "./users";

const validStaffAccount = {
  fullName: "Amina Admin",
  universityId: "SIMAD-ADMIN-002",
  faculty: "Computing",
  department: "IT Services",
  phone: "+252610001234",
  email: "amina.admin@example.invalid",
  password: "StrongPass123!",
  role: "ADMIN",
};

describe("createStaffAccountSchema", () => {
  it("allows admins to create admin, lead technician, and technician accounts", () => {
    for (const role of ["ADMIN", "LEAD_TECHNICIAN", "TECHNICIAN"]) {
      const result = createStaffAccountSchema.safeParse({
        ...validStaffAccount,
        email: `${role.toLowerCase()}@example.invalid`,
        role,
      });

      expect(result.success).toBe(true);
    }
  });

  it("rejects unsupported staff roles", () => {
    const result = createStaffAccountSchema.safeParse({
      ...validStaffAccount,
      role: "OWNER",
    });

    expect(result.success).toBe(false);
  });
});
