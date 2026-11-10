import type { Metadata } from "next";
import { VisualizationGallery } from "./gallery";

export const metadata: Metadata = {
  title: "Visualization Gallery — Interactive Components",
  description:
    "Browse all 40 interactive visualization components used across the FayazLabs learning platform.",
};

export default function VisualizationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-16 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Visualization Gallery
        </h1>
        <p className="mt-2 text-muted-foreground">
          All 40 interactive visualization components. Click any card to expand
          a live preview.
        </p>
      </div>
      <VisualizationGallery />
    </div>
  );
}
