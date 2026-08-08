"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LearningError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[LearningError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Failed to load content</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          We couldn&apos;t load this learning content. This might be a temporary issue.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/learning"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tracks
        </Link>
      </div>
    </div>
  );
}
