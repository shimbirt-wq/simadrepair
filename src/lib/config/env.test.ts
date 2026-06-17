import { describe, expect, it } from "vitest";
import { getEnvironmentStatus, validateEnvironment } from "./env";

describe("environment validation", () => {
  it("rejects missing required production values", () => {
    const result = validateEnvironment({
      NODE_ENV: "production",
    });

    expect(result.success).toBe(false);
  });

  it("accepts complete deployment configuration", () => {
    const status = getEnvironmentStatus({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://example.com/database",
      DIRECT_URL: "postgresql://example.com/direct",
      JWT_SECRET: "a-valid-secret-value-that-is-long-enough",
      NEXT_PUBLIC_APP_URL: "https://example.com",
      UPLOAD_MAX_SIZE_MB: "5",
    });

    expect(status).toEqual({
      ok: true,
      environment: "production",
    });
  });
});
