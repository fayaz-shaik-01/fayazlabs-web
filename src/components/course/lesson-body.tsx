"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LockedCard } from "./locked-card";
import { GlossaryOverlay, type GlossaryTarget } from "./glossary-overlay";
import { findTerm } from "@/lib/course/glossary";
import { SlidePlayerSlot } from "./slide-player-slot";
import { itemHref } from "@/lib/course/catalog";
import type { CatalogItem } from "@/lib/course/types";
import { useContentSession } from "@/lib/player/session";
import { sanitizeLesson } from "@/lib/player/sanitize";
import { SESSION_REVOKED_MESSAGE } from "@/lib/course-api";
import { classifyFailure, logContentError, type ContentFailure } from "@/lib/player/errors";
import { ContentNotice } from "./content-notice";

// Decrypted lesson HTML, in memory only. Dropped when access goes away.
const htmlCache = new Map<string, string>();

function LessonSkeleton() {
  return (
    <div data-testid="lesson-skeleton" aria-busy="true" className="space-y-3">
      <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
      {[100, 92, 96, 70].map((w, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
      ))}
      <div className="h-32 animate-pulse rounded bg-muted" />
    </div>
  );
}

/** Labs have no lesson text or audio; their pack is delivered by signed URL (not wired up yet). */
function LabPanel({ item }: Readonly<{ item: CatalogItem }>) {
  return (
    <div data-testid="lab-panel" className="panel p-6 text-sm">
      <h2 className="text-lg font-semibold text-foreground">Lab files</h2>
      <p className="mt-1 text-muted-foreground">
        Used in {item.lessons?.length ? item.lessons.join(", ") : "this course"}. {item.files ?? 0} files.
      </p>
      {item.paths && (
        <ul className="mt-3 space-y-1 font-mono text-xs text-muted-foreground">
          {item.paths.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-muted-foreground">Lab downloads are not available on the site yet.</p>
    </div>
  );
}

export function LessonBody({ item }: Readonly<{ item: CatalogItem }>) {
  return item.kind === "lab" ? <LabPanel item={item} /> : <LessonContent item={item} />;
}

/** Slide player plus the decrypted, sanitised lesson text for one item. */
function LessonContent({ item }: Readonly<{ item: CatalogItem }>) {
  const session = useContentSession(item);
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(() => htmlCache.get(item.id) ?? null);
  const [failure, setFailure] = useState<ContentFailure | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { loader, status } = session;

  useEffect(() => {
    if (status === "revoked" || status === "locked") {
      htmlCache.clear(); // the revoked/locked branches below no longer render the HTML
    }
  }, [status]);

  useEffect(() => {
    if (!loader) return;
    if (htmlCache.has(item.id)) return; // already in state from the initializer
    const ctl = new AbortController();
    (async () => {
      try {
        const raw = await loader.text("lesson.html", ctl.signal);
        const clean = await sanitizeLesson(raw);
        if (ctl.signal.aborted) return;
        htmlCache.set(item.id, clean);
        setHtml(clean);
      } catch (e) {
        if (ctl.signal.aborted) return;
        logContentError("lesson.html", e, { itemId: item.id });
        setFailure(classifyFailure(e));
      }
    })();
    return () => ctl.abort();
  }, [loader, item.id, attempt]);

  const articleRef = useRef<HTMLElement>(null);
  const [term, setTerm] = useState<GlossaryTarget | null>(null);
  // Internal links navigate on the client, everything else is left alone.
  const onClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    // A glossary term opens its definition next to the word instead of leaving the lesson.
    const termId = a.getAttribute("data-term");
    if (termId && findTerm(termId)) {
      e.preventDefault();
      setTerm({ id: termId, el: a });
      return;
    }
    const href = a.getAttribute("href");
    if (!href || a.target === "_blank") return;
    if (href.startsWith("#")) return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    router.push(url.pathname + url.search + url.hash);
  };

  if (status === "locked") {
    return <LockedCard item={item} reason="upgrade" returnTo={itemHref(item.id)} />;
  }
  if (status === "revoked") {
    return (
      <div role="alert" data-testid="lesson-revoked" className="rounded-xl border border-border bg-card/50 p-6 text-sm text-foreground">
        {SESSION_REVOKED_MESSAGE}
      </div>
    );
  }

  return (
    <div data-testid="lesson-body" className="space-y-8">
      {status !== "error" && <SlidePlayerSlot itemId={item.id} session={session} modes={item.decks} />}
      {status === "error" ? (
        <ContentNotice failure={session.failure} onRetry={session.retry} />
      ) : failure ? (
        <ContentNotice failure={failure} onRetry={() => { setFailure(null); setAttempt((n) => n + 1); }} />
      ) : html === null ? (
        <LessonSkeleton />
      ) : (
        <article
          ref={articleRef}
          className="course-prose"
          data-testid="lesson-article"
          onClick={onClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {term && <GlossaryOverlay target={term} onClose={() => setTerm(null)} />}
    </div>
  );
}
