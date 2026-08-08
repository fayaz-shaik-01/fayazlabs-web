import { TaxAuthLayout } from "@/components/tax/tax-auth-layout";
import type { ReactNode } from "react";

export default function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <TaxAuthLayout>{children}</TaxAuthLayout>;
}
