import { describe, expect, it } from "vitest";
import { getRoleDashboard } from "@/lib/dashboard/dashboard-service";

describe("getRoleDashboard", () => {
  it("exports the role dashboard builder for MVP dashboard pages", () => {
    expect(typeof getRoleDashboard).toBe("function");
  });
});

