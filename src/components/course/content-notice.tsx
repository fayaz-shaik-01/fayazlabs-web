"use client";

import { FAILURE_MESSAGES, type ContentFailure } from "@/lib/player/errors";

/** Friendly message for a content failure, with an optional retry. No HTTP codes, no raw errors. */
export function ContentNotice({ failure, onRetry, className = "" }: Readonly<{ failure: ContentFailure; onRetry?: () => void; className?: string }>) {
  const m = FAILURE_MESSAGES[failure];
  const retryable = failure === "not-published" || failure === "retry" || failure === "decrypt";
  return (
    <div role="status" data-testid="content-notice" data-failure={failure} className={`panel p-6 text-center ${className}`}>
      <h3 className="text-heading-md text-foreground">{m.title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{m.body}</p>
      {retryable && onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted">
          Try again
        </button>
      )}
    </div>
  );
}
