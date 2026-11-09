import {
  clearAuth,
  getStoredAuth,
  saveAuth,
  type StoredAuth,
} from "@/lib/auth/token-store";
import { PLATFORM_URL, isMockApi } from "./config";
import { ApiError } from "./errors";
import { setSessionNotice } from "./session-notice";
import { mockTransport } from "./mock";

/** What the client needs from the network. Swappable for tests and mock mode. */
export interface TransportRequest {
  method: string;
  path: string; // without the /api prefix, e.g. "/me/access"
  body?: unknown;
  token?: string | null;
}
export interface TransportResponse {
  status: number;
  body: unknown;
}
export type Transport = (req: TransportRequest) => Promise<TransportResponse>;

const fetchTransport: Transport = async ({ method, path, body, token }) => {
  const res = await fetch(`${PLATFORM_URL}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let parsed: unknown = undefined;
  if (res.status !== 204) {
    try {
      parsed = await res.json();
    } catch {
      parsed = undefined;
    }
  }
  return { status: res.status, body: parsed };
};

let transportOverride: Transport | null = null;

/** For tests: replace the transport. Pass null to restore the default. */
export function setTransport(t: Transport | null) {
  transportOverride = t;
}

function transport(): Transport {
  if (transportOverride) return transportOverride;
  return isMockApi() ? mockTransport : fetchTransport;
}

// The backend may answer with the raw JSON of the contract, or with the older
// { success, data, error } envelope. Accept both.
function unwrap(body: unknown): unknown {
  if (body && typeof body === "object" && "success" in body && ("data" in body || "error" in body)) {
    const env = body as { success: boolean; data?: unknown };
    return env.success ? env.data : body;
  }
  return body;
}

function toError(status: number, body: unknown): ApiError {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const nested = (b.error && typeof b.error === "object" ? b.error : {}) as Record<string, unknown>;
  const code = (b.code ?? nested.code) as string | undefined;
  const message =
    (b.message as string | undefined) ?? (nested.message as string | undefined) ?? `Request failed (${status})`;
  const { code: _c, message: _m, error: _e, success: _s, ...details } = b;
  void _c; void _m; void _e; void _s;
  return new ApiError(status, message, code, details);
}

/** Signed out by another login: clear local auth and tell the user why. */
export function handleSessionRevoked() {
  clearAuth();
  setSessionNotice("revoked");
}

let refreshInFlight: Promise<StoredAuth> | null = null;

/** Exchange the refresh token for a new pair. One request at a time. */
export function refreshTokens(): Promise<StoredAuth> {
  if (refreshInFlight) return refreshInFlight;
  const current = getStoredAuth();
  if (!current) {
    return Promise.reject(new ApiError(401, "Not signed in", "REFRESH_INVALID"));
  }
  refreshInFlight = (async () => {
    const res = await transport()({
      method: "POST",
      path: "/auth/refresh",
      body: { refreshToken: current.refreshToken },
    });
    if (res.status >= 200 && res.status < 300) {
      const data = unwrap(res.body) as {
        accessToken: string;
        refreshToken: string;
        sessionId?: string;
      };
      const next: StoredAuth = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        sessionId: data.sessionId ?? current.sessionId,
      };
      saveAuth(next);
      return next;
    }
    const err = toError(res.status, res.body);
    if (res.status === 401) {
      if (err.code === "SESSION_REVOKED") handleSessionRevoked();
      else clearAuth(); // REFRESH_INVALID or unknown: just sign out locally
    }
    throw err;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Send the bearer token and run the 401 handling. Default true. */
  auth?: boolean;
}

/**
 * Call the backend. On 401:
 *  - SESSION_REVOKED: clear auth, set the "signed out elsewhere" notice, throw.
 *  - REFRESH_INVALID: clear auth, throw (plain sign-out, no notice).
 *  - anything else: refresh the tokens once and retry the request.
 */
export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const auth = opts.auth ?? true;
  const method = opts.method ?? "GET";

  const send = (token: string | null) =>
    transport()({ method, path, body: opts.body, token: auth ? token : null });

  let res = await send(getStoredAuth()?.accessToken ?? null);

  if (res.status === 401 && auth) {
    const err = toError(401, res.body);
    if (err.code === "SESSION_REVOKED") {
      handleSessionRevoked();
      throw err;
    }
    if (err.code === "REFRESH_INVALID") {
      clearAuth();
      throw err;
    }
    if (getStoredAuth()) {
      const fresh = await refreshTokens(); // throws (and handles) on failure
      res = await send(fresh.accessToken);
    } else {
      throw err; // never signed in; callers decide (e.g. show a login prompt)
    }
  }

  if (res.status >= 200 && res.status < 300) {
    return (res.status === 204 ? undefined : unwrap(res.body)) as T;
  }
  const err = toError(res.status, res.body);
  if (res.status === 401 && err.code === "SESSION_REVOKED") handleSessionRevoked();
  throw err;
}
