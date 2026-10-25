import { RequesterType } from "@prisma/client";
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

export type PublicRequesterInput = z.infer<typeof publicRequesterInputSchema>;
export type PublicRepairRequestInput = z.infer<typeof publicRepairRequestInputSchema>;
