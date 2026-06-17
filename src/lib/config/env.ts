import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(5),
  UPLOAD_PUBLIC_BASE_URL: z.string().url().optional(),
});

export type ValidatedEnvironment = z.infer<typeof envSchema>;

export function validateEnvironment(env: NodeJS.ProcessEnv = process.env) {
  return envSchema.safeParse(env);
}

export function getEnvironmentStatus(env: NodeJS.ProcessEnv = process.env) {
  const parsed = validateEnvironment(env);

  if (parsed.success) {
    return {
      ok: true as const,
      environment: parsed.data.NODE_ENV,
    };
  }

  return {
    ok: false as const,
    issues: parsed.error.flatten().fieldErrors,
  };
}
