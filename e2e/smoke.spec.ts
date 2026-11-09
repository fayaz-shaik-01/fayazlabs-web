import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads and has title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/fayaz/i);
  });

  test("navigation links are visible", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header nav");
    await expect(nav).toBeVisible();
  });

  test("learning hub lists the AI Product Testing product", async ({ page }) => {
    await page.goto("/learning");
    await expect(page.getByRole("heading", { name: "AI Product Testing" })).toBeVisible();
    await expect(page.getByText("Free to start").first()).toBeVisible();
  });

  test("removed tracks and flagged routes are gone from the nav", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header nav");
    await expect(nav.getByRole("link", { name: "About" }).first()).toBeVisible();
    for (const name of ["Practice", "Flashcards", "Formulas", "Dashboard"]) {
      await expect(nav.getByRole("link", { name })).toHaveCount(0);
    }
    await expect(page.locator("body")).not.toContainText(/GATE|SDET Engineering/);
  });

  for (const path of ["/practice", "/flashcards", "/formulas", "/exam", "/knowledge-graph", "/dashboard", "/tax"]) {
    test(`${path} is hidden by default (feature flag off)`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
    });
  }

  test("health check — no console errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known benign errors (e.g. analytics, third-party scripts)
    const realErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("analytics")
    );
    expect(realErrors).toHaveLength(0);
  });
});
