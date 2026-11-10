import data from "./glossary.json";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  /** Related terms, e.g. "Precision, Recall". */
  see?: string;
}

export const GLOSSARY: GlossaryTerm[] = data as GlossaryTerm[];
export const GLOSSARY_PATH = "/learning/ai-product-testing/glossary";

const byId = new Map(GLOSSARY.map((t) => [t.id, t]));
export const findTerm = (id: string): GlossaryTerm | undefined => byId.get(id);

/**
 * The term id behind a lesson link, or null if the link is not a glossary link.
 * Lesson text links to "../glossary.html#api"; the site's own page is
 * "/learning/ai-product-testing/glossary#api".
 */
export function termIdFromHref(href: string): string | null {
  const m = /(?:^|\/)glossary(?:\.html)?(?:\/)?#([^#?\s]+)$/.exec(href);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Rewrite a lesson's glossary href to the site's glossary page. */
export function glossaryHref(id: string): string {
  return `${GLOSSARY_PATH}#${encodeURIComponent(id)}`;
}
