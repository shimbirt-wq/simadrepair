import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 19 })),
  getRequestIp: () => "127.0.0.1",
}));

describe("public repair request route", () => {
  it("returns field errors for an invalid submission without login", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/public/repair-requests", { method: "POST", body: JSON.stringify({ requester: { universityId: "123" } }) }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.details.issues["requester.universityId"]).toBeDefined();
  });
});
