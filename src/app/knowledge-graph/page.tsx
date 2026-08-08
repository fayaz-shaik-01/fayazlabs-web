import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { KnowledgeGraphView } from "@/components/knowledge/knowledge-graph-view";

const title = "Knowledge Graph";
const description = "Visualize concept relationships and learning dependencies across all tracks.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: `${siteConfig.url}/knowledge-graph`, siteName: siteConfig.name, type: "website" },
  alternates: { canonical: `${siteConfig.url}/knowledge-graph` },
};

export default function KnowledgeGraphPage() {
  return <KnowledgeGraphView />;
}
