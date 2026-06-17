import { RepairStatus } from "@prisma/client";
import { z } from "zod";

const positiveInteger = z.coerce.number().int().positive();
const emptyStringToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalDateString = z.preprocess(
  emptyStringToUndefined,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.").optional(),
);

const optionalRepairStatus = z.preprocess(emptyStringToUndefined, z.nativeEnum(RepairStatus).optional());

export const repairTicketListQuerySchema = z
  .object({
    page: positiveInteger.default(1),
    pageSize: positiveInteger.max(20).default(10),
    status: optionalRepairStatus,
    ticketId: z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((value) => value || undefined),
    dateFrom: optionalDateString,
    dateTo: optionalDateString,
  })
  .superRefine((value, context) => {
    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: "dateTo must be on or after dateFrom.",
      });
    }
  });

export type RepairTicketListQuery = z.infer<typeof repairTicketListQuerySchema>;
