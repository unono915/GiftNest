import { defineConfig, devices } from "@playwright/test";

/**
 * Run via `npm run test:e2e`, which wraps this with `firebase
 * emulators:exec` — the emulators must already be up when Playwright's own
 * webServer starts the Next.js dev server, since the app connects to them
 * via NEXT_PUBLIC_USE_FIREBASE_EMULATOR (see src/lib/firebase/client.ts).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  // Generous default: Turbopack dev-mode compiles each route on first
  // visit, which is far slower than a production build. Not representative
  // of real latency, just of this test mode.
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199",
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
    },
  },
});
