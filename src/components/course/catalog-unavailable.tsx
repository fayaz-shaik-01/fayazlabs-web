"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shown when the course catalog cannot be fetched or parsed. Never a stand-in catalog. */
export function CatalogUnavailable() {
  const router = useRouter();
  return (
    <div role="alert" data-testid="catalog-unavailable" className="mx-auto max-w-xl px-6 pt-40 pb-24 text-center">
      <h1 className="text-2xl font-semibold text-foreground">The course is temporarily unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">We couldn&apos;t load the course list just now. Please try again in a moment.</p>
      <button type="button" onClick={() => router.refresh()} className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-[2px]")}>
        Try again
      </button>
    </div>
  );
}
