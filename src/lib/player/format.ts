/**
 * Everything the player assumes about the content layout and encryption lives
 * in this file, so it can be checked against the real contract in one place.
 *
 * ASSUMED CONTRACT (not verified against the private content spec):
 *  - Free items:   <base>/<ITEM>/lesson.html, deck.json, audio/<file>
 *  - Paid items:   <base>/paid/<ITEM>/<file>.enc + the grant's signed query
 *  - .enc file:    12-byte IV, then AES-256-GCM ciphertext with the 16-byte tag
 *                  appended (the Web Crypto layout)
 *  - key:          base64 AES-256 key from the grant
 *  - AAD:          UTF-8 of "<ITEM>/<relative path without .enc>"
 *  - deck.json:    see Deck below
 */

export const IV_BYTES = 12;

export type PlayerMode = "lecture" | "conversation";

export interface Caption {
  /** Seconds from the start of the slide's audio. */
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface Quiz {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

export interface Slide {
  id: string;
  title?: string;
  /** Path relative to the item folder, e.g. "audio/01.mp3". */
  audio: string;
  captions: Caption[];
  quiz?: Quiz;
}

export interface Deck {
  mode: PlayerMode;
  title?: string;
  speakers?: string[];
  slides: Slide[];
}

export function aadFor(itemId: string, relPath: string): string {
  return `${itemId}/${relPath.replace(/\.enc$/, "")}`;
}

export interface ContentSource {
  itemId: string;
  encrypted: boolean;
  baseUrl: string; // no trailing slash
  query: string; // "" or "?x=y" style without the "?"
  key: string | null;
}

export function fileUrl(src: ContentSource, relPath: string): string {
  const root = src.encrypted ? `${src.baseUrl}/paid/${src.itemId}` : `${src.baseUrl}/${src.itemId}`;
  const file = src.encrypted ? `${relPath}.enc` : relPath;
  const q = src.query ? `?${src.query.replace(/^\?/, "")}` : "";
  return `${root}/${file}${q}`;
}

export function parseDeck(raw: unknown): Deck {
  const d = raw as Partial<Deck> | null;
  if (!d || !Array.isArray(d.slides) || d.slides.length === 0) throw new Error("Deck has no slides");
  const slides = d.slides.map((s, i) => {
    if (!s || typeof s.audio !== "string") throw new Error(`Slide ${i} has no audio`);
    return {
      id: String(s.id ?? i + 1),
      title: s.title,
      audio: s.audio,
      captions: Array.isArray(s.captions) ? [...s.captions].sort((a, b) => a.start - b.start) : [],
      quiz: s.quiz,
    } as Slide;
  });
  return {
    mode: d.mode === "conversation" ? "conversation" : "lecture",
    title: d.title,
    speakers: d.speakers,
    slides,
  };
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}
