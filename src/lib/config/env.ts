import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(5),
  UPLOAD_PUBLIC_BASE_URL: z.string().url().optional(),
  UPLOAD_BUCKET: z.string().min(3).max(64).regex(/^[a-z0-9][a-z0-9-]+$/, "Upload bucket must be a lowercase storage bucket name").default("repair-ticket-photos"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production") {
    return;
  }

  if (!env.SUPABASE_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SUPABASE_URL"],
      message: "SUPABASE_URL is required in production for repair photo uploads.",
    });
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SUPABASE_SERVICE_ROLE_KEY"],
      message: "SUPABASE_SERVICE_ROLE_KEY is required in production for repair photo uploads.",
    });
  }
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
