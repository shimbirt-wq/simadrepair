import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "REGISTRATION_CLOSED"
  | "DUPLICATE"
  | "DAILY_LIMIT"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export function apiErrorResponse(
  status: 400 | 401 | 403 | 404 | 409 | 429 | 500 | 502 | 503,
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

/** Field errors keyed by dotted path, e.g. { "requester.phone": ["Enter a Somali mobile number…"] }. */
export function issuesByPath(error: ZodError) {
  const issues: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (issues[key] ??= []).push(issue.message);
  }
  return issues;
}

export function validationErrorResponse(message: string, error: ZodError) {
  return apiErrorResponse(400, "BAD_REQUEST", message, {
    issues: issuesByPath(error),
  });
}

export function internalErrorResponse() {
  return apiErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}
