/**
 * Builds SYNTHETIC lessons in the REAL published layout (docs/CONTENT_FORMAT.md,
 * docs/MEDIA_FORMAT.md): invented text, ffmpeg tones, no course content.
 *
 *   free : <root>/<ITEM>/lesson.html, <ITEM>/{lecture,talk}/deck.json, sNN.mp3
 *   paid : <root>/paid/<ITEM>/lesson.html.enc, {lecture,talk}/deck.json.enc, sNN.enc
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
  outDir: string;
  itemId: string;
  paid: boolean;
  slides: number;
  /** Seconds of tone per cue. Each slide has two cues separated by 250 ms of silence. */
  cueSeconds: number;
  /** Slide number (1-based) that is a quiz slide in each mode. */
  quizSlide?: number;
  fixedKey?: Buffer;
}

const PAUSE = 0.25;
const SR = 24000;

function slideAudio(file: string, cueSeconds: number, freq: number) {
  // tone, 250 ms silence, tone -> one mono 48 kbps mp3 at 24 kHz, like the real pipeline.
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "lavfi", "-i", `sine=frequency=${freq}:duration=${cueSeconds}:sample_rate=${SR}`,
    "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono:d=${PAUSE}`,
    "-f", "lavfi", "-i", `sine=frequency=${freq + 80}:duration=${cueSeconds}:sample_rate=${SR}`,
    "-filter_complex", "[0][1][2]concat=n=3:v=0:a=1",
    "-ac", "1", "-b:a", "48k", "-ar", String(SR), file,
  ]);
}

export function makeLessonFixture(o: FixtureOptions) {
  const key = o.fixedKey ?? randomBytes(32);
  const itemRoot = path.join(o.outDir, o.paid ? "paid" : "", o.itemId);
  rmSync(itemRoot, { recursive: true, force: true });
  const write = (rel: string, data: Buffer, isAudio = false) => {
    const stored = o.paid ? (isAudio ? rel.replace(/\.mp3$/, ".enc") : `${rel}.enc`) : rel;
    const dest = path.join(itemRoot, stored);
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, o.paid ? encryptFile(data, key, aadFor(o.itemId, rel)) : data);
  };

  const decks: Record<string, unknown> = {};
  for (const [mode, folder] of [["lecture", "lecture"], ["conversation", "talk"]] as const) {
    const slides = Array.from({ length: o.slides }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      const tmp = path.join(o.outDir, `tmp-${o.itemId}-${folder}-${n}.mp3`);
      slideAudio(tmp, o.cueSeconds, 300 + i * 30);
      const bytes = readFileSync(tmp);
      rmSync(tmp);
      const file = `s${n}.mp3`;
      write(`${folder}/${file}`, bytes, true);
      const c = o.cueSeconds;
      const isQuiz = o.quizSlide === i + 1;
      const sp = mode === "lecture" ? ["narrator", "narrator"] : ["E", "L"];
      const duration = +(2 * c + PAUSE).toFixed(3);
      return {
        index: i + 1,
        kind: isQuiz ? "quiz" : "bullets",
        content: { kind: isQuiz ? "quiz" : "bullets", title: `Sample slide ${i + 1}`, bullets: [`Sample point ${i + 1}a`, `Sample point ${i + 1}b`] },
        audio: { file, duration, probe_duration: +(duration + 0.07).toFixed(3), bytes: bytes.length },
        cues: [
          { speaker: sp[0], part: isQuiz ? "question" : "main", start: 0, end: c, text: `Sample caption ${i + 1}a`, src: `s${n}_01.mp3` },
          { speaker: sp[1], part: isQuiz ? "answer" : "main", start: +(c + PAUSE).toFixed(3), end: duration, text: `Sample caption ${i + 1}b`, src: `s${n}_02.mp3` },
        ],
        ...(isQuiz ? { quiz: { question_end: c, answer_start: +(c + PAUSE).toFixed(3) } } : {}),
        key: "0123456789ab",
      };
    });
    const total = slides.reduce((a, s) => a + s.audio.duration, 0);
    const deck = {
      format: 1, id: mode === "lecture" ? o.itemId : `${o.itemId}-talk`, lesson: o.itemId, mode: mode,
      title: "Sample lesson", sample_rate: SR, bitrate: "48k", pause_ms: 250, think_seconds: 6,
      speakers: mode === "lecture" ? { narrator: { name: "Narrator", role: "Narrator" } } : { E: { name: "Sam", role: "Expert" }, L: { name: "Lee", role: "Learner" } },
      total_seconds: +total.toFixed(2), slides,
    };
    decks[mode] = deck;
    write(`${folder}/deck.json`, Buffer.from(JSON.stringify(deck)));
  }
  write("lesson.html", Buffer.from(`<h2>Sample lesson</h2><p>Invented body text. <a href="/learning/ai-product-testing">Course home</a></p><div class="callout"><p>Sample callout</p></div><img src=x onerror="window.__xss=1"><script>window.__xss=1</script><iframe src="about:blank"></iframe><form><input></form>`));
  return { key, keyB64: key.toString("base64"), decks };
}
