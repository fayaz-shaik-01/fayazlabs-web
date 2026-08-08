export default function LearningLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>

        {/* Track cards skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
