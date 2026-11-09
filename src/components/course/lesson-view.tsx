"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useAccess, useHeartbeat } from "@/lib/course-api/hooks";
import { getLockState } from "@/lib/course/access";
import { itemHref, levelHref } from "@/lib/course/catalog";
import type { CatalogItem, CatalogLevel } from "@/lib/course/types";
import { LessonBody } from "./lesson-body";
import { LockedCard } from "./locked-card";

interface LessonViewProps {
  level: Pick<CatalogLevel, "id" | "title">;
  item: CatalogItem;
  prev?: Pick<CatalogItem, "id" | "title">;
  next?: Pick<CatalogItem, "id" | "title">;
}

/** Lesson shell: header, locked state or body, and prev/next navigation. */
export function LessonView({ level, item, prev, next }: Readonly<LessonViewProps>) {
  const { isAuthenticated } = useAuth();
  const access = useAccess();
  useHeartbeat(); // keeps the single-device check running while a lesson is open

  const lock = getLockState(item, access.features, isAuthenticated);
  // For paid items, wait for the access answer before showing the locked card
  // so signed-in paying users do not see a flash of "upgrade".
  const pending = access.status === "loading" && item.feature !== "free";

  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-24">
      <Link
        href={levelHref(level.id)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {level.title}
      </Link>

      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline">{item.id}</Badge>
          {item.kind === "lab" && <Badge variant="secondary">Lab</Badge>}
          {item.feature === "free" && <Badge variant="secondary">Free</Badge>}
        </div>
        <h1 className="text-display-lg text-foreground">{item.title}</h1>
        {item.minutes > 0 && <p className="mt-2 text-sm text-muted-foreground">{item.minutes} min</p>}
      </header>

      {pending ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />
      ) : lock.locked ? (
        <LockedCard item={item} reason={lock.reason as "login" | "upgrade"} returnTo={itemHref(item.id)} />
      ) : (
        <LessonBody item={item} />
      )}

      <nav className="mt-10 flex justify-between gap-4 text-sm" aria-label="Lesson navigation">
        {prev ? (
          <Link href={itemHref(prev.id)} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={itemHref(next.id)} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            {next.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
