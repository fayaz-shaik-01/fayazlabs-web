"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/course-api/errors";
import { cancelSubscription, getPlans } from "@/lib/course-api/endpoints";
import { useAccess } from "@/lib/course-api/hooks";
import type { Plan } from "@/lib/course-api/types";

function formatDate(iso: string | null): string {
  if (!iso) return "n/a";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "n/a"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function AccountPage() {
  const { user, sessionId, isAuthenticated, isLoading, logout } = useAuth();
  const access = useAccess();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  async function cancel() {
    if (!window.confirm("Cancel at the end of the current period? You keep access until then.")) return;
    setCancelling(true);
    setMessage(null);
    try {
      const res = await cancelSubscription();
      setMessage(`Cancelled. You keep access until ${formatDate(res.validUntil)}.`);
      access.reload();
    } catch (err) {
      setMessage(err instanceof ApiError && err.status !== 401 ? err.message : "Could not cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading) {
    return <div className="mx-auto max-w-2xl px-6 pt-32"><div className="h-48 animate-pulse rounded-xl bg-muted" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-32 pb-24">
        <h1 className="text-display-lg text-foreground">Account</h1>
        <p className="mt-3 text-sm text-muted-foreground">Sign in to see your plan.</p>
        <Link
          href="/login?next=/account"
          className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-md")}
        >
          Sign in
        </Link>
      </div>
    );
  }

  const sub = access.subscription;
  const planName = sub ? (plans.find((p) => p.code === sub.planCode)?.name ?? sub.planCode) : "Free";

  return (
    <div className="mx-auto max-w-2xl px-6 pt-32 pb-24">
      <h1 className="text-display-lg text-foreground">Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      <section className="mt-8 rounded-xl border border-border bg-card/50 p-6" aria-labelledby="plan-heading">
        <h2 id="plan-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Plan
        </h2>
        {access.status === "loading" ? (
          <div className="mt-4 h-16 animate-pulse rounded bg-muted" aria-busy="true" />
        ) : (
          <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Current plan</dt>
            <dd data-testid="account-plan" className="text-foreground">{planName}</dd>
            {sub && (
              <>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="text-foreground">{sub.status}</dd>
                <dt className="text-muted-foreground">Valid until</dt>
                <dd data-testid="account-valid-until" className="text-foreground">{formatDate(sub.validUntil)}</dd>
              </>
            )}
          </dl>
        )}

        {access.status === "error" && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            Could not load your plan details. Showing the free plan for now.
          </p>
        )}

        {sub?.cancelAtPeriodEnd ? (
          <p className="mt-4 text-sm text-muted-foreground" data-testid="cancel-pending">
            Your plan is set to end on {formatDate(sub.validUntil)}. You keep access until then.
          </p>
        ) : sub ? (
          <div className="mt-5">
            <Button variant="outline" onClick={cancel} disabled={cancelling} className="rounded-md">
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel at period end
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              No refunds. <Link href="/legal/refund" className="underline">Refund policy</Link>
            </p>
          </div>
        ) : (
          <Link href="/pricing" className={cn(buttonVariants({ size: "lg" }), "mt-5 rounded-md")}>
            See plans
          </Link>
        )}

        {message && <p role="status" data-testid="account-message" className="mt-4 text-sm text-foreground">{message}</p>}
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card/50 p-6" aria-labelledby="device-heading">
        <h2 id="device-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          This device
        </h2>
        <p className="mt-3 text-sm text-muted-foreground" data-testid="device-notice">
          You are signed in on this device{sessionId ? ` (session ${sessionId.slice(0, 8)})` : ""}. An account can
          be signed in on one device at a time, so signing in somewhere else will sign this device out.
        </p>
        <Button variant="ghost" onClick={() => logout()} className="mt-4 rounded-md">
          Sign out
        </Button>
      </section>
    </div>
  );
}
