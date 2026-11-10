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
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-24 sm:px-6">
      <Link
        href={levelHref(level.id)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        {level.title}
      </Link>

      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Badge>{item.id}</Badge>
          {item.kind === "lab" && <Badge variant="secondary">Lab</Badge>}
          {item.feature === "free" && <Badge variant="outline">Free</Badge>}
        </div>
        <h1 className="text-display-lg text-foreground">{item.title}</h1>
        {item.minutes > 0 && <p className="eyebrow mt-3">{item.minutes} min</p>}
      </header>

      {pending ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />
      ) : lock.locked ? (
        <LockedCard item={item} reason={lock.reason as "login" | "upgrade"} returnTo={itemHref(item.id)} />
      ) : (
        <LessonBody item={item} />
      )}

      <nav className="mt-12 grid gap-3 sm:grid-cols-2" aria-label="Lesson navigation">
        {prev ? (
          <Link href={itemHref(prev.id)} className="panel panel-interactive flex flex-col gap-1 p-4">
            <span className="eyebrow inline-flex items-center gap-1.5">
              <ArrowLeft className="size-3.5" />
              Previous
            </span>
            <span className="font-semibold text-foreground">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={itemHref(next.id)} className="panel panel-interactive flex flex-col gap-1 p-4 sm:items-end sm:text-right">
            <span className="eyebrow inline-flex items-center gap-1.5">
              Next
              <ArrowRight className="size-3.5" />
            </span>
            <span className="font-semibold text-foreground">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
