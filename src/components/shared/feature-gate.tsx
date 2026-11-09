import { notFound } from "next/navigation";
import { isFeatureEnabled, type FeatureName } from "@/lib/features";

/** Server-side gate: renders children only when the feature flag is on. */
export function FeatureGate({
  feature,
  children,
}: Readonly<{ feature: FeatureName; children: React.ReactNode }>) {
  if (!isFeatureEnabled(feature)) notFound();
  return <>{children}</>;
}
