/**
 * Tiny external store for the "you were signed out" notice, so a banner can
 * show it wherever the user is. Persisted in sessionStorage so it survives a
 * reload that happens right after the revoke.
 */

export type SessionNotice = "revoked" | null;

const KEY = "fayazlabs_session_notice";
let current: SessionNotice = null;
const listeners = new Set<() => void>();

export const SESSION_REVOKED_MESSAGE =
  "You were signed out because your account was used on another device. Sign in again to continue on this one.";

function read(): SessionNotice {
  try {
    if (typeof window !== "undefined" && window.sessionStorage.getItem(KEY) === "revoked") {
      return "revoked";
    }
  } catch {
    // ignore
  }
  return null;
}

export function getSessionNotice(): SessionNotice {
  return current ?? read();
}

export function setSessionNotice(notice: SessionNotice) {
  current = notice;
  try {
    if (typeof window !== "undefined") {
      if (notice) window.sessionStorage.setItem(KEY, notice);
      else window.sessionStorage.removeItem(KEY);
    }
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function subscribeSessionNotice(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
