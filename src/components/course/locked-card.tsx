import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LockReason } from "@/lib/course/access";
import type { CatalogItem } from "@/lib/course/types";

/** Preview card shown in place of the lesson when the user lacks the feature. */
export function LockedCard({
  item,
  reason,
  returnTo,
}: Readonly<{ item: CatalogItem; reason: Exclude<LockReason, "none">; returnTo: string }>) {
  return (
    <section
      data-testid="locked-card"
      className="rounded-xl border border-border bg-card/50 p-8 text-center"
    >
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-5 w-5" />
      </span>
      <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {item.summary || "This part of the course is part of the paid plan."}
      </p>
      <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
        {reason === "login"
          ? "Sign in to continue, or upgrade to unlock the full course."
          : "Your current plan does not include this. Upgrade to unlock it."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/pricing" className={cn(buttonVariants({ size: "lg" }), "rounded-md")}>
          Upgrade
        </Link>
        {reason === "login" && (
          <Link
            href={`/login?next=${encodeURIComponent(returnTo)}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-md")}
          >
            Sign in
          </Link>
        )}
      </div>
    </section>
  );
}
