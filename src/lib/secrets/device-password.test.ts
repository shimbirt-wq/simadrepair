import { describe, expect, it } from "vitest";
import { decryptDevicePassword, encryptDevicePassword } from "@/lib/secrets/device-password";

describe("device password encryption", () => {
  it("round-trips and never stores the plain text", () => {
    const sealed = encryptDevicePassword("Hodan#2026");
    expect(sealed).not.toContain("Hodan");
    expect(decryptDevicePassword(sealed)).toBe("Hodan#2026");
  });

  it("uses a fresh IV each time", () => {
    expect(encryptDevicePassword("same")).not.toBe(encryptDevicePassword("same"));
  });

  it("detects tampering", () => {
    const sealed = encryptDevicePassword("secret");
    const [v, iv, tag, data] = sealed.split(".");
    const flipped = Buffer.from(data, "base64url");
    flipped[0] ^= 1;
    expect(() => decryptDevicePassword([v, iv, tag, flipped.toString("base64url")].join("."))).toThrow();
  });
});
