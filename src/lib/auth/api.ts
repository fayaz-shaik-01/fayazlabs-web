import { PLATFORM_URL, isMockApi } from "@/lib/course-api/config";
import { mockAuthRequest } from "@/lib/course-api/mock";

export interface UserInfo {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  avatarUrl: string | null;
  authProvider: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /** Present once the backend supports single-device sessions. */
  sessionId?: string;
  user: UserInfo;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: { code: string; message: string } | null;
}

export class AuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
}

async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let status: number;
  let json: unknown;

  if (isMockApi()) {
    const headers = (options.headers ?? {}) as Record<string, string>;
    const token = headers.Authorization?.replace(/^Bearer /, "") ?? null;
    const body = options.body ? JSON.parse(String(options.body)) : undefined;
    const res = await mockAuthRequest<unknown>(options.method ?? "GET", path, body, token);
    status = res.status;
    json = res.body;
  } else {
    const res = await fetch(`${PLATFORM_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    status = res.status;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  }

  const body = (json ?? {}) as Record<string, unknown>;

  // Older backend: { success, data, error } envelope.
  if ("success" in body) {
    const env = body as unknown as ApiResponse<T>;
    if (!env.success || !env.data) {
      throw new AuthError(
        env.error?.message ?? env.message ?? "Request failed",
        env.error?.code ?? "UNKNOWN",
      );
    }
    return env.data;
  }

  // Newer backend: the raw JSON from the contract.
  if (status >= 200 && status < 300 && json) return json as T;
  throw new AuthError(
    (body.message as string | undefined) ?? "Request failed",
    (body.code as string | undefined) ?? "UNKNOWN",
  );
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogle(
  idToken: string,
): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<AuthResponse> {
  return authFetch<AuthResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}

export async function fetchMe(accessToken: string): Promise<UserInfo> {
  return authFetch<UserInfo>("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function logout(
  refreshTokenValue: string,
  accessToken?: string | null,
): Promise<void> {
  if (isMockApi()) return;
  try {
    await fetch(`${PLATFORM_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });
  } catch {
    // best effort
  }
}
