import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-4 pt-24 text-center sm:px-6">
      <span className="chip">Error 404</span>
      <h1 className="mt-5 text-display-lg text-foreground">Page not found</h1>
      <p className="mt-4 max-w-md text-body-lg text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
          <Home className="size-4" />
          Back home
        </Link>
        <Link
          href="/projects"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
        >
          <ArrowLeft className="size-4" />
          View projects
        </Link>
      </div>
    </div>
  );
}
