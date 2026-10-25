import { apiErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { isAuthorizedCron } from "@/lib/retention/cron-auth";
import { runRetention } from "@/lib/retention/retention";

/** Daily data-retention job (AD4), run by the scheduler in vercel.json. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request.headers.get("authorization"))) return apiErrorResponse(401, "UNAUTHENTICATED", "Not allowed.");
  return Response.json(await runRetention(prisma));
}
