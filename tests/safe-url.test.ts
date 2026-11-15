import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { isInternalPath, safeExternalHref, safeChatHref, sourceHref, safeNextPath } from "../src/lib/safe-url";
import { inline } from "../src/components/chat/chat-message";

const ORIGIN = "https://fayazlabs.com";
const html = (text: string) => renderToStaticMarkup(createElement(Fragment, null, ...inline(text)));

describe("isInternalPath", () => {
  test("accepts single-slash paths", () => {
    for (const p of ["/", "/learning", "/projects/x?a=1#h"]) assert.equal(isInternalPath(p), true, p);
  });
  test("rejects protocol-relative, backslash and control-char tricks", () => {
    for (const p of ["//evil.example", "/\\evil.example", "/\t/evil.example", "/\n/evil.example", "\\\\evil.example", "evil.example", "javascript:alert(1)", "https://evil.example"]) {
      assert.equal(isInternalPath(p), false, JSON.stringify(p));
    }
  });
});

describe("safeExternalHref", () => {
  test("allows https on allow-listed hosts only", () => {
    assert.ok(safeExternalHref("https://github.com/fayaz"));
    assert.ok(safeExternalHref("https://fayazlabs.com/x"));
    for (const u of ["http://github.com", "https://evil.example", "https://github.com.evil.example", "https://github.com@evil.example/", "https://user:pw@github.com/", "javascript:alert(1)", "data:text/html,x", "https://evil.example\\@github.com"]) {
      assert.equal(safeExternalHref(u), null, u);
    }
  });
  test("safeChatHref marks external links", () => {
    assert.deepEqual(safeChatHref("/learning"), { href: "/learning", external: false });
    assert.equal(safeChatHref("https://github.com/a")?.external, true);
    assert.equal(safeChatHref("//evil.example"), null);
  });
});

describe("sourceHref", () => {
  test("builds an on-site path from a plain slug", () => {
    assert.equal(sourceHref("learning/ai/intro"), "/learning/ai/intro");
    assert.equal(sourceHref("/learning/intro"), "/learning/intro");
  });
  test("rejects anything outside ^[a-z0-9/_-]+$ and never yields //", () => {
    for (const s of ["", "A/b", "a b", "a.b", "a?x=1", "javascript:x", "evil.example", "a\\b", "https://evil.example"]) assert.equal(sourceHref(s), null, s);
    assert.equal(sourceHref("//evil"), "/evil");
    assert.equal(sourceHref("///"), null);
  });
});

describe("chat link rendering", () => {
  test("renders safe links, with new-tab rel for external ones", () => {
    const a = html("see [lessons](/learning)");
    assert.match(a, /<a href="\/learning"/);
    assert.doesNotMatch(a, /target=/);
    const b = html("[code](https://github.com/x/y)");
    assert.match(b, /href="https:\/\/github.com\/x\/y"/);
    assert.match(b, /target="_blank"/);
    assert.match(b, /rel="noopener noreferrer"/);
  });
  test("malicious links become plain text", () => {
    for (const bad of ["[click](//evil.example)", "[click](/\\evil.example)", "[click](https://evil.example/x)", "https://evil.example/x"]) {
      const out = html(bad);
      assert.doesNotMatch(out, /<a /, bad);
    }
    assert.match(html("[click](//evil.example)"), /click/);
  });
});

describe("safeNextPath", () => {
  test("keeps same-origin paths", () => {
    assert.equal(safeNextPath("/learning", ORIGIN), "/learning");
    assert.equal(safeNextPath("/account?tab=x#y", ORIGIN), "/account?tab=x#y");
    assert.equal(safeNextPath("/", ORIGIN), "/");
  });
  test("rejects open-redirect payloads", () => {
    for (const n of ["//evil.com", "/\\evil.com", "/\t/evil.com", "\\\\evil.com", "https://evil.com", "http://fayazlabs.com/x", "javascript:alert(1)", "evil.com", "", null, undefined]) {
      assert.equal(safeNextPath(n, ORIGIN), "/", String(n));
    }
  });
  test("honours a custom fallback", () => {
    assert.equal(safeNextPath("//evil.com", ORIGIN, "/home"), "/home");
  });
});
