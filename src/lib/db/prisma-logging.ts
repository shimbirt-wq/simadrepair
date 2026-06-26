import type { Prisma } from "@prisma/client";

type PrismaLogEnv = Record<string, string | undefined>;

export function getPrismaLogLevels(env: PrismaLogEnv = process.env as PrismaLogEnv): Prisma.PrismaClientOptions["log"] {
  return env.PRISMA_QUERY_LOG === "true" ? ["query", "error", "warn"] : ["error", "warn"];
}
