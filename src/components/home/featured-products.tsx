"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { getProducts } from "@/lib/products";

export function FeaturedProducts() {
  const products = getProducts();

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <SectionHeader
        label="Courses"
        title="Learn with FayazLabs"
        description="Practical courses built from real engineering work."
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <motion.div
            key={product.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
          >
            <Link
              href={product.href}
              className="group flex h-full flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-0.5"
            >
              {product.badge && (
                <Badge variant="secondary" className="mb-3 w-fit">
                  {product.badge}
                </Badge>
              )}
              <h3 className="mb-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground/70">{product.blurb}</p>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          href="/learning"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "gap-2 rounded-[2px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-400 text-sm font-semibold px-7 h-11"
          )}
        >
          All courses
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
