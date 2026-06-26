import { describe, expect, it } from "vitest";

describe("public tracking route", () => {
  it("rejects malformed tracking codes without login", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/public/tracking/not-a-code"), {
      params: Promise.resolve({ trackingCode: "not-a-code" }),
    });

    expect(response.status).toBe(400);
  });
});
