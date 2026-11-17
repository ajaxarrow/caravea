import path from "node:path"

import { defineConfig, devices } from "@playwright/test"

/*
 * End-to-end tests run the real stack: a Laravel API on a throwaway SQLite
 * database (migrated and seeded fresh each run) and a production build of
 * the Next.js app pointed at it. Nothing touches your dev database.
 */
const API_PORT = 8001
const WEB_PORT = 3001
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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
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
      command: `npm run build && npx next start -p ${WEB_PORT}`,
      env: { API_URL: `http://127.0.0.1:${API_PORT}/api` },
      url: `http://127.0.0.1:${WEB_PORT}/bookings`,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
})
