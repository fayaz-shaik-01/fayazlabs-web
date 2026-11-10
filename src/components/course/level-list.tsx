"use client";

import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/lib/course-api/hooks";
import { getLockState } from "@/lib/course/access";
import { itemHref, levelHref, levelShortTitle } from "@/lib/course/catalog";
import type { CatalogLevel } from "@/lib/course/types";
import { cn } from "@/lib/utils";

/** Levels as collapsible cards with their items. One access lookup serves the whole list. */
export function LevelList({
  levels,
  linkLevels = true,
}: Readonly<{ levels: CatalogLevel[]; linkLevels?: boolean }>) {
  const { isAuthenticated } = useAuth();
  const access = useAccess();

  return (
    <div className="flex flex-col gap-4">
      {levels.map((level) => {
        const minutes = level.items.reduce((n, i) => n + i.minutes, 0);
        return (
          <details
            key={level.id}
            id={`level-${level.id}`}
            open
            data-testid={`level-${level.id}`}
            className="group panel scroll-mt-24 overflow-hidden"
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 p-5 outline-offset-[-2px] [&::-webkit-details-marker]:hidden">
              <span className="chip">{level.id}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-xl font-bold leading-tight text-foreground">
                  {levelShortTitle(level.title)}
                </span>
                <span className="eyebrow mt-1 block">
                  {level.items.length} items{minutes > 0 ? ` · ${minutes} min` : ""}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
              />
            </summary>

            <div className="border-t border-border px-5 pt-4 pb-5">
              {(level.summary || linkLevels) && (
                <p className="mb-3 text-[0.9375rem] text-muted-foreground">
                  {level.summary}
                  {linkLevels && (
                    <>
                      {level.summary && " "}
                      <Link
                        href={levelHref(level.id)}
                        className="font-semibold text-primary hover:underline"
                      >
                        Open level
                      </Link>
                    </>
                  )}
                </p>
              )}
              <ul className="flex flex-col">
                {level.items.map((item) => {
                  const lock = getLockState(item, access.features, isAuthenticated);
                  const showLock = lock.locked && access.status !== "loading";
                  return (
                    <li key={item.id}>
                      <Link
                        href={itemHref(item.id)}
                        className="grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-x-3 gap-y-1 rounded-md px-2.5 py-2.5 text-[0.9375rem] transition-colors hover:bg-muted sm:grid-cols-[3.5rem_1fr_auto_auto_3.5rem]"
                      >
                        <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                        <span className={cn("font-medium", showLock ? "text-muted-foreground" : "text-foreground")}>
                          {item.title}
                        </span>
                        <span className="hidden items-center gap-1.5 sm:flex">
                          {item.kind === "lab" && <Badge variant="secondary">Lab</Badge>}
                          {item.feature === "free" && <Badge>Free</Badge>}
                        </span>
                        <span className="hidden w-4 sm:block">
                          {showLock && (
                            <Lock className="size-3.5 text-muted-foreground" aria-label="Locked" />
                          )}
                        </span>
                        <span className="eyebrow text-right tabular-nums">{item.minutes > 0 ? `${item.minutes} min` : ""}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        );
      })}
    </div>
  );
}
