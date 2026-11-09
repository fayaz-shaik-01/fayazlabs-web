/**
 * Single place where the auth tokens live in the browser.
 * Stored as JSON under the same localStorage key the app already used, with
 * `sessionId` added. Old entries without `sessionId` keep working.
 */

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
}

export interface AuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const AUTH_STORAGE_KEY = "fayazlabs_auth";

let storageOverride: AuthStorage | null = null;
const memory = new Map<string, string>();
const memoryStorage: AuthStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => void memory.set(k, v),
  removeItem: (k) => void memory.delete(k),
};

/** For tests: swap the storage backend. Pass null to restore the default. */
export function setAuthStorage(storage: AuthStorage | null) {
  storageOverride = storage;
}

function getStorage(): AuthStorage {
  if (storageOverride) return storageOverride;
  if (typeof window !== "undefined") {
    try {
      return window.localStorage;
    } catch {
      // storage blocked
    }
  }
  return memoryStorage;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let crossTabAttached = false;

function emit() {
  listeners.forEach((l) => l());
}

/** Subscribe to token changes (login, refresh, clear, other tabs). */
export function subscribeAuth(listener: Listener): () => void {
  listeners.add(listener);
  if (!crossTabAttached && typeof window !== "undefined") {
    crossTabAttached = true;
    window.addEventListener("storage", (e) => {
      if (e.key === AUTH_STORAGE_KEY) emit();
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = getStorage().getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.accessToken && parsed?.refreshToken) {
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        sessionId: parsed.sessionId ?? undefined,
      };
    }
  } catch {
    // corrupted entry
  }
  return null;
}

export function saveAuth(auth: StoredAuth) {
  try {
    getStorage().setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // storage full or blocked; the in-memory React state still works
  }
  emit();
}

export function clearAuth() {
  try {
    getStorage().removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

export function getAccessToken(): string | null {
  return getStoredAuth()?.accessToken ?? null;
}
