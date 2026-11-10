import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

export const LEGAL_SLUGS = ["terms", "privacy", "refund"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface LegalDoc {
  slug: LegalSlug;
  title: string;
  /** "Last updated" date shown under the title, from the front matter. */
  updated?: string;
  html: string;
}

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

/**
 * Load content/legal/<slug>.md and render it to HTML.
 * Raw HTML in the markdown is dropped (not passed through), so the output is
 * safe to inject.
 */
export async function getLegalDoc(slug: LegalSlug): Promise<LegalDoc> {
  const raw = await fs.readFile(path.join(LEGAL_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content);
  return {
    slug,
    title: String(data.title ?? slug),
    updated: data.updated ? String(data.updated) : undefined,
    html: String(file),
  };
}
