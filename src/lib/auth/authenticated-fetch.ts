import { PLATFORM_URL } from "@/lib/course-api/config";
import { getAccessToken } from "./token-store";

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();
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
