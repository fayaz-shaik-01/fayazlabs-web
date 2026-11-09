export const PLATFORM_URL =
  process.env.PLATFORM_URL ??
  process.env.NEXT_PUBLIC_PLATFORM_URL ??
  "http://localhost:8080";

/** Mock mode lets the UI run without the backend (NEXT_PUBLIC_API_MOCK=1). */
export function isMockApi(): boolean {
  return process.env.NEXT_PUBLIC_API_MOCK === "1";
}

export const HEARTBEAT_INTERVAL_MS = 45_000;
