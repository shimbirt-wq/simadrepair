import { authorizationErrorResponse, requireAuthenticatedUser } from "@/lib/auth/authorization";
import { apiErrorResponse, validationErrorResponse } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { createRepairPhotoUploadIntent, uploadRepairPhotoFile } from "@/lib/uploads/upload-service";
import { uploadIntentSchema } from "@/lib/validations/uploads";

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser(prisma, request);

  if (!authResult.ok) {
    return authorizationErrorResponse(authResult);
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const photo = formData.get("photo");

    if (!(photo instanceof File)) {
      return apiErrorResponse(400, "BAD_REQUEST", "Photo file is required.");
    }

    const result = await uploadRepairPhotoFile(authResult.user, photo);

    if (!result.ok) {
      if ("status" in result && result.status === 503) {
        return apiErrorResponse(503, "SERVICE_UNAVAILABLE", result.message);
      }

      if ("status" in result && result.status === 502) {
        return apiErrorResponse(502, "INTERNAL_ERROR", result.message);
      }

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
