// Applies pending database migrations during a Vercel *production* build, so
// new code never runs against an old schema. Previews and local builds skip it.
import { spawnSync } from "node:child_process";
import { migrationCandidates } from "./migration-url.mjs";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[migrate] Not a Vercel production build: skipping prisma migrate deploy.");
  process.exit(0);
}

const candidates = migrationCandidates(process.env);
if (candidates.length === 0) {
  console.error(
    "[migrate] No usable database URL. Set DIRECT_URL (Supabase → Connect → Session pooler, port 5432) " +
      "or a Supabase pooler DATABASE_URL in Vercel → Settings → Environment Variables.",
  );
  process.exit(1);
}

for (const { url, label } of candidates) {
  console.log(`[migrate] Applying pending migrations via ${label}…`);
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: { ...process.env, DIRECT_URL: url } });
  if (result.status === 0) process.exit(0);
  console.error(`[migrate] Failed via ${label}.`);
}

console.error(
  "[migrate] Could not apply migrations with any connection. Check that DIRECT_URL is the Supabase " +
    "Session pooler string (port 5432) and that its password is correct.",
);
process.exit(1);
