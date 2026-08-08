export default function ExamLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="rounded-xl border border-border p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-4">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-10 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
