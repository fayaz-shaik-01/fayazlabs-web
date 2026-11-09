import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Catalog } from "@/lib/course/types";

/**
 * Home hero. The right-hand card lists the real course levels from the catalog,
 * so it never shows made-up numbers.
 */
export function LearningHomepageHero({ catalog }: Readonly<{ catalog: Catalog }>) {
  const lessonCount = catalog.levels.reduce((n, l) => n + l.items.length, 0);

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-32 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14 lg:pt-40 lg:pb-20">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <p className="eyebrow">Projects · Writing · Courses</p>
        <h1 className="mt-4 text-display-xl text-foreground">
          Building and testing AI products
        </h1>
        <p className="mt-6 max-w-[56ch] text-body-lg text-muted-foreground sm:text-xl">
          Projects, writing and hands-on courses on engineering and testing
          software built on LLMs. By{" "}
          <span className="font-semibold text-foreground">Shaik Fayaz</span>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/learning/ai-product-testing"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Start the course
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/projects"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            See projects
          </Link>
        </div>
      </div>

      <aside
        aria-label="Course outline"
        className="panel flex flex-col gap-4 p-5 animate-in fade-in slide-in-from-bottom-2 duration-700"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">{catalog.course.title}</span>
          <span className="chip">Free to start</span>
        </div>
        <ol className="flex flex-col">
          {catalog.levels.map((level) => (
            <li key={level.id}>
              <Link
                href={`/learning/ai-product-testing/levels/${level.id}`}
                className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="chip">{level.id}</span>
                <span className="text-[0.9375rem] font-semibold leading-snug text-foreground">
                  {level.title.replace(/^Level \d+:\s*/, "")}
                </span>
                <span className="eyebrow tabular-nums">{level.items.length}</span>
              </Link>
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="eyebrow">
            {catalog.levels.length} levels · {lessonCount} items
          </span>
          <Link
            href="/learning/ai-product-testing"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Open course →
          </Link>
        </div>
      </aside>
    </section>
  );
}
