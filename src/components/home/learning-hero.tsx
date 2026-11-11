import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MeetBolt } from "@/components/home/meet-bolt";
import { levelShortTitle } from "@/lib/course/catalog";
import type { Catalog } from "@/lib/course/types";

/**
 * Home hero. The right half is left empty on purpose: Bolt, the 3D assistant, stands there.
 * The numbers come from the real course catalog, so nothing here is made up.
 */
export function LearningHomepageHero({ catalog }: Readonly<{ catalog: Catalog | null }>) {
  const items = catalog?.levels.flatMap((l) => l.items) ?? [];
  const stats = catalog
    ? [
        { label: "Levels", value: catalog.levels.length },
        { label: "Items", value: items.length },
        { label: "Free items", value: items.filter((i) => i.feature === "free").length },
      ]
    : [];

  return (
    <section className="mx-auto flex max-w-6xl flex-col justify-center px-4 pt-32 pb-16 sm:px-6 lg:min-h-[calc(100vh-1rem)] lg:pt-28 lg:pb-24">
      <div className="max-w-[38rem] animate-in fade-in slide-in-from-bottom-2 duration-500">
        <p className="eyebrow eyebrow-accent">Projects · Writing · Courses</p>
        <h1 className="mt-4 text-display-xl text-foreground">
          Building and testing <span className="text-primary">AI products</span>
        </h1>
        <p className="mt-6 max-w-[52ch] text-body-lg text-muted-foreground sm:text-xl">
          Projects, writing and hands-on courses on engineering and testing software built on LLMs. By{" "}
          <span className="font-semibold text-foreground">Shaik Fayaz</span>. Bolt, the site&apos;s AI assistant, can answer questions while you look around.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/learning/ai-product-testing" className={cn(buttonVariants({ size: "lg" }))}>
            Start the course
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/projects" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            See projects
          </Link>
          <MeetBolt />
        </div>
        {stats.length > 0 && (
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="eyebrow">{s.label}</dt>
                <dd className="font-heading text-3xl font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

/** The course levels as a grid of cards. Hovering one makes Bolt point at it. */
export function HomeRoadmap({ catalog }: Readonly<{ catalog: Catalog | null }>) {
  if (!catalog) return null;
  return (
    <section aria-labelledby="roadmap-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <span className="eyebrow eyebrow-accent">{catalog.course.title}</span>
        <h2 id="roadmap-heading" className="text-heading-xl text-foreground">
          The roadmap
        </h2>
        <p className="max-w-[56ch] text-body-lg text-muted-foreground">Hover a level and Bolt points at it. The first level is free.</p>
      </div>
      <ol className="grid max-w-3xl gap-3 sm:grid-cols-2">
        {catalog.levels.map((level) => (
          <li key={level.id}>
            <Link
              href={`/learning/ai-product-testing/levels/${level.id}`}
              data-bolt-point
              className="panel panel-interactive group flex h-full flex-col gap-1 px-4 py-3.5"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="chip">{level.id}</span>
                <span className="eyebrow tabular-nums">{level.items.length} items</span>
              </span>
              <span className="mt-1 font-heading text-lg font-semibold leading-snug text-foreground">{levelShortTitle(level.title)}</span>
              {level.summary && <span className="text-[0.9375rem] leading-snug text-muted-foreground">{level.summary}</span>}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
