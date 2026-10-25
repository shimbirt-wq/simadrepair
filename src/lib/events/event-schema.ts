import { z } from "zod";
import { normalizeSomaliPhone } from "@/lib/phone";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

export const eventInputSchema = z
  .object({
    name: z.string().trim().min(3, "Name is required.").max(120),
    startsOn: day,
    endsOn: day,
    registrationOpensOn: day,
    registrationClosesOn: day,
    venue: z.string().trim().min(3, "Venue is required.").max(160),
    hours: z.string().trim().min(3, "Hours are required.").max(80),
    deskWhatsapp: z
      .string()
      .trim()
      .transform((value) => normalizeSomaliPhone(value) ?? value.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(/^\+\d{9,15}$/, "Enter a WhatsApp number, e.g. +252 61 234 5678.")),
    holdDays: z.coerce.number().int().min(1, "At least 1 day.").max(365),
  })
  .superRefine((value, ctx) => {
    if (value.endsOn < value.startsOn) ctx.addIssue({ code: "custom", path: ["endsOn"], message: "Ends before it starts." });
    if (value.registrationClosesOn < value.registrationOpensOn)
      ctx.addIssue({ code: "custom", path: ["registrationClosesOn"], message: "Closes before it opens." });
    if (value.registrationClosesOn > value.endsOn) ctx.addIssue({ code: "custom", path: ["registrationClosesOn"], message: "Must close by the last event day." });
  });

export type EventInput = z.infer<typeof eventInputSchema>;
