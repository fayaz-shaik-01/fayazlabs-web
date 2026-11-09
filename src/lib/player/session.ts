"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { grantContent, type ContentGrant } from "@/lib/course-api";
import { useSessionNotice } from "@/lib/course-api/hooks";
import { useAuth } from "@/lib/auth";
import type { CatalogItem } from "@/lib/course/types";
import type { ContentSource } from "./format";
import { ContentLoader } from "./loader";
import { currentMediaEnv, resolveMediaBase } from "@/lib/course/media-config";
import { classifyFailure, logContentError, type ContentFailure } from "./errors";

export type SessionStatus = "loading" | "ready" | "locked" | "revoked" | "error";

const REFRESH_MARGIN_MS = 30_000;

export function mediaBase(): string {
  return resolveMediaBase(currentMediaEnv());
}

export function sourceFromGrant(itemId: string, g: ContentGrant, encrypted: boolean): ContentSource {
  return {
    itemId,
    encrypted,
    baseUrl: g.access.baseUrl.replace(/\/$/, ""),
    query: g.access.query ?? "",
    key: g.key,
  };
}

export interface ContentSession {
  status: SessionStatus;
  loader: ContentLoader | null;
  error?: string;
  failure: ContentFailure;
  retry: () => void;
  /** Masked-safe user email for the watermark. */
  email: string | null;
  userKey: string;
}

/**
 * Gets access to one item. Free items skip the grant call (the catalog says
 * they are public). Paid items call POST /content/grant and refresh it before
 * `expiresAt` without touching playback.
 */
export function useContentSession(item: Pick<CatalogItem, "id" | "feature">): ContentSession {
  const { user, isAuthenticated } = useAuth();
  const { notice } = useSessionNotice();
  const paid = item.feature !== "free";
  const sourceRef = useRef<ContentSource | null>(null);
  const [status, setStatus] = useState<SessionStatus>(paid ? "loading" : "ready");
  const [error, setError] = useState<string>();
  const [loader, setLoader] = useState<ContentLoader | null>(null);
  const revoked = notice === "revoked";

  const [failure, setFailure] = useState<ContentFailure>("retry");
  const [nonce, setNonce] = useState(0);
  const retry = useCallback(() => {
    setError(undefined);
    setStatus(paid ? "loading" : "ready");
    setNonce((n) => n + 1);
  }, [paid]);

  const fail = useCallback((e: unknown) => {
    logContentError("grant", e, { itemId: item.id });
    const kind = classifyFailure(e);
    if (kind === "revoked") setStatus("revoked");
    else if (kind === "locked") setStatus("locked");
    else {
      setFailure(kind);
      setError(kind);
      setStatus("error");
    }
  }, [item.id]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fetchGrant = async (): Promise<ContentSource> => {
      const g = await grantContent(item.id);
      const src = sourceFromGrant(item.id, g, true);
      sourceRef.current = src;
      if (!cancelled) {
        const ms = Date.parse(g.access.expiresAt) - Date.now() - REFRESH_MARGIN_MS;
        if (Number.isFinite(ms)) timer = setTimeout(scheduled, Math.max(1_000, ms));
      }
      return src;
    };
    const scheduled = () => {
      fetchGrant().catch((e) => !cancelled && fail(e));
    };

    const l = new ContentLoader(
      () => sourceRef.current as ContentSource,
      paid ? fetchGrant : undefined,
    );

    if (!paid) {
      sourceRef.current = { itemId: item.id, encrypted: false, baseUrl: mediaBase(), query: "", key: null };
      setLoader(l);
      setStatus("ready");
    } else {
      fetchGrant().then(
        () => {
          if (cancelled) return;
          setLoader(l);
          setStatus("ready");
        },
        (e) => !cancelled && fail(e),
      );
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      l.dispose();
      sourceRef.current = null;
      setLoader(null);
    };
  }, [item.id, paid, fail, nonce]);

  const effective: SessionStatus =
    revoked || (paid && !isAuthenticated && status === "ready") ? "revoked" : status;

  return useMemo(
    () => ({
      status: effective,
      loader: effective === "ready" ? loader : null,
      error,
      failure,
      retry,
      email: user?.email ?? null,
      userKey: String(user?.id ?? "anon"),
    }),
    [effective, loader, error, failure, retry, user],
  );
}
