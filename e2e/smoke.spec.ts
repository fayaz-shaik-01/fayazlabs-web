import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads and has title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/fayaz/i);
  });

  test("navigation links are visible", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("learning page loads", async ({ page }) => {
    await page.goto("/learning");
    await expect(page.locator("body")).toContainText(/learning|track/i);
  });

  test("practice page loads", async ({ page }) => {
    await page.goto("/practice");
    await expect(page.locator("body")).toContainText(/practice/i);
  });

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
