import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    // Only TEST_DATABASE_URL is taken from .env; database suites skip without it.
    env: {
      TEST_DATABASE_URL: loadEnv("test", process.cwd(), "TEST_").TEST_DATABASE_URL ?? "",
      DEVICE_PASSWORD_KEY: Buffer.alloc(32, 7).toString("base64"),
    },
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
