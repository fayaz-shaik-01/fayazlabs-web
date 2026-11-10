import { z } from "zod";
import fixture from "./fixtures/catalog.json";
import { currentMediaEnv, resolveCatalogUrl } from "./media-config";
import type { Catalog, CatalogItem, CatalogLevel } from "./types";

const featureSchema = z.enum(["free", "lessons.paid", "audio.paid", "practice.labs"]);

// The catalog published by the course repo (catalog.schema.json). Extra keys are ignored.
const publishedSchema = z.object({
  schema_version: z.number(),
  course: z.object({ id: z.string(), title: z.string() }),
  levels: z.array(
    z.object({ id: z.string(), title: z.string(), weeks: z.string().default(""), folder: z.string().optional(), lessons: z.array(z.string()) }),
  ),
  lessons: z.array(
    z.object({
      id: z.string(),
      level: z.string(),
      number: z.number().optional(),
      slug: z.string().optional(),
      title: z.string(),
      minutes: z.number().default(0),
      summary: z.string().default(""),
      feature: featureSchema,
      audio_feature: featureSchema.optional(),
      decks: z.object({ lecture: z.unknown().optional(), conversation: z.unknown().optional() }).partial().optional(),
    }),
  ),
  labs: z
    .array(
      z.object({
        id: z.string(),
        level: z.string(),
        title: z.string(),
        lessons: z.array(z.string()).default([]),
        files: z.number().default(0),
        paths: z.array(z.string()).default([]),
        feature: featureSchema,
      }),
    )
    .default([]),
});

/** Map the published catalog onto the internal levels/items model. Labs become items of kind "lab" under their level. */
export function parseCatalog(data: unknown): Catalog {
  const c = publishedSchema.parse(data);
  const lessonById = new Map(c.lessons.map((l) => [l.id, l]));
  const levels: CatalogLevel[] = c.levels.map((lv) => {
    const lessonItems: CatalogItem[] = lv.lessons.flatMap((id) => {
      const l = lessonById.get(id);
      if (!l) return [];
      return [
        {
          id: l.id,
          kind: "lesson" as const,
          title: l.title,
          summary: l.summary,
          minutes: l.minutes,
          feature: l.feature,
          audioFeature: l.audio_feature,
          decks: { lecture: !!l.decks?.lecture, conversation: !!l.decks?.conversation },
        },
      ];
    });
    const labItems: CatalogItem[] = c.labs
      .filter((lab) => lab.level === lv.id)
      .map((lab) => ({
        id: lab.id,
        kind: "lab" as const,
        title: lab.title,
        summary: "",
        minutes: 0,
        feature: lab.feature,
        lessons: lab.lessons,
        files: lab.files,
        paths: lab.paths,
      }));
    return { id: lv.id, title: lv.title, summary: lv.weeks, items: [...lessonItems, ...labItems] };
  });
  return { version: c.schema_version, course: { slug: c.course.id, title: c.course.title, summary: "" }, levels };
}

export class CatalogUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "CatalogUnavailableError";
  }
}

/**
 * The catalog. Production (and any run with a catalog URL) fetches it, cached
 * for 60 s, and NEVER falls back to the fixture: a failure throws
 * CatalogUnavailableError so the page can say so honestly. Development, tests
 * and mock mode (no URL) use the local fixture.
 */
export async function getCatalog(opts: { fresh?: boolean } = {}): Promise<Catalog> {
  const url = resolveCatalogUrl(currentMediaEnv());
  if (!url) return parseCatalog(fixture);
  try {
    const res = await fetch(url, opts.fresh ? { cache: "no-store" } : { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`catalog fetch answered ${res.status}`);
    return parseCatalog(await res.json());
  } catch (err) {
    console.error("[catalog] unavailable", { url, reason: err instanceof Error ? err.message : String(err) });
    throw new CatalogUnavailableError("The course catalog could not be loaded", err);
  }
}

/** Like getCatalog but returns null instead of throwing, for places that can render without it. */
export async function tryGetCatalog(opts: { fresh?: boolean } = {}): Promise<Catalog | null> {
  try {
    return await getCatalog(opts);
  } catch {
    return null;
  }
}

export function findLevel(catalog: Catalog, levelId: string): CatalogLevel | undefined {
  return catalog.levels.find((l) => l.id.toLowerCase() === levelId.toLowerCase());
}

export function findItem(
  catalog: Catalog,
  itemId: string,
): { level: CatalogLevel; item: CatalogItem; prev?: CatalogItem; next?: CatalogItem } | undefined {
  const all = catalog.levels.flatMap((level) => level.items.map((item) => ({ level, item })));
  const idx = all.findIndex((e) => e.item.id.toLowerCase() === itemId.toLowerCase());
  if (idx < 0) return undefined;
  return { ...all[idx], prev: all[idx - 1]?.item, next: all[idx + 1]?.item };
}

export const COURSE_BASE = "/learning/ai-product-testing";
export const levelHref = (levelId: string) => `${COURSE_BASE}/levels/${levelId}`;
export const itemHref = (itemId: string) => `${COURSE_BASE}/lessons/${itemId}`;

/** "Level 0: Foundations" -> "Foundations" (the ID chip already says L0). */
export function levelShortTitle(title: string): string {
  return title.replace(/^Level \d+:\s*/i, "");
}
