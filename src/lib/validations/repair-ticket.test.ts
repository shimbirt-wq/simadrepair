import { describe, expect, it } from "vitest";
import {
  assignRepairTicketSchema,
  createRepairTicketSchema,
  updateRepairTicketStatusSchema,
} from "./repair-ticket";

describe("createRepairTicketSchema", () => {
  it("accepts valid ticket input without a photo", () => {
    const result = createRepairTicketSchema.safeParse({
      deviceId: "device_123",
      issueDescription: "Laptop battery drains too quickly.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid ticket input with a photo URL", () => {
    const result = createRepairTicketSchema.safeParse({
      deviceId: "device_123",
      issueDescription: "Laptop screen flickers after startup.",
      photoUrl: "https://example.com/uploads/device-photo.jpg",
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid ticket input with a controlled photo storage path", () => {
    const result = createRepairTicketSchema.safeParse({
      deviceId: "device_123",
      issueDescription: "Laptop screen flickers after startup.",
      photoUrl: "repair-ticket-photos/user_123/550e8400-e29b-41d4-a716-446655440000-device-photo.webp",
    });

    expect(result.success).toBe(true);
  });

  it("trims the issue description before validation", () => {
    const result = createRepairTicketSchema.safeParse({
      deviceId: "device_123",
      issueDescription: "   Keyboard is not responding   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.issueDescription).toBe("Keyboard is not responding");
    }
  });

  it("rejects an empty device id", () => {
    const result = createRepairTicketSchema.safeParse({
      deviceId: "",
      issueDescription: "Laptop battery drains too quickly.",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a short issue description", () => {
    const result = createRepairTicketSchema.safeParse({
      deviceId: "device_123",
      issueDescription: "broken",
    });

    expect(result.success).toBe(false);
  });

  it("rejects issue descriptions over 2000 characters", () => {
    const result = createRepairTicketSchema.safeParse({
      deviceId: "device_123",
      issueDescription: "a".repeat(2001),
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid photo references", () => {
    const result = createRepairTicketSchema.safeParse({
      deviceId: "device_123",
      issueDescription: "Laptop screen flickers after startup.",
      photoUrl: "uploads/script.js",
    });

    expect(result.success).toBe(false);
  });
});

describe("assignRepairTicketSchema", () => {
  it("accepts a technician id", () => {
    const result = assignRepairTicketSchema.safeParse({
      technicianId: "tech_123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty technician id", () => {
    const result = assignRepairTicketSchema.safeParse({
      technicianId: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateRepairTicketStatusSchema", () => {
  it("accepts a valid repair status", () => {
    const result = updateRepairTicketStatusSchema.safeParse({
      status: "DEVICE_RECEIVED",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid repair status", () => {
    const result = updateRepairTicketStatusSchema.safeParse({
      status: "NOT_A_STATUS",
    });

    expect(result.success).toBe(false);
  });
});


