import { describe, expect, it } from "vitest";
import { loginSchema } from "./auth";

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

