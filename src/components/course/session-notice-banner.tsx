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
      className="fixed top-16 left-1/2 z-[60] w-[min(92vw,40rem)] -translate-x-1/2 rounded-lg border border-warn/40 bg-warn-soft p-4 shadow-float"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm text-warn">
          {SESSION_REVOKED_MESSAGE}{" "}
          <Link href="/login" onClick={dismiss} className="font-semibold underline">
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
