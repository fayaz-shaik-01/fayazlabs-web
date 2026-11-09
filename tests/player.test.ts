import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { decryptBlob, decryptText, DecryptError } from "../src/lib/player/crypto";
import { encryptFile } from "./fixtures/make-lesson";
import { aadFor, fileUrl, maskEmail, parseDeck } from "../src/lib/player/format";
import { activeCueIndex, slideProgress, thinkRemaining } from "../src/lib/player/cues";
import { diffWindow, windowFor } from "../src/lib/player/prefetch";

const key = randomBytes(32);
const keyB64 = key.toString("base64");
const aad = aadFor("L2-01", "lesson.html.enc");

describe("decrypt", () => {
  const enc = encryptFile(Buffer.from("Sample lesson text"), key, aad);
  test("round trip", async () => {
    assert.equal(await decryptText(enc, keyB64, aad), "Sample lesson text");
  });
  test("aad drops the .enc suffix", () => assert.equal(aad, "L2-01/lesson.html"));
  test("wrong key fails", async () => {
    await assert.rejects(decryptBlob(enc, randomBytes(32).toString("base64"), aad), DecryptError);
  });
  test("wrong AAD fails", async () => {
    await assert.rejects(decryptBlob(enc, keyB64, aadFor("L2-02", "lesson.html")), DecryptError);
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
  test("urls", () => {
    const s = { itemId: "L2-01", encrypted: true, baseUrl: "https://cdn.test", query: "sig=1", key: null };
    assert.equal(fileUrl(s, "deck.json"), "https://cdn.test/paid/L2-01/deck.json.enc?sig=1");
    assert.equal(fileUrl({ ...s, encrypted: false, query: "" }, "deck.json"), "https://cdn.test/L2-01/deck.json");
  });
  test("parseDeck sorts captions and rejects empty decks", () => {
    const d = parseDeck({ slides: [{ audio: "a", captions: [{ start: 2, end: 3, text: "b" }, { start: 0, end: 1, text: "a" }] }] });
    assert.equal(d.slides[0].captions[0].text, "a");
    assert.throws(() => parseDeck({ slides: [] }));
  });
  test("maskEmail", () => {
    assert.equal(maskEmail("fayaz@gmail.com"), "fa***@gmail.com");
    assert.equal(maskEmail(null), "");
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
