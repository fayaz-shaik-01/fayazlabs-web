const PLATFORM_URL =
  process.env.PLATFORM_URL ??
  process.env.NEXT_PUBLIC_PLATFORM_URL ??
  "http://localhost:8080";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("fayazlabs_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${PLATFORM_URL}${path}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    let code: string | undefined;
    try {
      const json = JSON.parse(text);
      code = json.error?.code;
    } catch {
      // not JSON
    }
    throw new ApiError(
      `Request failed (${res.status}): ${text}`,
      res.status,
      code,
    );
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export { ApiError, PLATFORM_URL };
