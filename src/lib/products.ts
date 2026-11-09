/**
 * Products shown on the /learning hub. Add a new entry here to list another
 * product; the hub, home page, sitemap and command palette all read this list.
 */

export interface Product {
  slug: string;
  title: string;
  blurb: string;
  /** Short badge text, e.g. "Free to start". */
  badge?: string;
  href: string;
}

export const products: Product[] = [
  {
    slug: "ai-product-testing",
    title: "AI Product Testing",
    blurb:
      "A hands-on course on testing products built on LLMs and agents: from first principles to evaluation suites and production monitoring.",
    badge: "Free to start",
    href: "/learning/ai-product-testing",
  },
];

export function getProducts(): Product[] {
  return products;
}
