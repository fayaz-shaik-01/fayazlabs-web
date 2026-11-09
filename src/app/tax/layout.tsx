import { FeatureGate } from "@/components/shared/feature-gate";

// Hidden unless NEXT_PUBLIC_FEATURE_* is set (see src/lib/features.ts).
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <FeatureGate feature="tax">{children}</FeatureGate>;
}
