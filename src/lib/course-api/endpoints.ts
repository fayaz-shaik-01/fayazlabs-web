import { apiRequest } from "./client";
import type {
  AccessResponse,
  CancelResponse,
  CheckoutResponse,
  ContentGrant,
  Plan,
} from "./types";

export const getPlans = () => apiRequest<Plan[]>("/plans", { auth: false });

export const getAccess = () => apiRequest<AccessResponse>("/me/access");

export const heartbeat = () =>
  apiRequest<{ status: "active" }>("/auth/heartbeat");

export const startCheckout = (planCode: string) =>
  apiRequest<CheckoutResponse>("/billing/checkout", {
    method: "POST",
    body: { planCode },
  });

export const cancelSubscription = () =>
  apiRequest<CancelResponse>("/billing/cancel", { method: "POST" });

export const grantContent = (itemId: string) =>
  apiRequest<ContentGrant>("/content/grant", {
    method: "POST",
    body: { itemId },
  });
