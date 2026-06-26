import { CustodyStatus, RequesterType } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const requiredTrimmedString = (fieldName: string, max: number, min = 1) =>
  z.string().trim().min(min, `${fieldName} is required`).max(max, `${fieldName} must be ${max} characters or less`);

export const publicRequesterInputSchema = z.object({
  requesterType: z.nativeEnum(RequesterType),
  fullName: requiredTrimmedString("Full name", 120, 2),
  universityId: optionalTrimmedString(60),
  faculty: optionalTrimmedString(120),
  department: optionalTrimmedString(120),
  phone: requiredTrimmedString("Phone number", 30, 7),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required")
    .max(160)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export const publicRepairRequestInputSchema = z.object({
  requester: publicRequesterInputSchema,
  deviceType: requiredTrimmedString("Device type", 80, 2),
  brand: requiredTrimmedString("Brand", 80, 2),
  model: requiredTrimmedString("Model", 120, 2),
  serialNumber: optionalTrimmedString(120),
  assetTag: optionalTrimmedString(120),
  issueDescription: requiredTrimmedString("Issue description", 2000, 10),
});

export const serviceDeskAssignmentInputSchema = z.object({
  technicianId: requiredTrimmedString("Technician", 100),
});

export const custodyCheckInInputSchema = z.object({
  condition: optionalTrimmedString(500),
  storageLocation: requiredTrimmedString("Storage location", 120),
});

export const pickupConfirmationInputSchema = z.object({
  collectedByName: requiredTrimmedString("Collector name", 120, 2),
  collectedByPhone: optionalTrimmedString(30),
});

export const custodyStatusTransitionInputSchema = z.object({
  status: z.nativeEnum(CustodyStatus),
  note: optionalTrimmedString(1000),
});

export const technicianStatusUpdateInputSchema = z.object({
  status: z.enum(["REPAIR_IN_PROGRESS", "READY_FOR_COLLECTION"] as const),
  note: optionalTrimmedString(1000),
});

export type PublicRequesterInput = z.infer<typeof publicRequesterInputSchema>;
export type PublicRepairRequestInput = z.infer<typeof publicRepairRequestInputSchema>;
export type ServiceDeskAssignmentInput = z.infer<typeof serviceDeskAssignmentInputSchema>;
export type CustodyCheckInInput = z.infer<typeof custodyCheckInInputSchema>;
export type PickupConfirmationInput = z.infer<typeof pickupConfirmationInputSchema>;
export type CustodyStatusTransitionInput = z.infer<typeof custodyStatusTransitionInputSchema>;
export type TechnicianStatusUpdateInput = z.infer<typeof technicianStatusUpdateInputSchema>;
