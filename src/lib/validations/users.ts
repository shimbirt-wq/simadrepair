import { UserRole } from "@prisma/client";
import { z } from "zod";

const positiveInteger = z.coerce.number().int().positive();

export const userListQuerySchema = z.object({
  page: positiveInteger.default(1),
  pageSize: positiveInteger.max(20).default(10),
  query: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
