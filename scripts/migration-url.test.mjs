// Run with: node --test scripts/migration-url.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { migrationCandidates, sessionPoolerUrl } from "./migration-url.mjs";

const pooled = "postgresql://postgres.abcd:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10";
const session = "postgresql://postgres.abcd:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";
const directV6 = "postgresql://postgres:pw@db.abcd.supabase.co:5432/postgres";

test("derives the session pooler from the transaction pooler", () => {
  assert.equal(sessionPoolerUrl(pooled), session);
  assert.equal(sessionPoolerUrl("postgresql://u:p@localhost:5432/db"), null);
  assert.equal(sessionPoolerUrl("not a url"), null);
});

test("uses a reachable DIRECT_URL first", () => {
  assert.deepEqual(migrationCandidates({ DIRECT_URL: session, DATABASE_URL: pooled }).map((c) => c.url), [session]);
});

test("falls back to the session pooler when DIRECT_URL is missing", () => {
  assert.deepEqual(migrationCandidates({ DATABASE_URL: pooled }).map((c) => c.url), [session]);
});

test("tries the session pooler before the IPv6-only direct host", () => {
  assert.deepEqual(migrationCandidates({ DIRECT_URL: directV6, DATABASE_URL: pooled }).map((c) => c.url), [session, directV6]);
});

test("labels never contain the password", () => {
  for (const c of migrationCandidates({ DIRECT_URL: directV6, DATABASE_URL: pooled })) assert.ok(!c.label.includes("pw"));
});
