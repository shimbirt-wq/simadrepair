import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

describe("request IP", () => {
  it("prefers x-real-ip, then the first x-forwarded-for entry", () => {
    expect(getRequestIp(new Request("http://x", { headers: { "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" } }))).toBe("1.1.1.1");
    expect(getRequestIp(new Request("http://x", { headers: { "x-forwarded-for": "2.2.2.2, 3.3.3.3" } }))).toBe("2.2.2.2");
    expect(getRequestIp(new Request("http://x"))).toBe("unknown");
  });
});

describe.skipIf(!hasTestDatabase)("database rate limit", () => {
  const prisma = createTestPrisma();
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it("limits requests within a window and resets after expiry", async () => {
    const at = (ms: number) => new Date(1_800_000_000_000 + ms);
    expect(await checkRateLimit(prisma, "login:test", 2, 1000, at(0))).toEqual({ allowed: true, remaining: 1 });
    expect(await checkRateLimit(prisma, "login:test", 2, 1000, at(100))).toEqual({ allowed: true, remaining: 0 });
    expect(await checkRateLimit(prisma, "login:test", 2, 1000, at(200))).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(await checkRateLimit(prisma, "login:test", 2, 1000, at(1100))).toEqual({ allowed: true, remaining: 1 });
  });

  it("counts concurrent requests exactly", async () => {
    const now = new Date();
    const results = await Promise.all(Array.from({ length: 10 }, () => checkRateLimit(prisma, "burst", 5, 60_000, now)));
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
  });
});
