import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog, itemHref } from "@/lib/course/catalog";
import { LevelList } from "@/components/course/level-list";
import { CourseIndex } from "@/components/course/course-index";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Product Testing",
  description: "A hands-on course on testing products built on LLMs and agents. The first level is free.",
};

export default async function CourseHomePage() {
  const catalog = await getCatalog();
  const first = catalog.levels[0]?.items[0];
  const items = catalog.levels.flatMap((l) => l.items);
  const minutes = items.reduce((n, i) => n + i.minutes, 0);
  const free = items.filter((i) => i.feature === "free").length;

  const stats = [
    { label: "Levels", value: catalog.levels.length },
    { label: "Items", value: items.length },
    { label: "Minutes", value: minutes },
    { label: "Free items", value: free },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-28 pb-24 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:pt-32">
      <CourseIndex title={catalog.course.title} levels={catalog.levels} />

      <div className="min-w-0">
        <header className="mb-10">
          <p className="eyebrow">Course</p>
          <h1 className="mt-3 text-display-lg text-foreground">{catalog.course.title}</h1>
          <p className="mt-4 max-w-[60ch] text-body-lg text-muted-foreground">
            {catalog.course.summary}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {first && (
              <Link href={itemHref(first.id)} className={cn(buttonVariants({ size: "lg" }))}>
                Start free
              </Link>
            )}
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              See plans
            </Link>
          </div>
          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="panel px-4 py-3">
                <dt className="eyebrow">{s.label}</dt>
                <dd className="font-heading text-2xl font-bold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <LevelList levels={catalog.levels} />
      </div>
    </div>
  );
}
