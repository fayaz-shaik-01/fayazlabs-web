import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { FormulaIndex } from "@/components/formulas/formula-index";

const title = "Formula Index — Quick Reference";
const description = "Searchable formula reference with LaTeX rendering across all learning tracks.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: `${siteConfig.url}/formulas`, siteName: siteConfig.name, type: "website" },
  alternates: { canonical: `${siteConfig.url}/formulas` },
};

export default function FormulasPage() {
  return <FormulaIndex />;
}
