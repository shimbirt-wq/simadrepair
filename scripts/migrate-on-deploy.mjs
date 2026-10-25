// Applies pending database migrations during a Vercel *production* build, so
// new code never runs against an old schema. Previews and local builds skip it.
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate] Not a Vercel production build: skipping prisma migrate deploy.");
  process.exit(0);
}

if (!process.env.DIRECT_URL) {
  console.error(
    "[migrate] DIRECT_URL is not set. Add the direct (non-pooled, port 5432) Supabase connection string " +
      "as DIRECT_URL in Vercel → Settings → Environment Variables; migrations cannot run through the pooler.",
  );
  process.exit(1);
}

console.log("[migrate] Applying pending migrations…");
execSync("npx prisma migrate deploy", { stdio: "inherit" });
