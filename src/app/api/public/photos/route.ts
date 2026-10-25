import { NextResponse } from "next/server";
import { apiErrorResponse, internalErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { MAX_PHOTO_BYTES } from "@/lib/photos/image";
import { savePhoto } from "@/lib/photos/photo-service";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

/** Upload one requester photo before the form is sent; returns a token the form submits. */
export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(prisma, `photo:${getRequestIp(request)}`, 30, 60 * 60 * 1000);
  if (!rateLimit.allowed) return apiErrorResponse(429, "RATE_LIMITED", "Too many photos. Try again later.");

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) return apiErrorResponse(400, "BAD_REQUEST", "Choose a photo.");
  if (file.size > MAX_PHOTO_BYTES) return apiErrorResponse(400, "BAD_REQUEST", "Photos must be 5 MB or smaller.");

  try {
    const result = await savePhoto(prisma, new Uint8Array(await file.arrayBuffer()), { kind: "REQUESTER" });
    if (!result.ok) return apiErrorResponse(400, "BAD_REQUEST", result.message);
    return NextResponse.json({ photo: { token: result.token } }, { status: 201 });
  } catch (error) {
    console.error("Photo upload failed.", error instanceof Error ? error.message : error);
    return internalErrorResponse();
  }
}
