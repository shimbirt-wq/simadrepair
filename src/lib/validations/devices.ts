import { z } from "zod";

const positiveInteger = z.coerce.number().int().positive();

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const createDeviceSchema = z.object({
  ownerId: optionalTrimmedString(100),
  deviceType: z.string().trim().min(2, "Device type is required.").max(80),
  brand: z.string().trim().min(2, "Brand is required.").max(80),
  model: z.string().trim().min(2, "Model is required.").max(120),
  serialNumber: optionalTrimmedString(120),
});

export const deviceListQuerySchema = z.object({
  page: positiveInteger.default(1),
  pageSize: positiveInteger.max(20).default(10),
  query: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
  ownerId: optionalTrimmedString(100),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type DeviceListQuery = z.infer<typeof deviceListQuerySchema>;
