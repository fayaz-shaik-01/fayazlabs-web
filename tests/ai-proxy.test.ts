import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as chatPost } from "../src/app/api/chat/route";
import { POST as lessonPost } from "../src/app/api/lesson/query/route";
import { getBearerToken } from "../src/lib/ai-proxy";

type Call = { url: string; init: RequestInit };
let calls: Call[] = [];
const realFetch = globalThis.fetch;

beforeEach(() => {
  calls = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ success: true, data: { answer: "ok" } }), { status: 200 });
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const req = (path: string, body: unknown, auth?: string) =>
  new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
    body: JSON.stringify(body),
  });

describe("getBearerToken", () => {
  test("accepts a bearer token and rejects everything else", () => {
    const h = (v?: string) => new Request("http://x", { headers: v ? { authorization: v } : {} });
    assert.equal(getBearerToken(h("Bearer abc.def-ghi_1")), "abc.def-ghi_1");
    assert.equal(getBearerToken(h("bearer abc")), "abc");
    assert.equal(getBearerToken(h()), null);
    assert.equal(getBearerToken(h("Basic abc")), null);
    assert.equal(getBearerToken(h("Bearer ")), null);
    assert.equal(getBearerToken(h("Bearer a b")), null);
  });
});

describe("/api/chat proxy", () => {
  test("401 in the standard error shape, and no upstream call, without a token", async () => {
    const res = await chatPost(req("/api/chat", { query: "hi" }));
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.code, "UNAUTHORIZED");
    assert.equal(calls.length, 0);
  });

  test("forwards the caller's bearer token upstream", async () => {
    const res = await chatPost(req("/api/chat", { query: "hi" }, "Bearer tok123"));
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith("/api/chat/query"));
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer tok123");
  });

  test("LESSON_MENTOR goes to the lesson endpoint, not /ai/rag/query", async () => {
    const ctx = { lesson_slug: "a/b", phase: 1, tags: [], has_authored_content: true };
    await chatPost(req("/api/chat", { query: "hi", queryType: "LESSON_MENTOR", lessonContext: ctx }, "Bearer t"));
    assert.ok(calls[0].url.endsWith("/api/lesson/query"));
    assert.ok(!calls[0].url.includes("/ai/rag"));
    const sent = JSON.parse(String(calls[0].init.body));
    assert.equal(sent.mode, "LESSON_MENTOR");
    assert.equal(sent.lessonContext.lesson_slug, "a/b");
  });

  test("LESSON_MENTOR without a lesson slug is a 400", async () => {
    const res = await chatPost(req("/api/chat", { query: "hi", queryType: "LESSON_MENTOR" }, "Bearer t"));
    assert.equal(res.status, 400);
    assert.equal(calls.length, 0);
  });
});

describe("/api/lesson/query proxy", () => {
  const ctx = { lesson_slug: "a/b", phase: 1, tags: [], has_authored_content: true };

  test("401 without a token", async () => {
    const res = await lessonPost(req("/api/lesson/query", { query: "hi", lessonContext: ctx }));
    assert.equal(res.status, 401);
    assert.equal(calls.length, 0);
  });

  test("forwards the bearer token", async () => {
    const res = await lessonPost(req("/api/lesson/query", { query: "hi", lessonContext: ctx }, "Bearer tok9"));
    assert.equal(res.status, 200);
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer tok9");
  });
});
