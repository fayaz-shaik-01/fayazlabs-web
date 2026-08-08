import { cookies } from "next/headers";
import Link from "next/link";
import { listProfiles } from "@/lib/tax/api";
import type { ProfileSummaryResponse } from "@/lib/tax/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — Tax Intelligence" };

function fmt(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function ProfileCard({ p }: Readonly<{ p: ProfileSummaryResponse }>) {
  return (
    <div className="rounded-[2px] border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold font-heading text-sm">FY {p.taxYear}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            p.isComplete
              ? "bg-green-500/10 text-green-500"
              : "bg-amber-500/10 text-amber-500"
          }`}
        >
          {p.isComplete ? "Complete" : "Incomplete"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Gross Income</p>
          <p className="font-semibold text-sm">{fmt(p.totalGrossIncome)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">TDS Deducted</p>
          <p className="font-semibold text-sm">{fmt(p.totalTdsDeducted)}</p>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Link
          href={`/tax/insights?year=${p.taxYear}`}
          className="flex-1 rounded-[2px] border border-border bg-background px-3 py-1.5 text-center text-xs font-medium hover:bg-accent transition-colors"
        >
          View Insights
        </Link>
        <Link
          href={`/tax/chat?year=${p.taxYear}`}
          className="flex-1 rounded-[2px] bg-primary px-3 py-1.5 text-center text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Ask AI
        </Link>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tax-token")!.value;

  let profiles: ProfileSummaryResponse[] = [];
  let fetchError: string | null = null;

  try {
    profiles = await listProfiles(token);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load profiles";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your financial profiles by tax year
          </p>
        </div>
        <Link
          href="/tax/documents"
          className="rounded-[2px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Upload Documents
        </Link>
      </div>

      {fetchError && (
        <p className="rounded-[2px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </p>
      )}

      {profiles.length === 0 && !fetchError ? (
        <div className="rounded-[2px] border border-dashed border-border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No financial profiles yet.</p>
          <p className="text-sm text-muted-foreground">
            Upload your Form 16 or Form 26AS to get started.
          </p>
          <Link
            href="/tax/documents"
            className="inline-flex items-center justify-center rounded-[2px] bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upload documents
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <ProfileCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
