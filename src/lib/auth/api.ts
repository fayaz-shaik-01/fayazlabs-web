const PLATFORM_URL =
  process.env.PLATFORM_URL ??
  process.env.NEXT_PUBLIC_PLATFORM_URL ??
  "http://localhost:8080";

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
  const res = await fetch(`${PLATFORM_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !json.data) {
    throw new AuthError(
      json.error?.message ?? json.message ?? "Request failed",
      json.error?.code ?? "UNKNOWN",
    );
  }

  return json.data;
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

export async function logout(refreshTokenValue: string): Promise<void> {
  try {
    await fetch(`${PLATFORM_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });
  } catch {
    // best effort
  }
}
