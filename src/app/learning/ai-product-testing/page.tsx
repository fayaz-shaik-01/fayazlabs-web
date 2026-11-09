import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog, itemHref } from "@/lib/course/catalog";
import { LevelList } from "@/components/course/level-list";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Product Testing",
  description: "A hands-on course on testing products built on LLMs and agents. The first level is free.",
};

export default async function CourseHomePage() {
  const catalog = await getCatalog();
  const first = catalog.levels[0]?.items[0];

  return (
    <div className="mx-auto max-w-4xl px-6 pt-32 pb-24">
      <header className="mb-12">
        <p className="mono-tag text-lab-green mb-3">[COURSE]</p>
        <h1 className="text-display-xl text-foreground">{catalog.course.title}</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">{catalog.course.summary}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {first && (
            <Link href={itemHref(first.id)} className={cn(buttonVariants({ size: "lg" }), "rounded-[2px]")}>
              Start free
            </Link>
          )}
          <Link href="/pricing" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-[2px]")}>
            See plans
          </Link>
        </div>
      </header>
      <LevelList levels={catalog.levels} />
    </div>
  );
}
