import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .optional()
  .transform((value) => (value && value.trim().length > 0 ? value : undefined));

export const reportDateRangeSchema = z
  .object({
    dateFrom: dateSchema,
    dateTo: dateSchema,
  })
  .refine(
    (value) => {
      if (!value.dateFrom || !value.dateTo) {
        return true;
      }

      return value.dateFrom <= value.dateTo;
    },
    {
      message: "dateFrom must be before or equal to dateTo",
      path: ["dateTo"],
    },
  );

export type ReportDateRange = z.infer<typeof reportDateRangeSchema>;

export function toCreatedAtRange(input: ReportDateRange) {
  if (!input.dateFrom && !input.dateTo) {
    return undefined;
  }

  return {
    ...(input.dateFrom ? { gte: new Date(`${input.dateFrom}T00:00:00.000Z`) } : {}),
    ...(input.dateTo ? { lte: new Date(`${input.dateTo}T23:59:59.999Z`) } : {}),
  };
}
