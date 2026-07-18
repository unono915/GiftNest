import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate from vitest.config.ts because these tests need a running Firebase
// emulator (see `npm run test:rules`, which wraps this with
// `firebase emulators:exec`) and a plain Node environment, not jsdom.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/rules/**/*.test.ts"],
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
