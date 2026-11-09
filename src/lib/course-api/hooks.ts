"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth";
import { getAccess, heartbeat } from "./endpoints";
import { ANONYMOUS_ACCESS, LOADING_ACCESS, resolveAccess, type AccessState } from "./access";
import { HEARTBEAT_INTERVAL_MS } from "./config";
import {
  getSessionNotice,
  setSessionNotice,
  subscribeSessionNotice,
  type SessionNotice,
} from "./session-notice";

/** The signed-in user's features and subscription, from GET /me/access. */
export function useAccess(): AccessState & { reload: () => void } {
  const { isAuthenticated, isLoading, user } = useAuth();
  const userKey = user?.id ?? null;
  const [fetched, setFetched] = useState<{ key: number | null; state: AccessState } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let cancelled = false;
    resolveAccess(getAccess).then((state) => {
      if (!cancelled) setFetched({ key: userKey, state });
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, userKey, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  let state: AccessState;
  if (isLoading) state = LOADING_ACCESS;
  else if (!isAuthenticated) state = ANONYMOUS_ACCESS;
  else if (fetched && fetched.key === userKey) state = fetched.state;
  else state = LOADING_ACCESS;
  return { ...state, reload };
}

/**
 * While mounted and signed in, ping GET /auth/heartbeat now and every 45 s.
 * A 401 SESSION_REVOKED is handled inside the API client: auth is cleared and
 * the "signed out on another device" notice is shown.
 */
export function useHeartbeat(enabled = true): void {
  const { isAuthenticated } = useAuth();
  const active = enabled && isAuthenticated;

  useEffect(() => {
    if (!active) return;
    const ping = () => {
      heartbeat().catch(() => {
        // Revoked/expired sessions are handled by the client; network errors
        // just wait for the next tick.
      });
    };
    ping();
    const id = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active]);
}

/** The current "you were signed out" notice, plus a way to dismiss it. */
export function useSessionNotice(): { notice: SessionNotice; dismiss: () => void } {
  const notice = useSyncExternalStore(subscribeSessionNotice, getSessionNotice, () => null);
  return { notice, dismiss: () => setSessionNotice(null) };
}
