"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import type { Data, Layout, Config } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// ── Theme-aware layout defaults ─────────────────────────────────────────

function getDarkLayout(): Partial<Layout> {
  return {
    paper_bgcolor: "transparent",
    plot_bgcolor: "rgba(255,255,255,0.02)",
    font: { color: "#d4d4d8", family: "var(--font-mono, monospace)", size: 12 },
    xaxis: {
      gridcolor: "rgba(255,255,255,0.06)",
      zerolinecolor: "rgba(255,255,255,0.12)",
      linecolor: "rgba(255,255,255,0.1)",
    },
    yaxis: {
      gridcolor: "rgba(255,255,255,0.06)",
      zerolinecolor: "rgba(255,255,255,0.12)",
      linecolor: "rgba(255,255,255,0.1)",
    },
    legend: {
      bgcolor: "transparent",
      font: { color: "#a1a1aa" },
    },
  };
}

function getLightLayout(): Partial<Layout> {
  return {
    paper_bgcolor: "transparent",
    plot_bgcolor: "rgba(0,0,0,0.01)",
    font: { color: "#3f3f46", family: "var(--font-mono, monospace)", size: 12 },
    xaxis: {
      gridcolor: "rgba(0,0,0,0.06)",
      zerolinecolor: "rgba(0,0,0,0.15)",
      linecolor: "rgba(0,0,0,0.1)",
    },
    yaxis: {
      gridcolor: "rgba(0,0,0,0.06)",
      zerolinecolor: "rgba(0,0,0,0.15)",
      linecolor: "rgba(0,0,0,0.1)",
    },
    legend: {
      bgcolor: "transparent",
      font: { color: "#52525b" },
    },
  };
}

// ── Default Plotly config ───────────────────────────────────────────────

const defaultConfig: Partial<Config> = {
  responsive: true,
  displayModeBar: true,
  modeBarButtonsToRemove: [
    "sendDataToCloud",
    "lasso2d",
    "select2d",
    "autoScale2d",
  ],
  displaylogo: false,
  toImageButtonOptions: {
    format: "png",
    width: 1200,
    height: 800,
    scale: 2,
  },
};

// ── Component ───────────────────────────────────────────────────────────

interface PlotlyWrapperProps {
  readonly data: Data[];
  readonly layout?: Partial<Layout>;
  readonly config?: Partial<Config>;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly onHover?: PlotParams["onHover"];
  readonly onClick?: PlotParams["onClick"];
}

export default function PlotlyWrapper({
  data,
  layout = {},
  config = {},
  className,
  style,
  onHover,
  onClick,
}: PlotlyWrapperProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const mergedLayout = useMemo<Partial<Layout>>(() => {
    const themeLayout = isDark ? getDarkLayout() : getLightLayout();
    return {
      ...themeLayout,
      ...layout,
      margin: { t: 30, r: 20, b: 50, l: 60, ...layout.margin },
      autosize: true,
      xaxis: { ...themeLayout.xaxis, ...layout.xaxis },
      yaxis: { ...themeLayout.yaxis, ...layout.yaxis },
      font: { ...themeLayout.font, ...layout.font },
      legend: { ...themeLayout.legend, ...layout.legend },
    };
  }, [isDark, layout]);

  const mergedConfig = useMemo<Partial<Config>>(
    () => ({ ...defaultConfig, ...config }),
    [config],
  );

  return (
    <div className={className} style={style}>
      <Plot
        data={data}
        layout={mergedLayout}
        config={mergedConfig}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
        onHover={onHover}
        onClick={onClick}
      />
    </div>
  );
}
