import { describe, expect, it } from "vitest";
import { getPrismaLogLevels } from "@/lib/db/prisma-logging";

describe("getPrismaLogLevels", () => {
  it("keeps Prisma query logs disabled by default", () => {
    expect(getPrismaLogLevels({})).toEqual(["error", "warn"]);
    expect(getPrismaLogLevels({ NODE_ENV: "development" })).toEqual(["error", "warn"]);
  });

  it("enables query logs only when explicitly requested", () => {
    expect(getPrismaLogLevels({ PRISMA_QUERY_LOG: "true" })).toEqual(["query", "error", "warn"]);
  });

  it("treats non-true values as disabled", () => {
    expect(getPrismaLogLevels({ PRISMA_QUERY_LOG: "false" })).toEqual(["error", "warn"]);
    expect(getPrismaLogLevels({ PRISMA_QUERY_LOG: "1" })).toEqual(["error", "warn"]);
  });
});

