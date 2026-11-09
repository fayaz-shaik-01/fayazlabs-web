/**
 * In-browser mock of the backend contract, enabled with NEXT_PUBLIC_API_MOCK=1.
 * Lets the whole UI be exercised without the real backend.
 *
 * Mock rules:
 *  - Any email/password signs in. An email containing "paid" gets the paid plan.
 *  - Set localStorage["fayazlabs_mock_revoked"] = "1" to simulate the account
 *    being used on another device: heartbeat, refresh and any authed call then
 *    answer 401 SESSION_REVOKED.
 *  - Plans here are fixtures for testing only. The UI never hardcodes prices.
 */
import type { Transport, TransportRequest, TransportResponse } from "./client";

const REVOKED_KEY = "fayazlabs_mock_revoked";
const STATE_KEY = "fayazlabs_mock_state";

interface MockState {
  email: string;
  planCode: string; // "free" | "pro_monthly"
  cancelAtPeriodEnd: boolean;
  counter: number;
}

const PLANS = [
  { code: "free", name: "Free", amountPaise: 0, currency: "INR", period: "forever", features: ["free"] },
  {
    code: "pro_monthly",
    name: "Pro",
    amountPaise: 49900,
    currency: "INR",
    period: "month",
    features: ["free", "lessons.paid", "audio.paid", "practice.labs"],
  },
];

function ls(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function loadState(): MockState {
  try {
    const raw = ls()?.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return { email: "", planCode: "free", cancelAtPeriodEnd: false, counter: 0 };
}

function saveState(s: MockState) {
  ls()?.setItem(STATE_KEY, JSON.stringify(s));
}

const isRevoked = () => ls()?.getItem(REVOKED_KEY) === "1";

const ok = (body: unknown, status = 200): TransportResponse => ({ status, body });
const revoked = (): TransportResponse => ({
  status: 401,
  body: {
    code: "SESSION_REVOKED",
    message: "This session was ended because the account signed in on another device.",
  },
});

function authPayload(state: MockState) {
  state.counter += 1;
  saveState(state);
  return {
    accessToken: `mock-access-${state.counter}`,
    refreshToken: `mock-refresh-${state.counter}`,
    expiresIn: 900,
    sessionId: "mock-session-1",
    user: {
      id: 1,
      email: state.email,
      displayName: state.email.split("@")[0] || "Mock user",
      role: "USER",
      avatarUrl: null,
      authProvider: "LOCAL",
    },
  };
}

function signIn(email: string): TransportResponse {
  const state = loadState();
  state.email = email || "mock@example.com";
  state.planCode = state.email.includes("paid") ? "pro_monthly" : "free";
  state.cancelAtPeriodEnd = false;
  ls()?.removeItem(REVOKED_KEY);
  return ok(authPayload(state));
}

export const mockTransport: Transport = async (req: TransportRequest) => {
  const { method, path, body, token } = req;
  const b = (body ?? {}) as Record<string, unknown>;

  if (method === "GET" && path === "/plans") return ok(PLANS);

  if (method === "POST" && (path === "/auth/login" || path === "/auth/register")) {
    return signIn(String(b.email ?? ""));
  }
  if (method === "POST" && path === "/auth/google") return signIn("google-user@example.com");
  if (method === "POST" && path === "/auth/logout") return ok(undefined, 204);

  if (method === "POST" && path === "/auth/refresh") {
    if (isRevoked()) return revoked();
    const state = loadState();
    if (!state.email || !String(b.refreshToken ?? "").startsWith("mock-refresh-")) {
      return { status: 401, body: { code: "REFRESH_INVALID", message: "Refresh token is not valid." } };
    }
    return ok(authPayload(state));
  }

  // Everything below needs a signed-in user.
  if (!token) return { status: 401, body: { message: "Login required" } };
  if (isRevoked()) return revoked();

  const state = loadState();
  const paid = state.planCode !== "free";

  if (method === "GET" && path === "/auth/heartbeat") return ok({ status: "active" });

  if (method === "GET" && path === "/auth/me") {
    return ok({
      id: 1,
      email: state.email,
      displayName: state.email.split("@")[0],
      role: "USER",
      avatarUrl: null,
      authProvider: "LOCAL",
    });
  }

  if (method === "GET" && path === "/me/access") {
    return ok({
      subscription: paid
        ? {
            status: "active",
            planCode: state.planCode,
            validUntil: new Date(Date.now() + 30 * 86_400_000).toISOString(),
            cancelAtPeriodEnd: state.cancelAtPeriodEnd,
          }
        : null,
      features: paid ? ["free", "lessons.paid", "audio.paid", "practice.labs"] : ["free"],
    });
  }

  if (method === "POST" && path === "/billing/checkout") {
    // No keyId in mock mode: the pricing page then shows a message instead of Razorpay.
    return ok({ provider: "razorpay", subscriptionId: "sub_mock", keyId: null, planCode: String(b.planCode ?? "") });
  }

  if (method === "POST" && path === "/billing/cancel") {
    state.cancelAtPeriodEnd = true;
    saveState(state);
    return ok({ status: "active", validUntil: new Date(Date.now() + 30 * 86_400_000).toISOString() });
  }

  if (method === "POST" && path === "/content/grant") {
    const itemId = String(b.itemId ?? "");
    if (!paid && !itemId.startsWith("L0")) {
      return {
        status: 403,
        body: { code: "FEATURE_REQUIRED", feature: "lessons.paid", upgradeHint: "/pricing" },
      };
    }
    // Test hook: localStorage["fayazlabs_mock_grant"] = {baseUrl, key, ttlMs?, query?}
    let override: { baseUrl?: string; key?: string; ttlMs?: number; query?: string } = {};
    try {
      override = JSON.parse(ls()?.getItem("fayazlabs_mock_grant") ?? "{}");
    } catch {
      // ignore a malformed hook
    }
    return ok({
      itemId,
      feature: itemId.startsWith("L0") ? "free" : "lessons.paid",
      access: {
        mode: override.key ? "signed" : "public",
        baseUrl: override.baseUrl ?? "https://example.invalid/mock",
        query: override.query ?? "",
        expiresAt: new Date(Date.now() + (override.ttlMs ?? 600_000)).toISOString(),
      },
      key: override.key ?? null,
    });
  }

  return { status: 404, body: { message: `No mock for ${method} ${path}` } };
};

/** For auth/api.ts: run the legacy-shaped auth calls through the mock. */
export async function mockAuthRequest<T>(
  method: string,
  apiPath: string,
  body: unknown,
  token: string | null,
): Promise<{ status: number; body: T }> {
  const res = await mockTransport({ method, path: apiPath.replace(/^\/api/, ""), body, token });
  return { status: res.status, body: res.body as T };
}
