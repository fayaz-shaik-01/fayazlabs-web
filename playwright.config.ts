import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "**/player/**", // run with playwright.player.config.ts
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  timeout: 30_000,

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Set CHROMIUM_PATH to use a preinstalled browser (e.g. /opt/pw-browsers/chromium).
        ...(process.env.CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } }
          : {}),
      },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        // The UI tests run against the in-browser mock of the backend.
        env: { NEXT_PUBLIC_API_MOCK: "1" },
        timeout: 120_000,
      },
});
