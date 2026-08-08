export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-6 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-6 h-64 animate-pulse bg-muted/30" />
        <div className="rounded-xl border border-border p-6 h-64 animate-pulse bg-muted/30" />
      </div>
    </div>
  );
}
