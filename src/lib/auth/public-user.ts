import { dateOnly, localDay } from "@/lib/events/event-window";
import type { User, UserRole } from "@prisma/client";

export type PublicUser = {
  id: string;
  fullName: string;
  universityId: string | null;
  faculty: string | null;
  department: string | null;
  phone: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  skills: string[];
  accessExpiresOn: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserForPublicResponse = Pick<
  User,
  "id" | "fullName" | "universityId" | "faculty" | "department" | "phone" | "email" | "role" | "isActive" | "skills" | "accessExpiresOn" | "createdAt" | "updatedAt"
>;

export const publicUserSelect = {
  id: true,
  fullName: true,
  universityId: true,
  faculty: true,
  department: true,
  phone: true,
  email: true,
  role: true,
  isActive: true,
  skills: true,
  accessExpiresOn: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function toPublicUser(user: UserForPublicResponse): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    universityId: user.universityId,
    faculty: user.faculty,
    department: user.department,
    phone: user.phone,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    skills: user.skills,
    accessExpiresOn: user.accessExpiresOn,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Active and, for volunteers, not past the last day of their event (AD2). */
export function hasAccess(user: { isActive: boolean; accessExpiresOn: Date | null }, now = new Date()) {
  if (!user.isActive) return false;
  if (!user.accessExpiresOn) return true;
  return localDay(now) <= dateOnly(user.accessExpiresOn);
}
