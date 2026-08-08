"use client";

import { useMemo } from "react";
import katex from "katex";

interface LatexRendererProps {
  readonly latex: string;
  readonly display?: boolean;
  readonly className?: string;
}

export function LatexRenderer({ latex, display = true, className }: LatexRendererProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return latex;
    }
  }, [latex, display]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
