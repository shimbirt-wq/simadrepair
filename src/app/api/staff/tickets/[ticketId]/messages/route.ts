import { NextResponse } from "next/server";
import { z } from "zod";
import { validationErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { sendTicketMessage } from "@/lib/messaging/message-service";
import { MESSAGE_TEMPLATES } from "@/lib/messaging/templates";

type RouteContext = { params: Promise<{ ticketId: string }> };

const bodySchema = z.object({ template: z.enum(MESSAGE_TEMPLATES) });

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(prisma, request);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationErrorResponse("Choose a message.", parsed.error);

  const { ticketId } = await context.params;
  const result = await sendTicketMessage(prisma, auth.user, ticketId, parsed.data.template);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  return NextResponse.json({ openUrl: result.openUrl, text: result.text });
}
