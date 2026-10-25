import { z } from "zod";
import { ACCESSORY_VALUES } from "@/lib/intake/options";
import { CONDITION_VALUES } from "@/lib/tickets/check-in-options";
import { repairRecordSchema } from "@/lib/tickets/repair-record";

const text = (label: string, max = 500) => z.string().trim().min(3, `${label} is required.`).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

/** Body of POST /api/staff/tickets/[ticketId]/actions. */
export const staffTicketActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("CHECK_IN"),
    idChecked: z.literal(true, { errorMap: () => ({ message: "Check the university ID card first." }) }),
    conditionChecks: z.array(z.enum(CONDITION_VALUES)).default([]),
    condition: optionalText(500),
    accessoriesReceived: z.array(z.enum(ACCESSORY_VALUES)).default([]),
    zone: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]?$/, "Use one letter, e.g. A.")
      .optional()
      .transform((value) => value || null),
    priority: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
    devicePassword: z.string().max(200).optional().transform((value) => (value && value.length > 0 ? value : null)),
  }),
  z.object({ type: z.literal("ASSIGN"), technicianId: z.string().trim().min(1, "Choose a technician."), reason: optionalText(300).transform((v) => v ?? undefined) }),
  z.object({ type: z.literal("CLAIM") }),
  z.object({ type: z.literal("RELEASE"), reason: text("A reason", 300) }),
  z.object({ type: z.literal("START") }),
  z.object({ type: z.literal("BLOCK"), kind: z.enum(["WAITING_FOR_PARTS", "ACTION_NEEDED"]), detail: text("Detail", 300) }),
  z.object({ type: z.literal("RESUME") }),
  z.object({ type: z.literal("PROPOSE_CANNOT_REPAIR"), reason: text("A reason", 500) }),
  z.object({ type: z.literal("CONFIRM_CANNOT_REPAIR") }),
  z.object({ type: z.literal("REJECT_CANNOT_REPAIR"), reason: optionalText(300).transform((v) => v ?? undefined) }),
  z.object({ type: z.literal("MARK_READY"), record: repairRecordSchema }),
  z.object({ type: z.literal("PICKUP"), collectedByName: text("Collector name", 120), collectedByPhone: optionalText(30) }),
  z.object({ type: z.literal("CANCEL") }),
  z.object({ type: z.literal("ADD_NOTE"), note: text("A note", 1000) }),
]);

export type StaffTicketAction = z.infer<typeof staffTicketActionSchema>;
