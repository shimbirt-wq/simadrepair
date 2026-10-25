import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";

/** For server pages: the signed-in user, or a redirect to sign-in / profile. */
export async function requirePageRole(path: string, roles: readonly UserRole[]) {
  const user = await getCurrentServerUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(path)}`);
  if (!roles.includes(user.role)) redirect("/profile?denied=1");
  return user;
}
