/**
 * Content layout, encryption and deck.json schema.
 * Source of truth: docs/CONTENT_FORMAT.md and docs/MEDIA_FORMAT.md in the
 * private course repo (pasted by the owner on 2026-11-09).
 *
 * Free items (public bucket, plain):
 *   <base>/<ITEM>/lesson.html
 *   <base>/<ITEM>/lecture/deck.json, lecture/s01.mp3 ...
 *   <base>/<ITEM>/talk/deck.json,    talk/s01.mp3 ...
 * Paid items (private bucket, encrypted, signed query from the grant):
 *   <base>/paid/<ITEM>/lesson.html.enc, lecture/deck.json.enc, lecture/s01.enc ...
 * Encryption: AES-256-GCM, file = IV(12) | ciphertext | tag(16), key = base64
 * from the grant, AAD = "<ITEM>/<plaintext path>", e.g. "L2-05/lecture/s03.mp3".
 */

export const IV_BYTES = 12;

export type PlayerMode = "lecture" | "conversation";

/** Folder inside an item for each mode. */
export const MODE_FOLDER: Record<PlayerMode, "lecture" | "talk"> = {
  lecture: "lecture",
  conversation: "talk",
};

export interface Cue {
  speaker: string;
  part?: string; // "main" | "question" | "answer"
  /** Seconds from the start of the slide's audio file. */
  start: number;
  end: number;
  text: string;
}

export interface SlideQuiz {
  question_end: number;
  answer_start: number;
}

export interface Slide {
  index: number;
  kind: string;
  /** The visible slide fields, as in the course YAML. */
  content: Record<string, unknown>;
  audio: { file: string; duration: number };
  cues: Cue[];
  quiz?: SlideQuiz;
  key?: string;
}

export interface Speaker {
  name: string;
  role?: string;
}

export interface Deck {
  /** "lecture" or "talk": the folder the deck and its audio live in. */
  folder: "lecture" | "talk";
  id: string;
  mode: PlayerMode;
  title?: string;
  thinkSeconds: number;
  speakers: Record<string, Speaker>;
  totalSeconds: number;
  slides: Slide[];
}

/** Path of a file relative to the item folder, always the plaintext name. */
export const deckPath = (folder: Deck["folder"]) => `${folder}/deck.json`;
export const slideAudioPath = (deck: Pick<Deck, "folder">, slide: Pick<Slide, "audio">) =>
  `${deck.folder}/${slide.audio.file}`;
/** The first slide's audio is always s01.mp3 in the deck's folder, so it can be fetched before deck.json arrives. */
export const firstAudioGuess = (folder: Deck["folder"]) => `${folder}/s01.mp3`;

/** AAD: "<ITEM>/<plaintext path>". */
export function aadFor(itemId: string, relPath: string): string {
  return `${itemId}/${relPath}`;
}

export interface ContentSource {
  itemId: string;
  encrypted: boolean;
  baseUrl: string; // no trailing slash
  query: string; // "" or "a=b" (with or without leading "?")
  key: string | null;
}

/** Stored object name: paid files get .enc, and the audio's .mp3 becomes .enc. */
export function storedName(relPath: string, encrypted: boolean): string {
  if (!encrypted) return relPath;
  return relPath.endsWith(".mp3") ? relPath.replace(/\.mp3$/, ".enc") : `${relPath}.enc`;
}

export function fileUrl(src: ContentSource, relPath: string): string {
  const root = src.encrypted ? `${src.baseUrl}/paid/${src.itemId}` : `${src.baseUrl}/${src.itemId}`;
  const q = src.query ? `?${src.query.replace(/^\?/, "")}` : "";
  return `${root}/${storedName(relPath, src.encrypted)}${q}`;
}

const num = (v: unknown, name: string): number => {
  if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`Deck field ${name} is not a number`);
  return v;
};

export function parseDeck(raw: unknown, folder: Deck["folder"]): Deck {
  const d = raw as Record<string, unknown> | null;
  if (!d || typeof d !== "object" || !Array.isArray(d.slides) || d.slides.length === 0) {
    throw new Error("Deck has no slides");
  }
  const slides: Slide[] = (d.slides as Record<string, unknown>[]).map((s, i) => {
    const audio = s?.audio as Record<string, unknown> | undefined;
    if (!audio || typeof audio.file !== "string") throw new Error(`Slide ${i + 1} has no audio file`);
    const cues = (Array.isArray(s.cues) ? (s.cues as Cue[]) : [])
      .map((c) => ({ speaker: String(c.speaker ?? ""), part: c.part, start: num(c.start, "cue.start"), end: num(c.end, "cue.end"), text: String(c.text ?? "") }))
      .sort((a, b) => a.start - b.start);
    const q = s.quiz as Record<string, unknown> | undefined;
    return {
      index: typeof s.index === "number" ? s.index : i + 1,
      kind: String(s.kind ?? ""),
      content: (s.content && typeof s.content === "object" ? s.content : {}) as Record<string, unknown>,
      audio: { file: audio.file, duration: num(audio.duration, "audio.duration") },
      cues,
      quiz: q ? { question_end: num(q.question_end, "quiz.question_end"), answer_start: num(q.answer_start, "quiz.answer_start") } : undefined,
      key: typeof s.key === "string" ? s.key : undefined,
    };
  });
  const speakers = (d.speakers && typeof d.speakers === "object" ? d.speakers : {}) as Record<string, Speaker>;
  return {
    folder,
    id: String(d.id ?? ""),
    mode: d.mode === "conversation" ? "conversation" : "lecture",
    title: typeof d.title === "string" ? d.title : undefined,
    thinkSeconds: typeof d.think_seconds === "number" ? d.think_seconds : 6,
    speakers,
    totalSeconds: typeof d.total_seconds === "number" ? d.total_seconds : slides.reduce((a, s) => a + s.audio.duration, 0),
    slides,
  };
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}
