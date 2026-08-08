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

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
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

const STORAGE_KEY = "fayazlabs_auth";

function loadStoredAuth(): { accessToken: string; refreshToken: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.accessToken && parsed.refreshToken) return parsed;
  } catch {
    // corrupted
  }
  return null;
}

function storeAuth(accessToken: string, refreshToken: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, refreshToken }));
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setAuthFromResponse = useCallback((res: AuthResponse) => {
    storeAuth(res.accessToken, res.refreshToken);
    setState({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  // restore session on mount
  useEffect(() => {
    const stored = loadStoredAuth();
    if (!stored) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    authApi
      .fetchMe(stored.accessToken)
      .then((user) => {
        setState({
          user,
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
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
          .catch(() => {
            clearAuth();
            setState({
              user: null,
              accessToken: null,
              refreshToken: null,
              isLoading: false,
              isAuthenticated: false,
            });
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
      await authApi.logout(state.refreshToken);
    }
    clearAuth();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, [state.refreshToken]);

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
