import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
  it("hashes passwords and verifies the original password", async () => {
    const password = "StrongPassword123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects incorrect passwords", async () => {
    const hash = await hashPassword("StrongPassword123!");

    await expect(verifyPassword("WrongPassword123!", hash)).resolves.toBe(false);
  });
});

