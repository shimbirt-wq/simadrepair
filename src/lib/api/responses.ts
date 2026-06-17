import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export function apiErrorResponse(
  status: 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

export function validationErrorResponse(message: string, error: ZodError) {
  return apiErrorResponse(400, "BAD_REQUEST", message, {
    issues: error.flatten().fieldErrors,
  });
}

export function internalErrorResponse() {
  return apiErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}
