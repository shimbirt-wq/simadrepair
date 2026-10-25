import { describe, expect, it } from "vitest";
import { normalizeSomaliPhone, whatsappDisplay, whatsappLink } from "@/lib/phone";

describe("Somali phone numbers", () => {
  it.each(["0612345678", "612345678", "61 234 5678", "061-234-5678", "+252612345678", "252 61 234 5678", "00252612345678"])("normalises %s", (input) => {
    expect(normalizeSomaliPhone(input)).toBe("+252612345678");
  });

  it.each(["12345", "+254712345678", "0512345678", "06123456789", ""])("rejects %s", (input) => {
    expect(normalizeSomaliPhone(input)).toBeNull();
  });

  it("formats for display and links", () => {
    expect(whatsappDisplay("+252612345678")).toBe("+252 61 234 5678");
    expect(whatsappLink("+252 61 234 5678", "Hi")).toBe("https://wa.me/252612345678?text=Hi");
  });
});
