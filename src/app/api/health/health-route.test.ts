import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("health route", () => {
  it("returns a stable readiness shape without caching", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://example.com/database");
    vi.stubEnv("DIRECT_URL", "postgresql://example.com/direct");
    vi.stubEnv("JWT_SECRET", "a-valid-secret-value-that-is-long-enough");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual(
      expect.objectContaining({
        status: "ok",
        service: "simadrepair",
        stack: "nextjs-prisma-supabase",
        environment: expect.objectContaining({
          ok: true,
          environment: "test",
        }),
      }),
    );
    expect(typeof body.timestamp).toBe("string");
    vi.unstubAllEnvs();
  });
});

