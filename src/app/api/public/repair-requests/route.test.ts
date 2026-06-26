import { describe, expect, it } from "vitest";

describe("public repair request route", () => {
  it("returns validation errors for invalid public submissions without login", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/public/repair-requests", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });
});

