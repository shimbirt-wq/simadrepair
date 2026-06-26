import { describe, expect, it } from "vitest";
import {
  custodyCheckInInputSchema,
  custodyStatusTransitionInputSchema,
  pickupConfirmationInputSchema,
  publicRepairRequestInputSchema,
  technicianStatusUpdateInputSchema,
} from "@/lib/service-desk/validations";

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

describe("custodyCheckInInputSchema", () => {
  it("requires a storage location", () => {
    const result = custodyCheckInInputSchema.safeParse({ condition: "Good" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain("storageLocation");
    }
  });

  it("accepts minimal check-in details", () => {
    expect(custodyCheckInInputSchema.safeParse({ condition: "Good", storageLocation: "IT desk" }).success).toBe(true);
  });
});

describe("custodyStatusTransitionInputSchema", () => {
  it("accepts a valid custody transition target", () => {
    expect(custodyStatusTransitionInputSchema.safeParse({ status: "IN_REPAIR_ROOM", note: "Moved to repair shelf." }).success).toBe(true);
  });

  it("rejects invalid custody statuses", () => {
    expect(custodyStatusTransitionInputSchema.safeParse({ status: "READY_FOR_PICKUP" }).success).toBe(false);
  });
});

describe("pickupConfirmationInputSchema", () => {
  it("requires collectedByName", () => {
    const result = pickupConfirmationInputSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain("collectedByName");
    }
  });

  it("accepts a valid pickup confirmation", () => {
    expect(pickupConfirmationInputSchema.safeParse({ collectedByName: "Asha Mohamed", collectedByPhone: "+252610000111" }).success).toBe(true);
  });
});

describe("technicianStatusUpdateInputSchema", () => {
  it("accepts the two technician MVP actions", () => {
    expect(technicianStatusUpdateInputSchema.safeParse({ status: "REPAIR_IN_PROGRESS" }).success).toBe(true);
    expect(technicianStatusUpdateInputSchema.safeParse({ status: "READY_FOR_COLLECTION" }).success).toBe(true);
  });

  it("rejects removed workflow statuses", () => {
    expect(technicianStatusUpdateInputSchema.safeParse({ status: "DEVICE_RECEIVED" }).success).toBe(false);
  });
});

