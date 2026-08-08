export default function FlashcardsLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-60 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-6 space-y-3">
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
