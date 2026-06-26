import { describe, expect, it } from "vitest";
import { getDefaultPathForRole, getPostLoginRedirectPath, getSafeNextPath } from "@/app/auth/login/redirects";

describe("login redirects", () => {
  it("routes each staff role to the correct default workspace", () => {
    expect(getDefaultPathForRole("ADMIN")).toBe("/dashboard");
    expect(getDefaultPathForRole("LEAD_TECHNICIAN")).toBe("/lead");
    expect(getDefaultPathForRole("TECHNICIAN")).toBe("/technician/workspace");
  });

  it("falls back to dashboard for missing or unknown roles", () => {
    expect(getDefaultPathForRole()).toBe("/dashboard");
    expect(getDefaultPathForRole("UNKNOWN_ROLE")).toBe("/dashboard");
  });

  it("honors a safe internal next path after login", () => {
    expect(getPostLoginRedirectPath("/repair-tickets", "TECHNICIAN")).toBe("/repair-tickets");
    expect(getPostLoginRedirectPath("/admin/service-desk/reports", "LEAD_TECHNICIAN")).toBe("/admin/service-desk/reports");
  });

  it("rejects external or protocol-relative next paths", () => {
    expect(getSafeNextPath("https://example.com/profile")).toBeNull();
    expect(getSafeNextPath("//example.com/profile")).toBeNull();
    expect(getSafeNextPath("profile")).toBeNull();
    expect(getSafeNextPath("")).toBeNull();
  });

  it("uses role default when next path is not safe", () => {
    expect(getPostLoginRedirectPath(getSafeNextPath("https://example.com/profile"), "LEAD_TECHNICIAN")).toBe("/lead");
  });
});
