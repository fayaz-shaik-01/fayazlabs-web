// Screenshots of the lesson page with SYNTHETIC fixture content only.
import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 390, height: 844 }]] as const) {
  for (const scheme of ["light", "dark"] as const) {
    test(`shot ${label} ${scheme}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: scheme });
      const page = await ctx.newPage();
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill("paid-user@example.com");
      await page.getByPlaceholder("Password").fill("password123");
      await page.locator('button[type="submit"]').click();
      await page.waitForURL((u) => !u.pathname.startsWith("/login"));
      const key = await (await page.request.get("http://localhost:4100/__key")).text();
      await page.evaluate((k) => {
        localStorage.setItem("fayazlabs_mock_grant", JSON.stringify({ baseUrl: "http://localhost:4100", key: k }));
        localStorage.setItem("theme", "x");
      }, key);
      await page.evaluate((s) => localStorage.setItem("theme", s), scheme);
      await page.goto("/learning/ai-product-testing/lessons/L2-05");
      await page.getByTestId("lesson-article").waitFor();
      await page.waitForTimeout(500);
      mkdirSync("docs/design-review", { recursive: true });
      await page.screenshot({ path: `docs/design-review/lesson-${label}-${scheme}.png`, quality: undefined });
      await ctx.close();
    });
  }
}
