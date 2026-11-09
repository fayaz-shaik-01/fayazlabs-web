"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useSessionNotice } from "@/lib/course-api/hooks";
import { SESSION_REVOKED_MESSAGE } from "@/lib/course-api/session-notice";

/** Banner shown after the backend revokes this session (signed in elsewhere). */
export function SessionNoticeBanner() {
  const { notice, dismiss } = useSessionNotice();
  if (notice !== "revoked") return null;

  return (
    <div
      role="alert"
      data-testid="session-revoked-notice"
      className="fixed top-16 left-1/2 z-[60] w-[min(92vw,40rem)] -translate-x-1/2 rounded-md border border-amber-500/40 bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm text-foreground">
          {SESSION_REVOKED_MESSAGE}{" "}
          <Link href="/login" onClick={dismiss} className="font-medium text-primary underline">
            Sign in
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
