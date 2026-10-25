import { apiErrorResponse } from "@/lib/api/responses";
import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { readPhoto } from "@/lib/photos/photo-service";

type RouteContext = { params: Promise<{ photoId: string }> };

/** Staff-only photo bytes. Never cached by shared caches. */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(prisma, request);
  if (!auth.ok) return authorizationErrorResponse(auth);

  const { photoId } = await context.params;
  const photo = await readPhoto(prisma, photoId);
  if (!photo) return apiErrorResponse(404, "NOT_FOUND", "Photo not found.");

  return new Response(Buffer.from(photo.bytes), {
    headers: { "content-type": photo.mimeType, "cache-control": "private, max-age=300", "x-content-type-options": "nosniff" },
  });
}
