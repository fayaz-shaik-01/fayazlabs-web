import { defineConfig, devices } from "@playwright/test";

const MEDIA = "http://localhost:4100";
export default defineConfig({
  testDir: "./e2e/player",
  testMatch: /.*\.spec\.ts/,
  timeout: 90_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    ...devices["Desktop Chrome"],
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] },
  },
  webServer: [
    { command: "npx tsx e2e/player/serve.ts", url: `${MEDIA}/__key`, reuseExistingServer: true, timeout: 60_000 },
    {
      // Production build: dev-mode chunk compilation would pollute the timings.
      command: `npm run build && npx next start -p 3100`,
      env: { NEXT_PUBLIC_API_MOCK: "1", NEXT_PUBLIC_MEDIA_ORIGIN: MEDIA },
      url: "http://localhost:3100",
      reuseExistingServer: true,
      timeout: 600_000,
    },
  ],
});
