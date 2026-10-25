import { describe, expect, it } from "vitest";
import { publicRepairRequestInputSchema } from "@/lib/service-desk/validations";

const validPublicRepairRequest = {
  requester: {
    requesterType: "STUDENT",
    fullName: "Asha Mohamed",
    universityId: "SIMAD-2026-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610000111",
    email: "asha@example.invalid",
  },
  deviceType: "Laptop",
  brand: "HP",
  model: "EliteBook",
  issueDescription: "Laptop takes more than ten minutes to start and becomes slow during class work.",
};

describe("publicRepairRequestInputSchema", () => {
  it("accepts a valid MVP public request payload", () => {
    const result = publicRepairRequestInputSchema.safeParse(validPublicRepairRequest);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requester.email).toBe("asha@example.invalid");
      expect(result.data.issueDescription).toContain("Laptop");
    }
  });

  it("rejects missing phone, name, and issue description", () => {
    const result = publicRepairRequestInputSchema.safeParse({
      ...validPublicRepairRequest,
      requester: {
        ...validPublicRepairRequest.requester,
        fullName: "",
        phone: "",
      },
      issueDescription: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["requester.fullName", "requester.phone", "issueDescription"]));
    }
  });
});
