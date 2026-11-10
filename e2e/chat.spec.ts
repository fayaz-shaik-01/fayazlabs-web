import { test, expect, type Page } from "@playwright/test";

const REPLY = {
  success: true,
  message: null,
  error: null,
  timestamp: "",
  data: {
    answer: "I build **AI testing tools** and backends.\n\n- An AI test automation tool\n- A hotel booking platform\n\nSee [projects](/projects).",
    sources: [{ title: "StayNest", slug: "projects/staynest", sourceType: "project", snippet: "", relevanceScore: 1, url: "" }],
    metadata: { queryType: "CHAT", sourcesUsed: 1, latencyMs: 812, model: "demo-model" },
  },
};

async function mockChat(page: Page, delayMs = 0) {
  const asked: string[] = [];
  await page.route("**/api/chat", async (route) => {
    asked.push(JSON.parse(route.request().postData() ?? "{}").query);
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REPLY) });
  });
  return asked;
}

test.describe("AI chat", () => {
  test("launcher opens the panel; a suggestion gets a formatted, sourced answer", async ({ page }) => {
    const asked = await mockChat(page);
    await page.goto("/");
    await page.getByTestId("chat-launcher").click();
    const status = page.getByTestId("chat-status");
    await expect(status).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "What do you build?" }).click();
    expect(asked).toEqual(["What do you build?"]);
    const reply = page.getByTestId("chat-assistant-message");
    await expect(reply).toContainText("I build AI testing tools and backends.");
    await expect(reply.locator("strong")).toHaveText("AI testing tools");
    await expect(reply.locator("ul:not([aria-label]) li")).toHaveCount(2); // the two bullets, not the source card
    await expect(reply.getByRole("link", { name: "projects" })).toHaveAttribute("href", "/projects");
    await expect(reply.getByRole("link", { name: /StayNest/ })).toHaveAttribute("href", "/projects/staynest");
    await expect(status).toHaveAttribute("data-status", "idle"); // back to idle after answering
  });

  test("the orb shows thinking while waiting, then answering", async ({ page }) => {
    await mockChat(page, 900);
    await page.goto("/");
    await page.getByTestId("chat-launcher").click();
    await page.getByRole("textbox", { name: "Message" }).fill("hello there");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByTestId("chat-status")).toHaveAttribute("data-status", "thinking");
    await expect(page.getByTestId("chat-thinking")).toBeVisible();
    await expect(page.getByTestId("chat-status")).toHaveAttribute("data-status", "speaking", { timeout: 5_000 });
    await expect(page.getByTestId("chat-assistant-message")).toBeVisible();
  });

  test("the home showcase sends a question and opens the chat with the answer", async ({ page }) => {
    const asked = await mockChat(page);
    await page.goto("/");
    const section = page.getByRole("region", { name: /Ask my AI anything/ });
    await expect(section).toBeVisible();
    await section.getByRole("textbox", { name: "Ask the AI" }).fill("What is your stack?");
    await section.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(page.getByTestId("chat-assistant-message")).toContainText("I build");
    expect(asked).toEqual(["What is your stack?"]);
    await expect(page.getByTestId("chat-user-message")).toHaveText("What is your stack?");
  });

  test("a failed request shows a friendly message, not an error dump", async ({ page }) => {
    await page.route("**/api/chat", (r) => r.fulfill({ status: 503, body: "upstream down" }));
    await page.goto("/");
    await page.getByTestId("chat-launcher").click();
    await page.getByRole("textbox", { name: "Message" }).fill("hi");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("chat-assistant-message")).toContainText("couldn’t answer that just now");
    await expect(page.getByTestId("chat-status")).toHaveAttribute("data-status", "idle");
  });

  test("reduced motion gets the static CSS orb, with no 3D canvas", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.getByTestId("ai-orb").first().scrollIntoViewIfNeeded();
    await expect(page.getByTestId("ai-orb").first()).toHaveAttribute("data-mode", "css");
    await expect(page.locator("canvas")).toHaveCount(0);
    await ctx.close();
  });

  test("with motion allowed the 3D orb loads once it scrolls into view", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveCount(0); // not loaded until needed
    await page.getByTestId("ai-orb").first().scrollIntoViewIfNeeded();
    const orb = page.getByTestId("ai-orb").first();
    await expect(orb).toHaveAttribute("data-mode", /3d|css/); // css when the machine has no WebGL
    if ((await orb.getAttribute("data-mode")) === "3d") await expect(page.locator("canvas")).toHaveCount(1);
  });
});
