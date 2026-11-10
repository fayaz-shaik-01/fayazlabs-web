"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/course-api/errors";
import { getPlans, startCheckout } from "@/lib/course-api/endpoints";
import { useAccess } from "@/lib/course-api/hooks";
import { openRazorpay } from "@/lib/course-api/razorpay";
import { formatAmount } from "@/lib/course-api/format";
import type { Plan } from "@/lib/course-api/types";

const FEATURE_LABELS: Record<string, string> = {
  free: "Free lessons (Level 0)",
  "lessons.paid": "All paid lessons (Levels 1 to 3)",
  "audio.paid": "Audio",
  "practice.labs": "Hands-on labs",
};

export function PricingClient() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const access = useAccess();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getPlans()
      .then((p) => !cancelled && setPlans(p))
      .catch(() => !cancelled && setError("Could not load the plans. Please try again in a moment."));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  async function subscribe(plan: Plan) {
    setMessage(null);
    if (!isAuthenticated) {
      router.push("/login?next=/pricing");
      return;
    }
    setBusy(plan.code);
    try {
      const checkout = await startCheckout(plan.code);
      if (!checkout.keyId) {
        setMessage("Checkout is not available in this environment (mock mode). No payment was started.");
        return;
      }
      await openRazorpay({
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        name: "Fayaz Labs",
        description: plan.name,
        prefill: { name: user?.displayName ?? undefined, email: user?.email },
        handler: () => {
          access.reload();
          router.push("/account?checkout=done");
        },
        modal: { ondismiss: () => setBusy(null) },
      });
    } catch (err) {
      setMessage(
        err instanceof ApiError && err.status !== 401
          ? err.message
          : "Something went wrong starting checkout. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <div role="alert" data-testid="pricing-error" className="panel max-w-xl p-6">
        <h2 className="text-heading-md text-foreground">Plans are not available right now</h2>
        <p className="mt-2 text-base text-muted-foreground">{error}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link href="/learning/ai-product-testing" className="text-sm font-semibold text-primary hover:underline">
            Start with the free lessons →
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Contact me
          </Link>
        </div>
      </div>
    );
  }
  if (!plans) return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />;

  const currentPlan = access.subscription?.planCode;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isFree = plan.amountPaise === 0;
          const isCurrent = isFree ? isAuthenticated && !currentPlan : currentPlan === plan.code;
          return (
            <article
              key={plan.code}
              data-testid={`plan-${plan.code}`}
              className="panel flex flex-col p-6"
            >
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-heading-md text-foreground">{plan.name}</h2>
                {isCurrent && <Badge variant="secondary">Current plan</Badge>}
              </div>
              <p className="font-heading text-4xl font-bold text-foreground">
                {formatAmount(plan.amountPaise, plan.currency)}
                {!isFree && <span className="ml-1 text-sm font-normal text-muted-foreground">/ {plan.period}</span>}
              </p>
              <ul className="mt-5 mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {FEATURE_LABELS[f] ?? f}
                  </li>
                ))}
              </ul>
              {isFree ? (
                <Link
                  href="/learning/ai-product-testing"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-md")}
                >
                  Start free
                </Link>
              ) : (
                <div>
                  <Button
                    size="lg"
                    className="w-full rounded-md"
                    disabled={busy !== null || isCurrent}
                    onClick={() => subscribe(plan)}
                  >
                    {busy === plan.code && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrent ? "Subscribed" : "Subscribe"}
                  </Button>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    <strong className="font-semibold text-foreground">No refunds.</strong>{" "}
                    <Link href="/legal/refund" className="underline hover:text-foreground">
                      Refund policy
                    </Link>
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {message && (
        <p role="status" data-testid="pricing-message" className="mt-6 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </>
  );
}
