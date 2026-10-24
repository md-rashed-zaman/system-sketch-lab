import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const baseURL = `http://localhost:${PORT}`;
const dbPath = process.env.E2E_DATABASE_PATH ?? path.join(os.tmpdir(), "system-sketch-lab-e2e.db");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure", viewport: { width: 1440, height: 900 } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    // A production build against a fresh database: the closest thing to what users get.
    command: `rm -f "${dbPath}" "${dbPath}-wal" "${dbPath}-shm" && pnpm db:migrate && pnpm build && pnpm start -p ${PORT}`,
    url: baseURL,
    timeout: 600_000,
    reuseExistingServer: false,
    stdout: "pipe",
    env: {
      DATABASE_PATH: dbPath,
      BETTER_AUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-0123456789",
      PAYMENTS_MODE: "test",
      AUTH_RATE_LIMIT: "off",
      LEMONSQUEEZY_WEBHOOK_SECRET: "e2e_webhook_secret",
    },
  },
});
