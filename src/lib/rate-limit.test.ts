import { describe, expect, it } from "vitest";
import { checkRateLimit, clearRateLimitBucketsForTests } from "./rate-limit";

describe("rate limit helper", () => {
  it("limits requests within a window and resets after expiry", () => {
    clearRateLimitBucketsForTests();

    expect(checkRateLimit("login:test", 2, 1000, 1000)).toEqual({ allowed: true, remaining: 1 });
    expect(checkRateLimit("login:test", 2, 1000, 1100)).toEqual({ allowed: true, remaining: 0 });
    expect(checkRateLimit("login:test", 2, 1000, 1200)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(checkRateLimit("login:test", 2, 1000, 2100)).toEqual({ allowed: true, remaining: 1 });
  });
});
