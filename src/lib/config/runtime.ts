const DEFAULT_JWT_SECRET = "replace-with-a-long-random-secret";

function hasPlaceholderDatabaseValue(value: string | undefined) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return true;
  }

  return value.includes("[PASSWORD]") || value.includes("[PROJECT_REF]");
}

export function getDatabaseConfigurationIssue(): string | null {
  if (hasPlaceholderDatabaseValue(process.env.DATABASE_URL) || hasPlaceholderDatabaseValue(process.env.DIRECT_URL)) {
    return "Database configuration is incomplete. Replace the placeholder DATABASE_URL and DIRECT_URL values in .env with real PostgreSQL connection strings before using authentication.";
  }

  return null;
}

export function getJwtConfigurationIssue(): string | null {
  const secret = process.env.JWT_SECRET;

  if (typeof secret !== "string" || secret.trim().length === 0) {
    return "JWT configuration is incomplete. Set JWT_SECRET in .env to a real secret with at least 32 characters.";
  }

  if (secret === DEFAULT_JWT_SECRET || secret.length < 32) {
    return "JWT configuration is incomplete. Set JWT_SECRET in .env to a real secret with at least 32 characters.";
  }

  return null;
}

export function getAuthRuntimeIssue(): string | null {
  return getDatabaseConfigurationIssue() ?? getJwtConfigurationIssue();
}
