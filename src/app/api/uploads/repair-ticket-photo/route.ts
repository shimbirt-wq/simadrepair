import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { createRepairPhotoUploadIntent } from "@/lib/uploads/upload-service";
import { uploadIntentSchema } from "@/lib/validations/uploads";

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = uploadIntentSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse("Invalid upload metadata.", parsedBody.error);
  }

  const result = createRepairPhotoUploadIntent(authResult.user, parsedBody.data);

  if (!result.ok) {
    return apiErrorResponse(400, "BAD_REQUEST", result.message);
  }

  return Response.json({
    upload: {
      objectPath: result.objectPath,
      photoUrl: result.photoUrl,
      maxSizeMb: result.maxSizeMb,
      allowedMimeTypes: result.allowedMimeTypes,
    },
  });
}
