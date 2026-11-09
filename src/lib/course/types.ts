/** Features a user can hold; matches the backend contract (GET /me/access). */
export type Feature = "free" | "lessons.paid" | "audio.paid" | "practice.labs";

export interface CatalogItem {
  id: string; // e.g. "L2-05"
  kind: "lesson" | "lab";
  title: string;
  summary: string;
  minutes: number;
  /** Feature the user needs to open this item. */
  feature: Feature;
}

export interface CatalogLevel {
  id: string; // e.g. "L2"
  title: string;
  summary: string;
  items: CatalogItem[];
}

export interface Catalog {
  version: number;
  course: { slug: string; title: string; summary: string };
  levels: CatalogLevel[];
}
