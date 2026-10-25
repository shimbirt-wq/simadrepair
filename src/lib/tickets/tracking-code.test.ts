import { describe, expect, it } from "vitest";
import { generateTrackingCode, normalizeTrackingCode, TRACKING_ALPHABET } from "@/lib/tickets/tracking-code";

describe("tracking codes", () => {
  it("uses the year and six characters from the unambiguous alphabet", () => {
    const code = generateTrackingCode(new Date("2026-11-02T10:00:00Z"));
    expect(code).toMatch(/^SIM-26-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    expect(TRACKING_ALPHABET).not.toMatch(/[01OIL]/);
  });

  it("is not sequential", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateTrackingCode()));
    expect(codes.size).toBe(200);
  });

  it.each([
    ["SIM-26-K7P3QX", "SIM-26-K7P3QX"],
    ["sim-26-k7p3qx", "SIM-26-K7P3QX"],
    ["SIM26K7P3QX", "SIM-26-K7P3QX"],
    [" sim 26 k7p3qx ", "SIM-26-K7P3QX"],
    ["SIM-2026-000123", "SIM-2026-000123"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeTrackingCode(input)).toBe(expected);
  });

  it.each(["SIM-26-K7P3Q", "SIM-26-K0P3QX", "ABC-26-K7P3QX", "", "SIM-2026-12"])("rejects %s", (input) => {
    expect(normalizeTrackingCode(input)).toBeNull();
  });
});
