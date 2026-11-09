import { ApiError } from "@/lib/course-api/errors";
import { DecryptError } from "./crypto";
import { LoadError } from "./loader";

export type ContentFailure = "not-published" | "locked" | "revoked" | "retry" | "decrypt";

/** Map any failure to what the user should see. Raw HTTP codes are never shown. */
export function classifyFailure(e: unknown): ContentFailure {
  if (e instanceof ApiError) {
    if (e.code === "SESSION_REVOKED") return "revoked";
    if (e.status === 401 || e.status === 403) return "locked";
    if (e.status === 404) return "not-published";
    return "retry";
  }
  if (e instanceof DecryptError) return "decrypt";
  if (e instanceof LoadError) {
    if (e.status === 404 || e.status === 410) return "not-published";
    if (e.status === 401 || e.status === 403) return "locked";
    return "retry";
  }
  return "retry"; // network errors, timeouts, malformed JSON
}

export const FAILURE_MESSAGES: Record<ContentFailure, { title: string; body: string }> = {
  "not-published": {
    title: "This lesson isn't published yet",
    body: "The content for this item isn't available yet. Please try again later.",
  },
  locked: { title: "This part of the course is locked", body: "Sign in or upgrade your plan to open it." },
  revoked: { title: "You were signed out", body: "Your account was used on another device. Sign in again to continue." },
  retry: { title: "We couldn't load this", body: "Check your connection and try again." },
  decrypt: { title: "We couldn't open this lesson", body: "Try again. If it keeps happening, contact support." },
};

/** Structured log for debugging; the user never sees this. */
export function logContentError(where: string, e: unknown, extra: Record<string, unknown> = {}) {
  console.warn("[course-content]", {
    where,
    failure: classifyFailure(e),
    name: e instanceof Error ? e.name : typeof e,
    status: (e as { status?: number })?.status,
    message: e instanceof Error ? e.message : String(e),
    ...extra,
  });
}
