// Picks the database URLs `prisma migrate deploy` should try on Vercel.
//
// Migrations cannot run through Supabase's transaction pooler (port 6543), and
// Vercel builds cannot reach Supabase's direct host (db.<ref>.supabase.co is
// IPv6-only). The session pooler (same pooler host, port 5432) works for both,
// so it is derived from DATABASE_URL when DIRECT_URL is missing or unreachable.

const DIRECT_SUPABASE_HOST = /^db\.[a-z0-9]+\.supabase\.co$/i;
const POOLER_HOST = /\.pooler\.supabase\.com$/i;

/** DATABASE_URL on the transaction pooler → the same credentials on the session pooler, or null. */
export function sessionPoolerUrl(databaseUrl) {
  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    return null;
  }
  if (!POOLER_HOST.test(url.hostname)) return null;
  url.port = "5432";
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("connection_limit");
  return url.toString();
}

/** URLs to try in order, each with a label safe to print (no credentials). */
export function migrationCandidates(env) {
  const candidates = [];
  const add = (url, label) => {
    if (url && !candidates.some((c) => c.url === url)) candidates.push({ url, label });
  };
  const direct = env.DIRECT_URL?.trim();
  let directHost = null;
  try {
    directHost = direct ? new URL(direct).hostname : null;
  } catch {
    directHost = null;
  }
  const session = env.DATABASE_URL ? sessionPoolerUrl(env.DATABASE_URL.trim()) : null;

  // The IPv6-only direct host goes last: it fails from Vercel but works elsewhere.
  if (direct && directHost && !DIRECT_SUPABASE_HOST.test(directHost)) add(direct, `DIRECT_URL (${directHost})`);
  if (session) add(session, `session pooler derived from DATABASE_URL (${new URL(session).host})`);
  if (direct && directHost && DIRECT_SUPABASE_HOST.test(directHost)) add(direct, `DIRECT_URL (${directHost})`);
  return candidates;
}
