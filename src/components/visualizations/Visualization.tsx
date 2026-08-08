"use client";

import { Suspense } from "react";
import { getVisualization } from "./registry";
import {
  VisualizationShell,
  VisualizationSkeleton,
} from "./common/VisualizationShell";
import { AlertTriangle } from "lucide-react";

interface VisualizationProps {
  readonly id: string;
  readonly caption?: string;
  readonly className?: string;
  readonly [key: string]: unknown;
}

export default function Visualization({
  id,
  caption,
  className,
  ...config
}: VisualizationProps) {
  const entry = getVisualization(id);

  if (!entry) {
    return (
      <div className="my-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive/60" />
        <div>
          <p className="text-sm font-medium text-destructive/80">
            Unknown visualization: <code className="font-mono">{id}</code>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This component is not registered in the visualization registry.
          </p>
        </div>
      </div>
    );
  }

  const Component = entry.component;

  return (
    <VisualizationShell
      id={id}
      category={entry.category}
      description={entry.description}
      caption={caption}
      className={className}
    >
      <Suspense fallback={<VisualizationSkeleton />}>
        <Component {...config} />
      </Suspense>
    </VisualizationShell>
  );
}
