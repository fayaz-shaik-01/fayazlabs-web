import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { listProfiles, listAnalyses } from "@/lib/tax/api";
import type { TaxAnalysisResponse, ProfileSummaryResponse } from "@/lib/tax/types";

export const metadata: Metadata = { title: "Insights — Tax Intelligence" };

function fmt(n: number | null): string {
  if (n === null) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function pct(n: number | null): string {
  if (n === null) return "—";
  return `${Number(n).toFixed(2)}%`;
}

function AnalysisCard({ a }: Readonly<{ a: TaxAnalysisResponse }>) {
  const recommended = a.recommendedRegime ?? "—";
  return (
    <div className="rounded-[2px] border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold font-heading text-sm">FY {a.taxYear}</span>
        <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
          {recommended} Recommended
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Old Regime Tax</p>
          <p className="font-semibold text-sm">{fmt(a.oldRegimeTax)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">New Regime Tax</p>
          <p className="font-semibold text-sm">{fmt(a.newRegimeTax)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Taxable Income</p>
          <p className="font-semibold text-sm">{fmt(a.taxableIncome)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Deductions</p>
          <p className="font-semibold text-sm">{fmt(a.totalDeductions)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Effective Rate</p>
          <p className="font-semibold text-sm">{pct(a.effectiveTaxRate)}</p>
        </div>
      </div>
      {a.insightsJson && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Raw AI Insights
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-[2px] bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {typeof a.insightsJson === "string"
              ? a.insightsJson
              : JSON.stringify(a.insightsJson, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export default async function InsightsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tax-token")!.value;

  let profiles: ProfileSummaryResponse[] = [];
  let analyses: TaxAnalysisResponse[] = [];
  let fetchError: string | null = null;

  try {
    profiles = await listProfiles(token);
    if (profiles.length > 0) {
      const latestYear = profiles[0].taxYear;
      analyses = await listAnalyses(token, latestYear);
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load insights";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Tax Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated analysis of your financial profile
          </p>
        </div>
      </div>

      {fetchError && (
        <p className="rounded-[2px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </p>
      )}

      {profiles.length === 0 && !fetchError && (
        <div className="rounded-[2px] border border-dashed border-border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No financial profiles found.</p>
          <Link
            href="/tax/documents"
            className="inline-flex items-center justify-center rounded-[2px] bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upload documents first
          </Link>
        </div>
      )}

      {analyses.length === 0 && profiles.length > 0 && !fetchError && (
        <div className="rounded-[2px] border border-dashed border-border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No analysis generated yet.</p>
          <p className="text-xs text-muted-foreground">
            Insights are generated automatically after document processing or you can trigger it manually via API.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {analyses.map((a) => (
          <AnalysisCard key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}
