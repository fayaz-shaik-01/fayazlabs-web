import { test, expect, type Page } from "@playwright/test";

// These tests need NEXT_PUBLIC_API_MOCK=1 (set by playwright.config.ts).

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill("password123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("course", () => {
  test("course home shows 4 levels", async ({ page }) => {
    await page.goto("/learning/ai-product-testing");
    for (const id of ["L0", "L1", "L2", "L3"]) {
      await expect(page.getByTestId(`level-${id}`)).toBeVisible();
    }
    await expect(page.getByText("L2-05")).toBeVisible();
  });

  test("L0 lesson is open without login", async ({ page }) => {
    await page.goto("/learning/ai-product-testing/lessons/L0-01");
    await expect(page.getByTestId("lesson-body")).toBeVisible();
    await expect(page.getByTestId("slide-player-slot")).toBeVisible();
    await expect(page.getByTestId("locked-card")).toHaveCount(0);
  });

  test("a paid lesson is locked for anonymous visitors with an upgrade link", async ({ page }) => {
    await page.goto("/learning/ai-product-testing/lessons/L2-05");
    const card = page.getByTestId("locked-card");
    await expect(card).toBeVisible();
    await expect(card.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/pricing");
    await expect(page.getByTestId("lesson-body")).toHaveCount(0);
  });

  test("a free-plan user sees the upgrade card, a paid user sees the lesson", async ({ page }) => {
    await signIn(page, "free-user@example.com");
    await page.goto("/learning/ai-product-testing/lessons/L1-01");
    await expect(page.getByTestId("locked-card")).toBeVisible();
    await expect(page.getByTestId("locked-card").getByText(/Your current plan does not include this/)).toBeVisible();

    await page.evaluate(() => localStorage.clear());
    await signIn(page, "paid-user@example.com");
    await page.goto("/learning/ai-product-testing/lessons/L1-01");
    await expect(page.getByTestId("lesson-body")).toBeVisible();
    await expect(page.getByTestId("locked-card")).toHaveCount(0);
  });

  test("heartbeat: signed out on another device shows the friendly notice", async ({ page }) => {
    await page.clock.install(); // must come before the page starts its timers
    await signIn(page, "paid-user@example.com");
    await page.goto("/learning/ai-product-testing/lessons/L1-01");
    await expect(page.getByTestId("lesson-body")).toBeVisible();

    // Simulate the account being used elsewhere, then let the 45 s heartbeat fire.
    await page.evaluate(() => localStorage.setItem("fayazlabs_mock_revoked", "1"));
    await page.clock.fastForward(46_000);

    const notice = page.getByTestId("session-revoked-notice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("You were signed out because your account was used on another device");
    expect(await page.evaluate(() => localStorage.getItem("fayazlabs_auth"))).toBeNull();
    await expect(page.getByTestId("locked-card")).toBeVisible();
  });
});

test.describe("pricing and account", () => {
  test("pricing reads plans from the API and says No refunds", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("plan-free")).toBeVisible();
    const pro = page.getByTestId("plan-pro_monthly");
    await expect(pro).toBeVisible();
    await expect(pro.getByText("No refunds.")).toBeVisible();
    await expect(pro.getByRole("link", { name: "Refund policy" })).toHaveAttribute("href", "/legal/refund");
  });

  test("subscribe in mock mode shows a message instead of Razorpay", async ({ page }) => {
    await signIn(page, "free-user@example.com");
    await page.goto("/pricing");
    await page.getByTestId("plan-pro_monthly").getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByTestId("pricing-message")).toContainText("mock mode");
  });

  test("account shows the plan, device notice and cancel", async ({ page }) => {
    await signIn(page, "paid-user@example.com");
    await page.goto("/account");
    await expect(page.getByTestId("account-plan")).toHaveText("Pro");
    await expect(page.getByTestId("device-notice")).toContainText("one device at a time");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Cancel at period end" }).click();
    await expect(page.getByTestId("cancel-pending")).toBeVisible();
  });
});

test.describe("legal and headers", () => {
  const pages = [
    ["/legal/terms", "Terms of Service"],
    ["/legal/privacy", "Privacy Policy"],
    ["/legal/refund", "Refund and Cancellation Policy"],
  ] as const;

  for (const [path, heading] of pages) {
    test(`${path} shows the real policy (no draft banner), heading and noindex`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page.getByTestId("legal-updated")).toContainText("Last updated");
      await expect(page.getByTestId("legal-draft-banner")).toHaveCount(0);
      await expect(page.getByText(/Draft text will be added here|DRAFT, pending review/)).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  }

  test("footer links to the legal pages", async ({ page }) => {
    await page.goto("/");
    const legal = page.getByRole("navigation", { name: "Legal" });
    for (const href of ["/legal/terms", "/legal/privacy", "/legal/refund"]) {
      await expect(legal.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test("CSP allows Razorpay and keeps frame-ancestors none", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"];
    expect(csp).toContain("https://checkout.razorpay.com");
    expect(csp).toContain("https://api.razorpay.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
  });
});
