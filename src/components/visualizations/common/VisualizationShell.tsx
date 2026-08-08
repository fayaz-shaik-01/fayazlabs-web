"use client";

import {
  Component,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type ErrorInfo,
} from "react";
import { cn } from "@/lib/utils";
import {
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────

export type VisualizationCategory =
  | "math"
  | "signals"
  | "control"
  | "circuits"
  | "digital"
  | "mechanics"
  | "algorithms"
  | "biology"
  | "actuators"
  | "finance"
  | "code";

export type VisualizationTechnology =
  | "plotly"
  | "threejs"
  | "svg"
  | "canvas"
  | "react-flow"
  | "pyodide";

interface VisualizationShellProps {
  readonly id: string;
  readonly category?: VisualizationCategory;
  readonly description?: string;
  readonly caption?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

// ── Category badge colors ───────────────────────────────────────────────

const categoryColors: Record<VisualizationCategory, string> = {
  math: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  signals: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  control: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  circuits: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  digital: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  mechanics: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  algorithms: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  biology: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  actuators: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  finance: "bg-green-500/10 text-green-400 border-green-500/20",
  code: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

// ── Error Boundary ──────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class VisualizationErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[VisualizationShell] Render error:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive/60" />
          <p className="text-sm text-muted-foreground">
            Visualization failed to render
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-sm font-mono">
            {this.state.error?.message}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-2 flex items-center gap-1.5 rounded-md border border-border/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/[0.04] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Loading Skeleton ────────────────────────────────────────────────────

export function VisualizationSkeleton() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">Loading visualization...</p>
      </div>
    </div>
  );
}

// ── Shell Component ─────────────────────────────────────────────────────

export function VisualizationShell({
  id,
  category,
  description,
  caption,
  children,
  className,
}: VisualizationShellProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resetKey, setResetKey] = useState(0);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.().catch(() => {
        // Fallback: use CSS fullscreen if API not available
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen?.().catch(() => {
        setIsFullscreen(false);
      });
    }
  }, [isFullscreen]);

  // Sync state with fullscreenchange event
  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  // Register fullscreen listener
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const handleExport = useCallback(() => {
    if (!containerRef.current) return;

    // Find any Plotly plot and trigger download
    const plotEl = containerRef.current.querySelector(
      ".js-plotly-plot",
    ) as HTMLElement | null;

    if (plotEl && typeof (window as any).Plotly !== "undefined") {
      (window as any).Plotly.downloadImage(plotEl, {
        format: "png",
        width: 1200,
        height: 800,
        scale: 2,
        filename: id,
      });
      return;
    }

    // Fallback: find SVG and download
    const svgEl = containerRef.current.querySelector("svg");
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${id}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [id]);

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  return (
    <figure
      ref={containerRef}
      className={cn(
        "group/viz my-6 overflow-hidden rounded-lg border border-border/40",
        "bg-card/50 backdrop-blur-sm",
        isFullscreen && "fixed inset-0 z-50 m-0 rounded-none bg-background",
        className,
      )}
      aria-label={description ?? `Visualization: ${id}`}
    >
      {/* ── Title bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          {category && (
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                categoryColors[category],
              )}
            >
              {category}
            </span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
              {description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/viz:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
            aria-label="Export visualization"
            title="Export as image"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "p-4",
          isFullscreen && "flex items-center justify-center h-[calc(100vh-44px)]",
        )}
      >
        <VisualizationErrorBoundary onReset={handleReset} key={resetKey}>
          {children}
        </VisualizationErrorBoundary>
      </div>

      {/* ── Caption ──────────────────────────────────────────────── */}
      {caption && (
        <figcaption className="border-t border-border/20 px-4 py-2 text-xs text-muted-foreground/70 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
