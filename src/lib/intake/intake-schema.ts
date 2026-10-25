import { z } from "zod";
import { normalizeSomaliPhone } from "@/lib/phone";
import {
  ACCESSORY_VALUES,
  AGE_VALUES,
  BRAND_VALUES,
  DEVICE_TYPE_VALUES,
  OS_VALUES,
  RAM_VALUES,
  REQUESTER_TYPE_VALUES,
  STORAGE_VALUES,
} from "@/lib/intake/options";
import { normalizeUniversityId } from "@/lib/intake/university-id";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const choose = (label: string) => ({ errorMap: () => ({ message: `Choose ${label}.` }) });

export const intakeRequesterSchema = z.object({
  requesterType: z.enum(REQUESTER_TYPE_VALUES, choose("who you are")),
  fullName: z.string().trim().min(3, "Enter your full name.").max(120),
  universityId: z
    .string()
    .transform((value, ctx) => {
      const normalized = normalizeUniversityId(value);
      if (!normalized) ctx.addIssue({ code: "custom", message: "Enter the ID on your card, e.g. CS383833." });
      return normalized ?? "";
    }),
  phone: z.string().transform((value, ctx) => {
    const normalized = normalizeSomaliPhone(value);
    if (!normalized) ctx.addIssue({ code: "custom", message: "Enter a Somali mobile number, e.g. 061 234 5678." });
    return normalized ?? "";
  }),
  faculty: optionalText(120),
  department: optionalText(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.string().email("Enter a valid email or leave it empty.").optional()),
});

export const intakeDeviceSchema = z
  .object({
    deviceType: z.enum(DEVICE_TYPE_VALUES, choose("a device type")),
    brand: z.enum(BRAND_VALUES, choose("a brand")),
    brandOther: optionalText(60),
    model: z.string().trim().min(2, "Enter the model, e.g. ProBook 450 G8.").max(120),
    operatingSystem: z.enum(OS_VALUES, choose("the system")),
    ram: z.enum(RAM_VALUES, choose("the memory")),
    storageType: z.enum(STORAGE_VALUES, choose("the storage")),
    ageBand: z.enum(AGE_VALUES, choose("the age")),
    serialNumber: optionalText(120),
    accessories: z.array(z.enum(ACCESSORY_VALUES)).max(ACCESSORY_VALUES.length).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.brand === "OTHER" && !value.brandOther) ctx.addIssue({ code: "custom", path: ["brandOther"], message: "Enter the brand." });
  });

export const intakeProblemSchema = z.object({
  description: z.string().trim().min(10, "Describe the problem in a sentence or two.").max(2000),
});

export const intakeSchema = z.object({
  requester: intakeRequesterSchema,
  device: intakeDeviceSchema,
  problem: intakeProblemSchema,
  wipeAllowed: z.boolean().default(false),
  needsPassword: z.boolean().default(false),
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept to continue." }) }),
  /** Honeypot: hidden from people; bots fill it. */
  website: z.string().max(0).optional().default(""),
});

export type IntakeInput = z.infer<typeof intakeSchema>;
