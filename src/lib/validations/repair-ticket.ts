import { z } from "zod";
import { isAllowedPhotoReference } from "@/lib/validations/uploads";

export const createRepairTicketSchema = z.object({
  deviceId: z.string().min(1, "Device is required"),
  issueDescription: z
    .string()
    .trim()
    .min(10, "Problem description must be at least 10 characters")
    .max(2000, "Problem description must be 2000 characters or less"),
  photoUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || isAllowedPhotoReference(value), "Photo reference must be a valid upload URL or storage path"),
});

export type CreateRepairTicketInput = z.infer<typeof createRepairTicketSchema>;
