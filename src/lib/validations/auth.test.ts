import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

const validRegistration = {
  fullName: "Test Student",
  universityId: "SIMAD-AUTH-001",
  faculty: "Computing",
  department: "Computer Science",
  phone: "+252610001111",
  email: "STUDENT@EXAMPLE.INVALID",
  password: "StrongPassword123!",
  role: "STUDENT",
};

describe("registerSchema", () => {
  it("accepts valid student registration input and normalizes email", () => {
    const result = registerSchema.safeParse(validRegistration);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@example.invalid");
    }
  });

  it("defaults role to STUDENT", () => {
    const registrationWithoutRole: Omit<typeof validRegistration, "role"> = {
      fullName: validRegistration.fullName,
      universityId: validRegistration.universityId,
      faculty: validRegistration.faculty,
      department: validRegistration.department,
      phone: validRegistration.phone,
      email: validRegistration.email,
      password: validRegistration.password,
    };
    const result = registerSchema.safeParse(registrationWithoutRole);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("STUDENT");
    }
  });

  it("allows technician registration for the current MVP workflow", () => {
    const result = registerSchema.safeParse({ ...validRegistration, role: "TECHNICIAN" });

    expect(result.success).toBe(true);
  });

  it("rejects public admin registration", () => {
    const result = registerSchema.safeParse({ ...validRegistration, role: "ADMIN" });

    expect(result.success).toBe(false);
  });

  it("rejects missing required profile fields", () => {
    const result = registerSchema.safeParse({
      email: "student@example.invalid",
      password: "StrongPassword123!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects weak short passwords", () => {
    const result = registerSchema.safeParse({ ...validRegistration, password: "short" });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login input and normalizes email", () => {
    const result = loginSchema.safeParse({
      email: "STUDENT@EXAMPLE.INVALID",
      password: "StrongPassword123!",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@example.invalid");
    }
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "StrongPassword123!",
    });

    expect(result.success).toBe(false);
  });
});
