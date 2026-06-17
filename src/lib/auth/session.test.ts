import { describe, expect, it, vi } from "vitest";
import {
  createClearedSessionCookie,
  createSessionCookie,
  readSessionTokenFromRequest,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
} from "./session";

describe("session helpers", () => {
  it("signs and verifies minimal session tokens", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");

    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    const session = await verifySessionToken(token);

    expect(session).toEqual({ id: "user_123", role: "STUDENT" });
    vi.unstubAllEnvs();
  });

  it("returns null for invalid tokens", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");

    await expect(verifySessionToken("invalid-token")).resolves.toBeNull();
    vi.unstubAllEnvs();
  });

  it("creates an http-only session cookie", () => {
    const cookie = createSessionCookie("token-value");

    expect(cookie.name).toBe(SESSION_COOKIE_NAME);
    expect(cookie.value).toBe("token-value");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("lax");
    expect(cookie.path).toBe("/");
  });

  it("uses secure cookies in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(createSessionCookie("token-value").secure).toBe(true);
    expect(createClearedSessionCookie().secure).toBe(true);
    vi.unstubAllEnvs();
  });

  it("creates a cleared session cookie", () => {
    const cookie = createClearedSessionCookie();

    expect(cookie.name).toBe(SESSION_COOKIE_NAME);
    expect(cookie.value).toBe("");
    expect(cookie.maxAge).toBe(0);
  });

  it("reads the session token from request cookies", () => {
    const request = new Request("http://localhost/api/auth/me", {
      headers: {
        cookie: `other=value; ${SESSION_COOKIE_NAME}=token-value`,
      },
    });

    expect(readSessionTokenFromRequest(request)).toBe("token-value");
  });
});
