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
      UPLOAD_BUCKET: "repair-ticket-photos",
      SUPABASE_URL: "https://supabase.example.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-value",
    });

    expect(status).toEqual({
      ok: true,
      environment: "production",
    });
  });

  it("requires Supabase storage settings in production", () => {
    const status = getEnvironmentStatus({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://example.com/database",
      DIRECT_URL: "postgresql://example.com/direct",
      JWT_SECRET: "a-valid-secret-value-that-is-long-enough",
      NEXT_PUBLIC_APP_URL: "https://example.com",
    });

    expect(status.ok).toBe(false);
    if (!status.ok) {
      expect(status.issues.SUPABASE_URL).toBeDefined();
      expect(status.issues.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    }
  });
});
