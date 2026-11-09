import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { parseFlag, getFeatureFlags } from "../src/lib/features";
import { getLockState } from "../src/lib/course/access";
import { parseCatalog, findItem } from "../src/lib/course/catalog";
import fixture from "../src/lib/course/fixtures/catalog.json";
import { buildCsp } from "../src/lib/security-headers";
import { setAuthStorage, saveAuth, getStoredAuth } from "../src/lib/auth/token-store";
import { apiRequest, setTransport, type Transport } from "../src/lib/course-api/client";
import { ApiError } from "../src/lib/course-api/errors";
import { getSessionNotice, setSessionNotice } from "../src/lib/course-api/session-notice";
import { resolveAccess } from "../src/lib/course-api/access";

describe("feature flags", () => {
  test("parseFlag accepts on-values only", () => {
    for (const v of ["1", "true", "TRUE", "on", "yes"]) assert.equal(parseFlag(v), true);
    for (const v of [undefined, "", "0", "false", "off", "nope"]) assert.equal(parseFlag(v), false);
  });
  test("every flag is off by default", () => {
    const flags = getFeatureFlags({});
    assert.ok(Object.values(flags).every((v) => v === false));
    assert.equal(Object.keys(flags).length, 7);
  });
  test("a flag turns on from its env value", () => {
    assert.equal(getFeatureFlags({ flashcards: "1" }).flashcards, true);
    assert.equal(getFeatureFlags({ flashcards: "1" }).practice, false);
  });
});

describe("catalog fixture", () => {
  const catalog = parseCatalog(fixture);
  test("has 4 levels with the agreed feature mapping", () => {
    assert.deepEqual(catalog.levels.map((l) => l.id), ["L0", "L1", "L2", "L3"]);
    for (const level of catalog.levels) {
      for (const item of level.items) {
        const expected = item.kind === "lab" ? "practice.labs" : level.id === "L0" ? "free" : "lessons.paid";
        assert.equal(item.feature, expected, item.id);
      }
    }
    assert.ok(findItem(catalog, "L2-05"));
  });
  test("rejects an unknown feature", () => {
    const bad = structuredClone(fixture) as typeof fixture;
    (bad.lessons[0] as { feature: string }).feature = "bogus";
    assert.throws(() => parseCatalog(bad));
  });
  test("the fixture has the REAL published structure with synthetic titles", () => {
    assert.equal(fixture.schema_version, 1);
    for (const k of ["course", "features", "tiers_example", "levels", "lessons", "labs"]) assert.ok(k in fixture, k);
    assert.equal(fixture.lessons.length, 34);
    const perLevel = Object.fromEntries(fixture.levels.map((l) => [l.id, l.lessons.length]));
    assert.deepEqual(perLevel, { L0: 4, L1: 10, L2: 12, L3: 8 });
    assert.ok(fixture.lessons.every((l) => l.title.startsWith("Sample lesson")));
    for (const k of ["id", "level", "number", "slug", "title", "minutes", "summary", "objectives", "feature", "audio_feature", "decks"]) {
      assert.ok(k in fixture.lessons[0], k);
    }
    for (const k of ["id", "level", "title", "lessons", "files", "size_bytes", "paths", "feature"]) assert.ok(k in fixture.labs[0], k);
  });
  test("maps lessons in level order, then labs as kind lab under their level", () => {
    const c = parseCatalog(fixture);
    const l0 = c.levels[0];
    assert.deepEqual(l0.items.slice(0, 4).map((i) => i.id), ["L0-01", "L0-02", "L0-03", "L0-04"]);
    const lab = l0.items.find((i) => i.kind === "lab");
    assert.ok(lab && lab.feature === "practice.labs" && lab.lessons?.includes("L0-04"));
    assert.equal(c.levels.reduce((n, l) => n + l.items.filter((i) => i.kind === "lesson").length, 0), 34);
    assert.equal(c.levels[0].summary, "Weeks 1-2");
    assert.equal(c.levels[1].items[0].audioFeature, "audio.paid");
    assert.equal(l0.items[1].decks?.conversation, true);
  });
  test("does not fall back: garbage or an old-shape catalog throws", () => {
    assert.throws(() => parseCatalog({ version: 1, course: { slug: "x", title: "t", summary: "" }, levels: [] }));
    assert.throws(() => parseCatalog(null));
  });
});

describe("locked state", () => {
  const free = { feature: "free" as const };
  const paid = { feature: "lessons.paid" as const };
  const lab = { feature: "practice.labs" as const };
  test("free items are open without login", () => {
    assert.deepEqual(getLockState(free, [], false), { locked: false, reason: "none" });
  });
  test("paid items ask anonymous users to sign in", () => {
    assert.deepEqual(getLockState(paid, [], false), { locked: true, reason: "login" });
  });
  test("signed-in users without the feature are told to upgrade", () => {
    assert.deepEqual(getLockState(paid, ["free"], true), { locked: true, reason: "upgrade" });
    assert.deepEqual(getLockState(lab, ["free", "lessons.paid"], true), { locked: true, reason: "upgrade" });
  });
  test("having the feature unlocks it", () => {
    assert.equal(getLockState(paid, ["free", "lessons.paid"], true).locked, false);
    assert.equal(getLockState(lab, ["practice.labs"], true).locked, false);
  });
});

describe("CSP", () => {
  test("the CDN origin is always allowed; an override is added", () => {
    const off = buildCsp({});
    assert.match(off, /media-src 'self' blob: https:\/\/media\.fayazlabs\.com(;|$)/);
    const on = buildCsp({ mediaOrigin: "https://media.example.com/some/path" });
    assert.match(on, /media-src 'self' blob: https:\/\/media\.fayazlabs\.com https:\/\/media\.example\.com(;|$)/);
    assert.match(on, /connect-src [^;]*https:\/\/media\.example\.com/);
  });
  test("ignores a malformed media origin and keeps the strict rules", () => {
    const csp = buildCsp({ mediaOrigin: "not a url" });
    assert.match(csp, /media-src 'self' blob: https:\/\/media\.fayazlabs\.com(;|$)/);
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
  });
  test("allows Razorpay checkout", () => {
    const csp = buildCsp({});
    assert.match(csp, /script-src [^;]*https:\/\/checkout\.razorpay\.com/);
    assert.match(csp, /connect-src [^;]*https:\/\/api\.razorpay\.com/);
  });
});

describe("401 handling", () => {
  const mem = new Map<string, string>();
  let calls: string[];

  beforeEach(() => {
    mem.clear();
    setAuthStorage({
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    });
    setSessionNotice(null);
    calls = [];
    saveAuth({ accessToken: "a1", refreshToken: "r1", sessionId: "s1" });
  });

  const use = (handler: Transport) => {
    setTransport(async (req) => {
      calls.push(`${req.method} ${req.path} ${req.token ?? "-"}`);
      return handler(req);
    });
  };

  test("SESSION_REVOKED clears auth and sets the notice", async () => {
    use(async () => ({ status: 401, body: { code: "SESSION_REVOKED", message: "other device" } }));
    await assert.rejects(() => apiRequest("/auth/heartbeat"), (e: unknown) => e instanceof ApiError && e.code === "SESSION_REVOKED");
    assert.equal(getStoredAuth(), null);
    assert.equal(getSessionNotice(), "revoked");
    assert.equal(calls.length, 1, "does not try to refresh a revoked session");
  });

  test("REFRESH_INVALID clears auth without the revoked notice", async () => {
    use(async () => ({ status: 401, body: { code: "REFRESH_INVALID" } }));
    await assert.rejects(() => apiRequest("/me/access"), (e: unknown) => e instanceof ApiError && e.code === "REFRESH_INVALID");
    assert.equal(getStoredAuth(), null);
    assert.equal(getSessionNotice(), null);
  });

  test("an expired access token is refreshed once and the call retried", async () => {
    use(async (req) => {
      if (req.path === "/auth/refresh") {
        return { status: 200, body: { accessToken: "a2", refreshToken: "r2", sessionId: "s1", expiresIn: 900 } };
      }
      return req.token === "a2" ? { status: 200, body: { features: ["free"], subscription: null } } : { status: 401, body: {} };
    });
    const res = await apiRequest<{ features: string[] }>("/me/access");
    assert.deepEqual(res.features, ["free"]);
    assert.equal(getStoredAuth()?.refreshToken, "r2");
    assert.equal(getStoredAuth()?.sessionId, "s1");
    assert.equal(getSessionNotice(), null);
  });

  test("a refresh answered with SESSION_REVOKED shows the notice", async () => {
    use(async (req) =>
      req.path === "/auth/refresh"
        ? { status: 401, body: { code: "SESSION_REVOKED" } }
        : { status: 401, body: {} },
    );
    await assert.rejects(() => apiRequest("/me/access"), (e: unknown) => e instanceof ApiError && e.code === "SESSION_REVOKED");
    assert.equal(getStoredAuth(), null);
    assert.equal(getSessionNotice(), "revoked");
  });

  test("concurrent 401s share a single refresh request", async () => {
    use(async (req) => {
      if (req.path === "/auth/refresh") {
        await new Promise((r) => setTimeout(r, 10));
        return { status: 200, body: { accessToken: "a2", refreshToken: "r2", expiresIn: 900 } };
      }
      return req.token === "a2" ? { status: 200, body: { ok: true } } : { status: 401, body: {} };
    });
    await Promise.all([apiRequest("/x"), apiRequest("/y"), apiRequest("/z")]);
    assert.equal(calls.filter((c) => c.includes("/auth/refresh")).length, 1);
  });

  test("accepts the legacy { success, data } envelope", async () => {
    use(async () => ({ status: 200, body: { success: true, data: { status: "active" } } }));
    assert.deepEqual(await apiRequest("/auth/heartbeat"), { status: "active" });
  });

  test("403 FEATURE_REQUIRED surfaces code and details without signing out", async () => {
    use(async () => ({ status: 403, body: { code: "FEATURE_REQUIRED", feature: "lessons.paid", upgradeHint: "/pricing" } }));
    await assert.rejects(
      () => apiRequest("/content/grant", { method: "POST", body: { itemId: "L1-01" } }),
      (e: unknown) => e instanceof ApiError && e.code === "FEATURE_REQUIRED" && e.details.feature === "lessons.paid",
    );
    assert.ok(getStoredAuth());
  });
});

describe("access loading", () => {
  test("returns the server features", async () => {
    const s = await resolveAccess(async () => ({ subscription: null, features: ["free", "lessons.paid"] }));
    assert.deepEqual(s, { status: "ready", features: ["free", "lessons.paid"], subscription: null });
  });
  test("falls back to free when the backend lacks the endpoint", async () => {
    const s = await resolveAccess(async () => {
      throw new ApiError(404, "nope");
    });
    assert.equal(s.status, "error");
    assert.deepEqual(s.features, ["free"]);
  });
  test("a 401 means anonymous", async () => {
    const s = await resolveAccess(async () => {
      throw new ApiError(401, "x", "SESSION_REVOKED");
    });
    assert.equal(s.status, "ready");
    assert.deepEqual(s.features, []);
  });
});
