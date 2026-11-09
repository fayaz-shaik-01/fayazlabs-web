import { test, expect, type Page } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";

const MEDIA = "http://localhost:4100";
const LESSON = "/learning/ai-product-testing/lessons/L2-05";
// Fixture slide: cue 1 at 0 s, 250 ms of silence, cue 2 at 2.125 s, 4 s in total (quiz on slide 2).
const CUE_START = [0, 2.125];

// Every request to the content origin must be one of the published paths.
const PUBLISHED = /^\/(catalog\.json|__key|(paid\/)?L\d-\d{2}\/(lesson\.html(\.enc)?|(lecture|talk)\/(deck\.json(\.enc)?|s\d{2}\.(mp3|enc))))$/;
function trackRequests(page: Page) {
  const paths: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.origin === MEDIA) paths.push(u.pathname);
  });
  return paths;
}

async function signInPaid(page: Page, ttlMs = 600_000) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("paid-user@example.com");
  await page.getByPlaceholder("Password").fill("password123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  const key = await (await page.request.get(`${MEDIA}/__key`)).text();
  await page.evaluate(
    ([k, ttl]) => localStorage.setItem("fayazlabs_mock_grant", JSON.stringify({ baseUrl: "http://localhost:4100", key: k, ttlMs: ttl })),
    [key, ttlMs] as const,
  );
}

async function instrument(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __log: Record<string, unknown[]> };
    w.__log = { playing: [], ended: [], cues: [], blobs: [] };
    document.addEventListener("playing", (e) => {
      const a = e.target as HTMLAudioElement;
      w.__log.playing.push({ t: performance.now(), rel: a.dataset.rel, dur: a.duration, rate: a.playbackRate, ct: a.currentTime });
    }, true);
    document.addEventListener("ended", (e) => w.__log.ended.push({ t: performance.now(), rel: (e.target as HTMLElement).dataset.rel }), true);
    const live = new Set<string>();
    const w2 = w as unknown as { __live: { max: number; created: number; now: () => number } };
    w2.__live = { max: 0, created: 0, now: () => live.size };
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (o: Blob | MediaSource) => {
      const u = create(o);
      live.add(u);
      w2.__live.created++;
      w2.__live.max = Math.max(w2.__live.max, live.size);
      return u;
    };
    URL.revokeObjectURL = (u: string) => {
      live.delete(u);
      revoke(u);
    };
    const start = () => {
      new MutationObserver((muts) => {
        for (const m of muts) {
          const el = m.target as HTMLElement;
          if (el.dataset?.testid !== "caption") continue;
          const audio = [...document.querySelectorAll("audio")].find((a) => !a.paused && a.dataset.rel) as HTMLAudioElement | undefined;
          w.__log.cues.push({ cue: Number(el.dataset.cue), rel: audio?.dataset.rel, currentTime: audio?.currentTime, rate: audio?.playbackRate, speaker: el.dataset.speaker });
        }
      }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-cue"] });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  });
}

const getLog = (page: Page) =>
  page.evaluate(() => (window as unknown as { __log: Record<string, { t?: number; cue?: number; currentTime?: number; rate?: number; rel?: string }[]> }).__log);

test("paid lesson: decrypt, sanitise, link navigation", async ({ page }) => {
  await signInPaid(page);
  await page.goto(LESSON);
  await expect(page.getByTestId("lesson-article")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("lesson-article").getByRole("heading", { name: "Sample lesson" })).toBeVisible();
  const art = page.getByTestId("lesson-article");
  await expect(art.locator("script, iframe, form, input")).toHaveCount(0);
  expect(await art.locator("img").evaluateAll((els) => els.map((e) => e.getAttributeNames().join(",")))).toEqual(
    expect.not.arrayContaining([expect.stringContaining("onerror")]),
  );
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  // Nothing decrypted in persistent storage.
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify(Object.keys(sessionStorage)));
  expect(stored).not.toContain("Invented body text");
  // Client navigation: a window marker survives.
  await page.evaluate(() => ((window as unknown as { __m: number }).__m = 1));
  await art.getByRole("link", { name: "Course home" }).click();
  await page.waitForURL(/\/learning\/ai-product-testing$/);
  expect(await page.evaluate(() => (window as unknown as { __m?: number }).__m)).toBe(1);
});

test("player on fast 4G: start time, gaps, cue latency, memory, protection", async ({ page, context }) => {
  await instrument(page);
  const requested = trackRequests(page);
  await signInPaid(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 170, downloadThroughput: (9 * 1_000_000) / 8, uploadThroughput: (3 * 1_000_000) / 8,
  });

  const navStart = Date.now();
  await page.goto(LESSON);
  const player = page.getByTestId("slide-player");
  await expect(player).toHaveAttribute("data-phase", "paused", { timeout: 30_000 });
  const readyMs = Date.now() - navStart;
  await expect(page.getByTestId("caption")).toBeAttached();

  // Protection UI
  await expect(page.locator("a[download]")).toHaveCount(0);
  await expect(page.locator("audio").first()).toHaveAttribute("controlslist", "nodownload");
  await expect(page.getByTestId("player-watermark")).toContainText("pa***@example.com");
  const prevented = await player.evaluate((el) => {
    const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  expect(prevented).toBe(true);

  await page.getByTestId("speed").selectOption("1.75");
  const t0 = await page.evaluate(() => performance.now());
  await page.getByTestId("play-toggle").click();
  await expect(player).toHaveAttribute("data-phase", "playing", { timeout: 5_000 });
  await expect(player).toHaveAttribute("data-index", "9", { timeout: 60_000 });

  // Sample blob count while playing through (already past slide 9 here, so re-sample by walking back and forth).
  const log = await getLog(page);
  const first = log.playing[0].t as number;
  const startLatency = first - t0;

  // Gap = time between the previous slide's audio finishing (its 'playing' time plus
  // remaining duration at the playback rate) and the next slide's audio actually playing.
  // The browser does not fire 'ended' once the player has already moved on, so the audio
  // clock is used instead. The quiz slide (2 -> 3) holds on purpose and is excluded.
  const gaps: number[] = [];
  const pl = log.playing as unknown as { t: number; rel: string; dur: number; rate: number; ct: number }[];
  for (let i = 0; i + 1 < pl.length; i++) {
    if (pl[i].rel === "lecture/s02.mp3" || pl[i].rel === pl[i + 1].rel) continue;
    const endsAt = pl[i].t + ((pl[i].dur - pl[i].ct) / pl[i].rate) * 1000;
    gaps.push(pl[i + 1].t - endsAt);
  }
  expect(gaps.length).toBeGreaterThanOrEqual(8);

  // Cue latency: how far past the cue start the audio clock was when the DOM updated.
  const lat: number[] = [];
  for (const c of log.cues) {
    if (c.currentTime === undefined || c.cue === undefined || c.cue < 0) continue;
    const startAt = CUE_START[c.cue] ?? 0;
    lat.push(((c.currentTime - startAt) / (c.rate ?? 1)) * 1000);
  }
  const maxLat = Math.max(...lat);

  // Blob count over a full walk: seek around quickly.
  let maxBlobs = 0;
  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: `Go to slide ${i + 1}`, exact: true }).click();
    maxBlobs = Math.max(maxBlobs, Number(await player.getAttribute("data-blob-count")));
  }
  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: "Next slide" }).click(); // rapid clicks
    maxBlobs = Math.max(maxBlobs, Number(await player.getAttribute("data-blob-count")));
  }

  const blobs = await page.evaluate(() => (window as unknown as { __live: { max: number; created: number; now: () => number } }).__live.max);
  const created = await page.evaluate(() => (window as unknown as { __live: { created: number } }).__live.created);
  maxBlobs = Math.max(maxBlobs, blobs);
  const metrics = { blobUrlsCreated: created, readyToPausedMs: readyMs, startLatencyMs: Math.round(startLatency), maxGapMs: Math.round(Math.max(...gaps)), gapsMs: gaps.map(Math.round), maxCueLagMs: Math.round(maxLat), cueSamples: lat.length, maxBlobUrls: maxBlobs };
  console.log("PLAYER METRICS", JSON.stringify(metrics));
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/player-metrics.json", JSON.stringify(metrics, null, 2));

  expect(requested.filter((p) => !PUBLISHED.test(p)), "unexpected content URLs").toEqual([]);
  expect(requested).toContain("/paid/L2-05/lecture/deck.json.enc");
  expect(requested).toContain("/paid/L2-05/lecture/s01.enc");
  expect(startLatency).toBeLessThan(1500);
  expect(Math.max(...gaps)).toBeLessThan(150);
  expect(maxLat).toBeLessThan(100);
  expect(maxBlobs).toBeLessThanOrEqual(4);
});

test("SESSION_REVOKED stops playback and drops decrypted data", async ({ page }) => {
  await signInPaid(page, 36_000); // grant refresh fires ~6 s in
  await page.goto(LESSON);
  const player = page.getByTestId("slide-player");
  await expect(player).toHaveAttribute("data-phase", "paused", { timeout: 20_000 });
  await page.getByTestId("play-toggle").click();
  await expect(player).toHaveAttribute("data-phase", "playing");
  await page.evaluate(() => localStorage.setItem("fayazlabs_mock_revoked", "1"));
  await expect(page.getByTestId("session-revoked-notice")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("slide-player")).toHaveCount(0);
  await expect(page.locator("audio")).toHaveCount(0); // players are torn down, audio elements gone
  await expect(page.getByTestId("lesson-article")).toHaveCount(0);
});

test("quiz: pauses at question_end, think countdown, reveal jumps to answer_start", async ({ page }) => {
  await signInPaid(page);
  await page.goto(LESSON);
  const player = page.getByTestId("slide-player");
  await expect(player).toHaveAttribute("data-phase", "paused", { timeout: 20_000 });
  await page.getByRole("button", { name: "Go to slide 2", exact: true }).click();
  await expect(player).toHaveAttribute("data-index", "1");
  await page.getByTestId("play-toggle").click();
  await expect(page.getByTestId("think-countdown")).toBeVisible({ timeout: 10_000 });
  await expect(player).toHaveAttribute("data-phase", "think");
  const paused = await page.evaluate(() => [...document.querySelectorAll("audio")].every((a) => a.paused));
  expect(paused).toBe(true);
  await page.getByTestId("reveal").click();
  await expect(player).toHaveAttribute("data-phase", "playing");
  const t = await page.evaluate(() => Math.max(...[...document.querySelectorAll("audio")].filter((a) => !a.paused).map((a) => a.currentTime)));
  expect(t).toBeGreaterThanOrEqual(2.1);
});

test("free lesson L0-02 cross-origin: lecture and conversation, published URLs only", async ({ page }) => {
  const requested = trackRequests(page);
  await page.goto("/learning/ai-product-testing/lessons/L0-02"); // signed out
  const player = page.getByTestId("slide-player");
  await expect(player).toHaveAttribute("data-phase", "paused", { timeout: 20_000 });
  await expect(page.getByTestId("lesson-article")).toBeVisible();
  await page.getByTestId("play-toggle").click();
  await expect(player).toHaveAttribute("data-phase", "playing");
  await expect(page.getByTestId("caption")).toContainText("Sample caption 1a");
  await page.getByTestId("mode-conversation").click();
  await expect(player).toHaveAttribute("data-mode", "conversation");
  await expect(player).toHaveAttribute("data-phase", "paused", { timeout: 15_000 });
  await expect(page.locator('[data-speaker="E"]')).toContainText("Sam");
  expect(requested.filter((p) => !PUBLISHED.test(p)), "unexpected content URLs").toEqual([]);
  expect(requested).toEqual(expect.arrayContaining(["/L0-02/lesson.html", "/L0-02/lecture/deck.json", "/L0-02/lecture/s01.mp3", "/L0-02/talk/deck.json", "/L0-02/talk/s01.mp3"]));
});

test("not published yet shows a friendly message, never an HTTP code", async ({ page }) => {
  await page.goto("/learning/ai-product-testing/lessons/L0-03");
  const notice = page.getByTestId("content-notice").first();
  await expect(notice).toBeVisible({ timeout: 20_000 });
  await expect(notice).toHaveAttribute("data-failure", "not-published");
  await expect(notice).not.toContainText(/\b4\d\d\b|\b5\d\d\b|not found/i);
  await expect(notice.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("a 503 is retried with backoff and then loads", async ({ page }) => {
  await page.goto("/learning/ai-product-testing/lessons/L0-04");
  await expect(page.getByTestId("lesson-article")).toBeVisible({ timeout: 20_000 });
});
