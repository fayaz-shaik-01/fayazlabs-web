/**
 * Builds a SYNTHETIC encrypted lesson (invented text, ffmpeg sine tones) in
 * the layout assumed by src/lib/player/format.ts. No real course content.
 */
import { createCipheriv, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import path from "node:path";
import { aadFor } from "../../src/lib/player/format";

export function encryptFile(plain: Buffer, key: Buffer, aad: string): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  c.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([iv, ct, c.getAuthTag()]);
}

export interface FixtureOptions {
  outDir: string; // served root; files land in <outDir>/paid/<item>/
  itemId: string;
  slides: number;
  slideSeconds: number;
  withQuiz?: boolean;
}

export function makeLessonFixture(o: FixtureOptions) {
  const key = randomBytes(32);
  const dir = path.join(o.outDir, "paid", o.itemId);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(path.join(dir, "audio"), { recursive: true });
  const put = (rel: string, data: Buffer) => writeFileSync(path.join(dir, `${rel}.enc`), encryptFile(data, key, aadFor(o.itemId, rel)));

  const slides = Array.from({ length: o.slides }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    const tmp = path.join(dir, `tmp-${n}.mp3`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `sine=frequency=${300 + i * 40}:duration=${o.slideSeconds}`, "-ac", "1", "-b:a", "48k", tmp]);
    put(`audio/${n}.mp3`, readFileSync(tmp));
    rmSync(tmp);
    const half = o.slideSeconds / 2;
    const quiz = o.withQuiz && i === 1 ? { question: "Sample question?", options: ["Option A", "Option B"], answerIndex: 1, explanation: "Sample explanation." } : undefined;
    return {
      id: `s${n}`,
      title: `Sample slide ${i + 1}`,
      audio: `audio/${n}.mp3`,
      captions: [
        { start: 0.2, end: half, text: `Sample caption ${i + 1}a`, speaker: "Host" },
        { start: half, end: o.slideSeconds, text: `Sample caption ${i + 1}b`, speaker: "Guest" },
      ],
      quiz,
    };
  });
  const deck = { mode: "conversation", title: "Sample lesson", speakers: ["Host", "Guest"], slides };
  put("deck.json", Buffer.from(JSON.stringify(deck)));
  put("lesson.html", Buffer.from(`<h2>Sample lesson</h2><p>Invented body text. <a href="/learning/ai-product-testing">Course home</a></p><div class="callout"><p>Sample callout</p></div><img src=x onerror="window.__xss=1"><script>window.__xss=1</script><iframe src="about:blank"></iframe><form><input></form>`));
  return { key, keyB64: key.toString("base64"), deck, dir };
}
