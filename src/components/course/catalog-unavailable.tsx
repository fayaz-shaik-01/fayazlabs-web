"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shown when the course catalog cannot be fetched or parsed. Never a stand-in catalog. */
export function CatalogUnavailable() {
  const router = useRouter();
  return (
    <div role="alert" data-testid="catalog-unavailable" className="mx-auto max-w-xl px-4 pt-40 pb-24 text-center sm:px-6">
      <h1 className="text-heading-xl text-foreground">The course is temporarily unavailable</h1>
      <p className="mt-3 text-body-lg text-muted-foreground">We couldn&apos;t load the course list just now. Please try again in a moment.</p>
      <button type="button" onClick={() => router.refresh()} className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
        Try again
      </button>
    </div>
  );
}
