import { describe, expect, it } from "vitest";
import { createPublicRepairRequest, PublicRepairRequestValidationError } from "@/lib/service-desk/public-requests";

describe("createPublicRepairRequest", () => {
  it("rejects invalid MVP public repair requests before writing data", async () => {
    await expect(createPublicRepairRequest({})).rejects.toBeInstanceOf(PublicRepairRequestValidationError);
  });
});

