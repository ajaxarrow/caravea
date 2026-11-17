import path from "node:path"

import { defineConfig, devices } from "@playwright/test"

import { API_PORT, PROXY_PORT, WEB_PORT } from "./e2e/support/env"

/*
 * End-to-end tests run the real stack: a Laravel API on a throwaway SQLite
 * database (migrated and seeded fresh each run) and a production build of
 * the Next.js app pointed at it. Nothing touches your dev database.
 */
const E2E_DATABASE = path.resolve(__dirname, "../backend/database/e2e.sqlite")

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    // Runs first: some states (e.g. the bays lookup failing) can only be
    // seen while Next's cache is still cold.
    { name: "states", testMatch: "states.spec.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "flows", testMatch: "bookings.spec.ts", use: { ...devices["Desktop Chrome"] }, dependencies: ["states"] },
  ],
  webServer: [
    {
      cwd: "../backend",
      command: `touch ${E2E_DATABASE} && php artisan migrate:fresh --seed --force && php artisan serve --port=${API_PORT}`,
      env: { DB_DATABASE: E2E_DATABASE },
      url: `http://127.0.0.1:${API_PORT}/up`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // Next talks to Laravel through this proxy so tests can inject slow
      // responses and failures (see e2e/support/fault-proxy.mjs).
      command: "node e2e/support/fault-proxy.mjs",
      env: { FAULT_PROXY_PORT: String(PROXY_PORT), FAULT_PROXY_TARGET: `http://127.0.0.1:${API_PORT}` },
      url: `http://127.0.0.1:${PROXY_PORT}/up`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `npm run build && npx next start -p ${WEB_PORT}`,
      env: { API_URL: `http://127.0.0.1:${PROXY_PORT}/api` },
      // A static file: hitting a page here would warm Next's data cache
      // before the tests that need it cold.
      url: `http://127.0.0.1:${WEB_PORT}/icon.svg`,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
})
