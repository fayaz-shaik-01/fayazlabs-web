import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
      <div className="relative">
        <span className="text-[120px] font-bold leading-none tracking-tighter text-primary/[0.06] sm:text-[180px]">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-4">
            <h1 className="text-heading-xl">
              Page not found
            </h1>
            <p className="text-body text-muted-foreground max-w-md">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved. Let&apos;s get you back on track.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "gap-2"
          )}
        >
          <Home className="h-4 w-4" />
          Back Home
        </Link>
        <Link
          href="/projects"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "gap-2 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          View Projects
        </Link>
      </div>
    </div>
  );
}
