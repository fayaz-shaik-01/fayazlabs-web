import { levelShortTitle } from "@/lib/course/catalog";
import type { CatalogLevel } from "@/lib/course/types";

/** Sticky level index on desktop, a horizontal strip of chips on small screens. */
export function CourseIndex({
  title,
  levels,
}: Readonly<{ title: string; levels: CatalogLevel[] }>) {
  return (
    <nav aria-label="Course levels" className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-3 hidden font-heading text-lg font-bold lg:block">{title}</p>
      <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {levels.map((level) => (
          <li key={level.id} className="shrink-0">
            <a
              href={`#level-${level.id}`}
              className="grid grid-cols-[auto_auto] items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/50 lg:grid-cols-[2.25rem_1fr_auto] lg:border-transparent lg:bg-transparent lg:px-2 lg:py-1.5 lg:hover:bg-card"
            >
              <span className="font-mono text-xs text-muted-foreground">{level.id}</span>
              <span className="hidden truncate lg:block">{levelShortTitle(level.title)}</span>
              <span className="eyebrow tabular-nums">{level.items.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
