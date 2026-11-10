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

      // The speed menu, then the player in full screen. The stage must fill the screen
      // and the controls must stay on it (nothing pushed below the fold).
      const player = page.getByTestId("slide-player");
      await player.scrollIntoViewIfNeeded();
      await page.getByTestId("speed").click();
      await page.getByTestId("speed-1.5").waitFor();
      await page.screenshot({ path: `docs/design-review/player-speed-${label}-${scheme}.png` });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Full screen" }).click();
      await player.and(page.locator('[data-fs="true"]')).waitFor();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `docs/design-review/player-fullscreen-${label}-${scheme}.png` });
      const box = await page.getByTestId("play-toggle").boundingBox();
      const inView = !!box && box.y + box.height <= viewport.height && box.y >= 0;
      if (!inView) throw new Error(`controls fell outside the full-screen viewport: ${JSON.stringify(box)}`);
      await ctx.close();
    });
  }
}
