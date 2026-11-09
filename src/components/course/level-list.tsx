"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/lib/course-api/hooks";
import { getLockState } from "@/lib/course/access";
import { itemHref, levelHref } from "@/lib/course/catalog";
import type { CatalogLevel } from "@/lib/course/types";

/** Levels with their items. One access lookup serves the whole list. */
export function LevelList({
  levels,
  linkLevels = true,
}: Readonly<{ levels: CatalogLevel[]; linkLevels?: boolean }>) {
  const { isAuthenticated } = useAuth();
  const access = useAccess();

  return (
    <div className="space-y-10">
      {levels.map((level) => (
        <section key={level.id} aria-labelledby={`level-${level.id}`} data-testid={`level-${level.id}`}>
          <h2 id={`level-${level.id}`} className="text-xl font-semibold text-foreground">
            {linkLevels ? (
              <Link href={levelHref(level.id)} className="hover:text-primary transition-colors">
                {level.title}
              </Link>
            ) : (
              level.title
            )}
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">{level.summary}</p>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {level.items.map((item) => {
              const lock = getLockState(item, access.features, isAuthenticated);
              const showLock = lock.locked && access.status !== "loading";
              return (
                <li key={item.id}>
                  <Link
                    href={itemHref(item.id)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/40 transition-colors"
                  >
                    <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">{item.id}</span>
                    <span className="flex-1 text-foreground">{item.title}</span>
                    {item.kind === "lab" && <Badge variant="secondary">Lab</Badge>}
                    {item.feature === "free" && <Badge variant="outline">Free</Badge>}
                    {showLock && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Locked" />}
                    <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">{item.minutes > 0 ? `${item.minutes} min` : ""}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
