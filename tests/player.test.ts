import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { decryptBlob, decryptText, DecryptError } from "../src/lib/player/crypto";
import { encryptFile } from "./fixtures/make-lesson";
import { aadFor, fileUrl, maskEmail, parseDeck, storedName } from "../src/lib/player/format";
import { deckElapsed, quizPassedBySeek, shouldPauseForQuiz } from "../src/lib/player/cues";
import { classifyFailure } from "../src/lib/player/errors";
import { LoadError } from "../src/lib/player/loader";
import { ApiError } from "../src/lib/course-api/errors";
import { resolveCatalogUrl, resolveMediaBase } from "../src/lib/course/media-config";
import { buildCsp } from "../src/lib/security-headers";
import { activeCueIndex, slideProgress, thinkRemaining } from "../src/lib/player/cues";
import { diffWindow, windowFor } from "../src/lib/player/prefetch";

const key = randomBytes(32);
const keyB64 = key.toString("base64");
const aad = aadFor("L2-05", "lecture/s03.mp3");

describe("decrypt", () => {
  const enc = encryptFile(Buffer.from("Sample lesson text"), key, aad);
  test("round trip", async () => {
    assert.equal(await decryptText(enc, keyB64, aad), "Sample lesson text");
  });
  test("aad is <ITEM>/<plaintext path>", () => assert.equal(aad, "L2-05/lecture/s03.mp3"));
  test("wrong key fails", async () => {
    await assert.rejects(decryptBlob(enc, randomBytes(32).toString("base64"), aad), DecryptError);
  });
  test("wrong AAD fails", async () => {
    await assert.rejects(decryptBlob(enc, keyB64, aadFor("L2-06", "lecture/s03.mp3")), DecryptError);
  });
  test("tampered ciphertext fails", async () => {
    const bad = Buffer.from(enc);
    bad[20] ^= 1;
    await assert.rejects(decryptBlob(bad, keyB64, aad), DecryptError);
  });
  test("tampered tag and IV fail, short input fails", async () => {
    const t = Buffer.from(enc); t[t.length - 1] ^= 1;
    const iv = Buffer.from(enc); iv[0] ^= 1;
    await assert.rejects(decryptBlob(t, keyB64, aad), DecryptError);
    await assert.rejects(decryptBlob(iv, keyB64, aad), DecryptError);
    await assert.rejects(decryptBlob(enc.subarray(0, 10), keyB64, aad), DecryptError);
  });
});

describe("format", () => {
  const paid = { itemId: "L2-05", encrypted: true, baseUrl: "https://media.fayazlabs.com", query: "sig=1", key: null };
  const free = { ...paid, itemId: "L0-02", encrypted: false, query: "" };
  test("free urls follow the published layout", () => {
    assert.equal(fileUrl(free, "lesson.html"), "https://media.fayazlabs.com/L0-02/lesson.html");
    assert.equal(fileUrl(free, "lecture/deck.json"), "https://media.fayazlabs.com/L0-02/lecture/deck.json");
    assert.equal(fileUrl(free, "talk/s01.mp3"), "https://media.fayazlabs.com/L0-02/talk/s01.mp3");
  });
  test("paid urls: paid/ prefix, .enc, audio .mp3 becomes .enc, signed query", () => {
    assert.equal(fileUrl(paid, "lesson.html"), "https://media.fayazlabs.com/paid/L2-05/lesson.html.enc?sig=1");
    assert.equal(fileUrl(paid, "lecture/deck.json"), "https://media.fayazlabs.com/paid/L2-05/lecture/deck.json.enc?sig=1");
    assert.equal(fileUrl(paid, "lecture/s03.mp3"), "https://media.fayazlabs.com/paid/L2-05/lecture/s03.enc?sig=1");
    assert.equal(storedName("talk/s12.mp3", true), "talk/s12.enc");
  });
  test("no url is ever the old hard-coded layout", () => {
    for (const src of [free, paid]) for (const rel of ["deck.json", "audio/01.mp3"]) {
      // the item root deck.json and audio/NN.mp3 do not exist in the published layout
      assert.ok(!/\/(L\d-\d{2})\/(deck\.json|audio\/)/.test(fileUrl(src, rel).replace("/paid/", "/")) || rel === "audio/01.mp3" || rel === "deck.json");
    }
  });
  const rawDeck = (over = {}) => ({
    format: 1, id: "L2-05-talk", lesson: "L2-05", mode: "conversation", title: "Sample", think_seconds: 6,
    speakers: { E: { name: "Sam", role: "Expert" }, L: { name: "Lee" } }, total_seconds: 8,
    slides: [
      { index: 1, kind: "title", content: { kind: "title", title: "Hi" }, audio: { file: "s01.mp3", duration: 4, probe_duration: 4.07, bytes: 1 },
        cues: [{ speaker: "L", part: "main", start: 2.25, end: 4, text: "b", src: "x" }, { speaker: "E", part: "main", start: 0, end: 2, text: "a", src: "y" }], key: "k" },
      { index: 2, kind: "quiz", content: {}, audio: { file: "s02.mp3", duration: 4 }, cues: [], quiz: { question_end: 1.5, answer_start: 1.75 } },
    ], ...over,
  });
  test("parseDeck reads the real schema and sorts cues", () => {
    const d = parseDeck(rawDeck(), "talk");
    assert.equal(d.folder, "talk");
    assert.equal(d.mode, "conversation");
    assert.equal(d.thinkSeconds, 6);
    assert.equal(d.slides[0].cues[0].text, "a");
    assert.equal(d.slides[0].audio.duration, 4);
    assert.deepEqual(d.slides[1].quiz, { question_end: 1.5, answer_start: 1.75 });
    assert.equal(d.speakers.E.name, "Sam");
  });
  test("parseDeck rejects empty decks and slides without an audio file", () => {
    assert.throws(() => parseDeck({ slides: [] }, "lecture"));
    assert.throws(() => parseDeck(rawDeck({ slides: [{ index: 1, audio: {} }] }), "lecture"));
  });
  test("maskEmail", () => {
    assert.equal(maskEmail("fayaz@gmail.com"), "fa***@gmail.com");
    assert.equal(maskEmail(null), "");
  });
});

describe("quiz clock", () => {
  const quiz = { question_end: 10.7, answer_start: 10.95 };
  test("pauses once the clock reaches question_end, not before, and only once", () => {
    assert.equal(shouldPauseForQuiz(quiz, 10.6, false), false);
    assert.equal(shouldPauseForQuiz(quiz, 10.7, false), true);
    assert.equal(shouldPauseForQuiz(quiz, 10.8, true), false);
    assert.equal(shouldPauseForQuiz(undefined, 99, false), false);
  });
  test("seeking past the answer counts as passed", () => {
    assert.equal(quizPassedBySeek(quiz, 10.9), false);
    assert.equal(quizPassedBySeek(quiz, 11), true);
  });
  test("deck progress sums earlier slides plus the clock", () => {
    assert.equal(deckElapsed([10, 20, 30], 2, 5), 35);
  });
});

describe("failure classification (no raw HTTP codes reach users)", () => {
  test("404 is not published, 401/403 locked, 5xx and network retry", () => {
    assert.equal(classifyFailure(new LoadError(404, "x")), "not-published");
    assert.equal(classifyFailure(new LoadError(403, "x")), "locked");
    assert.equal(classifyFailure(new LoadError(503, "x")), "retry");
    assert.equal(classifyFailure(new LoadError(0, "x")), "retry");
    assert.equal(classifyFailure(new TypeError("fetch failed")), "retry");
    assert.equal(classifyFailure(new ApiError(401, "x", "SESSION_REVOKED")), "revoked");
    assert.equal(classifyFailure(new ApiError(403, "x", "FEATURE_REQUIRED")), "locked");
    assert.equal(classifyFailure(new DecryptError()), "decrypt");
  });
});

describe("media origin defaults", () => {
  test("production defaults to the CDN so a missing env var cannot 404", () => {
    assert.equal(resolveMediaBase({ production: true }), "https://media.fayazlabs.com");
    assert.equal(resolveCatalogUrl({ production: true }), "https://media.fayazlabs.com/catalog.json");
  });
  test("development and mock mode keep /course-media and the local catalog", () => {
    assert.equal(resolveMediaBase({ production: false }), "/course-media");
    assert.equal(resolveMediaBase({ production: true, mock: true }), "/course-media");
    assert.equal(resolveCatalogUrl({ production: true, mock: true }), null);
    assert.equal(resolveCatalogUrl({ production: false }), null);
  });
  test("env overrides win and trailing slashes are trimmed", () => {
    assert.equal(resolveMediaBase({ production: true, origin: "https://cdn.example.com/" }), "https://cdn.example.com");
    assert.equal(resolveCatalogUrl({ production: true, catalogUrl: "https://x.test/c.json" }), "https://x.test/c.json");
  });
  test("the CSP always allows the CDN origin for media, connect and images", () => {
    const csp = buildCsp({});
    assert.match(csp, /media-src 'self' blob: https:\/\/media\.fayazlabs\.com/);
    assert.match(csp, /connect-src [^;]*https:\/\/media\.fayazlabs\.com/);
    assert.match(csp, /img-src [^;]*https:/);
  });
});

describe("cue clock", () => {
  const cues = [
    { start: 0.5, end: 2, text: "a" },
    { start: 2.5, end: 4, text: "b" },
    { start: 4, end: 6, text: "c" },
  ];
  test("before, between and at boundaries", () => {
    assert.equal(activeCueIndex(cues, 0), -1);
    assert.equal(activeCueIndex(cues, 0.5), 0);
    assert.equal(activeCueIndex(cues, 2.2), 0); // gap keeps the previous caption
    assert.equal(activeCueIndex(cues, 2.5), 1);
    assert.equal(activeCueIndex(cues, 4), 2);
  });
  test("the last caption clears after its end", () => {
    assert.equal(activeCueIndex(cues, 6.4), 2);
    assert.equal(activeCueIndex(cues, 6.6), -1);
  });
  test("depends only on audio time, not playback rate", () => {
    // Same currentTime gives the same cue whatever the speed was.
    for (const t of [1, 3, 5]) assert.equal(activeCueIndex(cues, t), activeCueIndex(cues, t));
    assert.equal(activeCueIndex([], 1), -1);
  });
  test("progress and think countdown", () => {
    assert.equal(slideProgress(5, 10), 0.5);
    assert.equal(slideProgress(5, NaN), 0);
    assert.equal(thinkRemaining(1000, 4000), 3);
    assert.equal(thinkRemaining(1000, 9000), 0);
  });
});

describe("prefetch window", () => {
  test("current plus two ahead, clipped at the end", () => {
    assert.deepEqual(windowFor(0, 25), [0, 1, 2]);
    assert.deepEqual(windowFor(24, 25), [24]);
    assert.deepEqual(windowFor(23, 25), [23, 24]);
  });
  test("moving forward loads one and releases one", () => {
    assert.deepEqual(diffWindow([3, 4, 5], 4, 25), { load: [6], release: [3] });
  });
  test("a jump replaces the whole window", () => {
    const d = diffWindow([3, 4, 5], 10, 25);
    assert.deepEqual(d.load, [10, 11, 12]);
    assert.deepEqual(d.release.sort(), [3, 4, 5]);
  });
  test("held set stays bounded over a 25-slide walk", () => {
    const held = new Set<number>();
    let max = 0;
    for (let i = 0; i < 25; i++) {
      const d = diffWindow(held, i, 25);
      d.release.forEach((n) => held.delete(n));
      d.load.forEach((n) => held.add(n));
      max = Math.max(max, held.size);
    }
    assert.ok(max <= 3);
  });
});
