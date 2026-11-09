import type { Feature } from "@/lib/course/types";

export interface Plan {
  code: string;
  name: string;
  amountPaise: number;
  currency: string;
  period: string;
  features: string[];
}

export interface Subscription {
  status: string;
  planCode: string;
  validUntil: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface AccessResponse {
  subscription: Subscription | null;
  features: Feature[] | string[];
}

export interface CheckoutResponse {
  provider: "razorpay";
  subscriptionId: string;
  keyId: string | null;
  planCode: string;
}

export interface CancelResponse {
  status: string;
  validUntil: string | null;
}

export interface ContentGrant {
  itemId: string;
  feature: string;
  access: { mode: "public" | "signed"; baseUrl: string; query: string; expiresAt: string };
  key: string | null;
}
