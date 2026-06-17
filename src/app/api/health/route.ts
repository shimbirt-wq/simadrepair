import { NextResponse } from "next/server";
import { getEnvironmentStatus } from "@/lib/config/env";

export function GET() {
  const environment = getEnvironmentStatus();

  return NextResponse.json({
    status: "ok",
    service: "farsamotech-repair-hub",
    stack: "nextjs-prisma-supabase",
    timestamp: new Date().toISOString(),
    environment,
  });
}
