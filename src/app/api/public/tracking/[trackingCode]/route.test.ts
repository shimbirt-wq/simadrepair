import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 19 })),
  getRequestIp: () => "127.0.0.1",
}));

describe("public tracking route", () => {
  it("rejects malformed tracking codes without login", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/public/tracking/not-a-code"), { params: Promise.resolve({ trackingCode: "not-a-code" }) });
    expect(response.status).toBe(400);
  });

  it("answers 429 when the caller is rate limited", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 30 });
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/public/tracking/SIM-26-K7P3QX"), { params: Promise.resolve({ trackingCode: "SIM-26-K7P3QX" }) });
    expect(response.status).toBe(429);
  });
});
