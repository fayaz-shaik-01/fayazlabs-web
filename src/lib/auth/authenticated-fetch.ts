const PLATFORM_URL =
  process.env.PLATFORM_URL ??
  process.env.NEXT_PUBLIC_PLATFORM_URL ??
  "http://localhost:8080";

const STORAGE_KEY = "fayazlabs_auth";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${PLATFORM_URL}${path}`, {
    ...options,
    headers,
  });
}
