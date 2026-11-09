import { z } from "zod";
import fixture from "./fixtures/catalog.json";
import type { Catalog, CatalogItem, CatalogLevel } from "./types";

const featureSchema = z.enum(["free", "lessons.paid", "audio.paid", "practice.labs"]);

const catalogSchema = z.object({
  version: z.number(),
  course: z.object({ slug: z.string(), title: z.string(), summary: z.string() }),
  levels: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          kind: z.enum(["lesson", "lab"]),
          title: z.string(),
          summary: z.string().default(""),
          minutes: z.number().default(0),
          feature: featureSchema,
        }),
      ),
    }),
  ),
});

export function parseCatalog(data: unknown): Catalog {
  return catalogSchema.parse(data);
}

/**
 * Catalog source: NEXT_PUBLIC_CATALOG_URL when set (fetched on the server and
 * cached for 5 minutes), otherwise the local fixture. If the remote fetch
 * fails we log and fall back to the fixture so the pages still render.
 */
export async function getCatalog(): Promise<Catalog> {
  const url = process.env.NEXT_PUBLIC_CATALOG_URL;
  if (!url) return parseCatalog(fixture);
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
    return parseCatalog(await res.json());
  } catch (err) {
    console.error("[catalog] using the local fixture instead:", err);
    return parseCatalog(fixture);
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
