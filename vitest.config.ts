import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    // Load all vars (empty prefix) from .env.local so DB-backed tests can
    // reach TEST_DATABASE_URL instead of silently skipping.
    env: loadEnv("", process.cwd(), ""),
  },
});
