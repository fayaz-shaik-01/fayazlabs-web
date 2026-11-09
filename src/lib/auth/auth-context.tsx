"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthResponse, UserInfo } from "./api";
import * as authApi from "./api";
import {
  clearAuth,
  getStoredAuth,
  saveAuth,
  subscribeAuth,
} from "./token-store";
import { setSessionNotice } from "@/lib/course-api/session-notice";

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SIGNED_OUT: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  sessionId: null,
  isLoading: false,
  isAuthenticated: false,
};

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    sessionId: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setAuthFromResponse = useCallback((res: AuthResponse) => {
    saveAuth({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      sessionId: res.sessionId,
    });
    setState({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      sessionId: res.sessionId ?? null,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  // restore session on mount
  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      // Nothing stored: not signed in. (Deferred so it is not a synchronous
      // setState inside the effect body.)
      queueMicrotask(() => setState((s) => ({ ...s, isLoading: false })));
      return;
    }

    authApi
      .fetchMe(stored.accessToken)
      .then((user) => {
        setState({
          user,
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          sessionId: stored.sessionId ?? null,
          isLoading: false,
          isAuthenticated: true,
        });
      })
      .catch(() => {
        // try refresh
        authApi
          .refreshToken(stored.refreshToken)
          .then((res) => {
            setAuthFromResponse(res);
          })
          .catch((err: unknown) => {
            // The server says this account was used somewhere else.
            if (err instanceof authApi.AuthError && err.code === "SESSION_REVOKED") {
              setSessionNotice("revoked");
            }
            clearAuth();
            setState(SIGNED_OUT);
          });
      });
  }, [setAuthFromResponse]);

  const loginFn = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      setAuthFromResponse(res);
    },
    [setAuthFromResponse],
  );

  const registerFn = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await authApi.register(email, password, displayName);
      setAuthFromResponse(res);
    },
    [setAuthFromResponse],
  );

  const loginWithGoogleFn = useCallback(
    async (idToken: string) => {
      const res = await authApi.loginWithGoogle(idToken);
      setAuthFromResponse(res);
    },
    [setAuthFromResponse],
  );

  const logoutFn = useCallback(async () => {
    if (state.refreshToken) {
      await authApi.logout(state.refreshToken, state.accessToken);
    }
    clearAuth();
    setState(SIGNED_OUT);
  }, [state.refreshToken, state.accessToken]);

  // Stay in sync when the API client refreshes tokens or signs the user out
  // (e.g. SESSION_REVOKED from a heartbeat), or another tab does.
  useEffect(() => {
    return subscribeAuth(() => {
      const stored = getStoredAuth();
      setState((prev) => {
        if (!stored) return prev.isAuthenticated || prev.accessToken ? SIGNED_OUT : prev;
        if (prev.accessToken === stored.accessToken) return prev;
        return {
          ...prev,
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          sessionId: stored.sessionId ?? null,
        };
      });
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: loginFn,
      register: registerFn,
      loginWithGoogle: loginWithGoogleFn,
      logout: logoutFn,
    }),
    [state, loginFn, registerFn, loginWithGoogleFn, logoutFn],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
