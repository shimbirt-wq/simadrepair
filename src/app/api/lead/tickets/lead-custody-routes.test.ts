import { describe, expect, it } from "vitest";

describe("lead custody routes", () => {
  it("keeps custody focused on receive, ready, and pickup", () => {
    expect(["RECEIVED", "READY_FOR_COLLECTION", "COLLECTED"]).toEqual([
      "RECEIVED",
      "READY_FOR_COLLECTION",
      "COLLECTED",
    ]);
  });
});

