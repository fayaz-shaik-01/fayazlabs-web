import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { getProducts } from "@/lib/products";

export function FeaturedProducts() {
  const products = getProducts();

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeader
        label="Courses"
        title="Learn with Fayaz Labs"
        description="Practical courses built from real engineering work."
      />
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              href={product.href}
              className="panel panel-interactive group flex h-full flex-col p-6"
            >
              {product.badge && <span className="chip w-fit">{product.badge}</span>}
              <h3 className="mt-3 text-xl font-bold text-foreground">
                {product.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                {product.blurb}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary">
                Open course
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
