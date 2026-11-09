import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getProducts } from "@/lib/products";
import { Badge } from "@/components/ui/badge";

const title = "Learning: courses by Fayaz Labs";
const description =
  "Hands-on courses on engineering and testing AI products. Start free, upgrade when you want the full path.";
const url = `${siteConfig.url}/learning`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url, siteName: siteConfig.name, type: "website" },
  twitter: { card: "summary_large_image", title, description },
  alternates: { canonical: url },
};

export default function LearningPage() {
  const products = getProducts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Fayaz Labs courses",
    description,
    url,
    numberOfItems: products.length,
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: product.title,
      url: `${siteConfig.url}${product.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-24">
        <header className="mb-12 max-w-2xl">
          <p className="mono-tag text-lab-green mb-3">[COURSES]</p>
          <h1 className="text-display-xl text-foreground">Learning</h1>
          <p className="mt-4 text-body-lg text-muted-foreground">{description}</p>
        </header>

        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Products"
        >
          {products.map((product) => (
            <li key={product.slug}>
              <Link
                href={product.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-card/50 p-6 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5"
              >
                {product.badge && (
                  <Badge variant="secondary" className="mb-3 w-fit">
                    {product.badge}
                  </Badge>
                )}
                <h2 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {product.title}
                </h2>
                <p className="text-sm text-muted-foreground">{product.blurb}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Open course
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
