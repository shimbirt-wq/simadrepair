import { z } from "zod";

export const publicRegistrationRoles = ["STUDENT", "LECTURER", "TECHNICIAN"] as const;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  universityId: z.string().trim().min(2, "University ID is required").max(60),
  faculty: z.string().trim().min(2, "Faculty is required").max(120),
  department: z.string().trim().min(2, "Department is required").max(120),
  phone: z.string().trim().min(7, "Phone number is required").max(30),
  email: z.string().trim().toLowerCase().email("Valid email is required").max(160),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(publicRegistrationRoles).default("STUDENT"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
