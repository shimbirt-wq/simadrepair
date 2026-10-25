import { NextResponse } from "next/server";
import { z } from "zod";
import { validationErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { bulkAddTechnicians, listStaff, SKILL_VALUES } from "@/lib/staff/staff-service";

const bulkSchema = z.object({
  text: z.string().trim().min(3, "Paste at least one line: name, email, phone.").max(20_000),
  skills: z.array(z.enum(SKILL_VALUES)).default([]),
});

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);
  return NextResponse.json({ staff: await listStaff(prisma) });
}

/** Bulk-adds volunteer technicians; generated passwords are returned once. */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedRole(prisma, request, ["ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Check the list.", parsed.error);

  const results = await bulkAddTechnicians(prisma, parsed.data.text, parsed.data.skills);
  return NextResponse.json({ results }, { status: 201, headers: { "cache-control": "no-store" } });
}
