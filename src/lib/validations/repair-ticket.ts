import { z } from "zod";

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
    .url("Photo URL must be a valid URL")
    .optional()
    .transform((value) => value || undefined),
});

export type CreateRepairTicketInput = z.infer<typeof createRepairTicketSchema>;
