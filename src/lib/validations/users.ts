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
  isActive: z.boolean().optional(),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const createStaffAccountSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  universityId: z.string().trim().min(2).max(60),
  faculty: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "LEAD_TECHNICIAN", "TECHNICIAN"]),
});

export type CreateStaffAccountInput = z.infer<typeof createStaffAccountSchema>;
