import { NextResponse } from "next/server";
import { apiErrorResponse, internalErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { intakeSchema } from "@/lib/intake/intake-schema";
import { createRepairRequest } from "@/lib/intake/intake-service";

/** Walk-in registration at the desk: same form and rules as the public request, recorded as the lead's. */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedRole(prisma, request, ["LEAD_TECHNICIAN", "ADMIN"]);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const parsed = intakeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Check the highlighted fields.", parsed.error);

  try {
    const result = await createRepairRequest(prisma, parsed.data, { kind: "desk", actorId: auth.user.id, actorRole: auth.user.role });
    if (result.ok) return NextResponse.json({ request: { trackingCode: result.trackingCode, firstName: result.firstName, ticketId: result.ticketId } }, { status: 201 });
    if (result.reason === "DUPLICATE") {
      return apiErrorResponse(409, "DUPLICATE", `This student already has an open request for this device: ${result.trackingCode}.`, { trackingCode: result.trackingCode });
    }
    if (result.reason === "REGISTRATION_CLOSED") return apiErrorResponse(409, "REGISTRATION_CLOSED", "There is no active event.");
    return apiErrorResponse(400, "BAD_REQUEST", "We couldn't accept this request.");
  } catch (error) {
    console.error("Desk registration failed.", error instanceof Error ? error.message : error);
    return internalErrorResponse();
  }
}
