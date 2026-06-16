import { NextResponse } from "next/server";
import { createClearedSessionCookie } from "@/lib/auth/session";

export function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(createClearedSessionCookie());

  return response;
}
