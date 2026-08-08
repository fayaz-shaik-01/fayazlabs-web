"use client";

import { useState, useMemo, useCallback } from "react";
import { compile, type EvalFunction } from "mathjs";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

interface FunctionDef {
  expr: string;
  label?: string;
  color?: string;
  dash?: "solid" | "dash" | "dot" | "dashdot";
  visible?: boolean;
}

interface ParamDef {
  name: string;
  label?: string;
  min: number;
  max: number;
  step?: number;
  default: number;
  unit?: string;
}

interface InteractiveGraph2DProps {
  readonly functions: FunctionDef[];
  readonly params?: ParamDef[];
  readonly xRange?: [number, number];
  readonly yRange?: [number, number];
  readonly xLabel?: string;
  readonly yLabel?: string;
  readonly title?: string;
  readonly samples?: number;
  readonly showGrid?: boolean;
  readonly showLegend?: boolean;
}

// ── Default palette ─────────────────────────────────────────────────────

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

// ── Component ───────────────────────────────────────────────────────────

export default function InteractiveGraph2D({
  functions,
  params = [],
  xRange = [-10, 10],
  yRange,
  xLabel = "x",
  yLabel = "y",
  title,
  samples = 500,
  showGrid = true,
  showLegend = true,
}: InteractiveGraph2DProps) {
  // Build initial param state
  const [paramValues, setParamValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of params) {
      init[p.name] = p.default;
    }
    return init;
  });

  const handleParamChange = useCallback((name: string, value: number) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Generate x values
  const xValues = useMemo(() => {
    const [xMin, xMax] = xRange;
    const dx = (xMax - xMin) / (samples - 1);
    return Array.from({ length: samples }, (_, i) => xMin + i * dx);
  }, [xRange, samples]);

  // Evaluate all functions
  const traces = useMemo<Data[]>(() => {
    return functions.map((fn, idx) => {
      const yValues: (number | null)[] = [];
      let compiled: EvalFunction | null = null;

      try {
        compiled = compile(fn.expr);
      } catch {
        // Invalid expression — return empty trace
        return {
          x: xValues,
          y: xValues.map(() => null),
          type: "scatter" as const,
          mode: "lines" as const,
          name: fn.label ?? fn.expr,
          line: { color: fn.color ?? COLORS[idx % COLORS.length], dash: fn.dash ?? "solid", width: 2 },
          visible: fn.visible !== false,
        };
      }

      for (const x of xValues) {
        try {
          const scope = { x, ...paramValues };
          const result = compiled!.evaluate(scope);
          const val = typeof result === "number" ? result : Number(result);
          yValues.push(Number.isFinite(val) ? val : null);
        } catch {
          yValues.push(null);
        }
      }

      return {
        x: xValues,
        y: yValues,
        type: "scatter" as const,
        mode: "lines" as const,
        name: fn.label ?? fn.expr,
        line: {
          color: fn.color ?? COLORS[idx % COLORS.length],
          dash: fn.dash ?? "solid",
          width: 2,
        },
        visible: fn.visible !== false,
        connectgaps: false,
      };
    });
  }, [functions, xValues, paramValues]);

  // Layout
  const layout = useMemo<Partial<Layout>>(() => {
    const l: Partial<Layout> = {
      xaxis: {
        title: { text: xLabel },
        range: xRange,
        showgrid: showGrid,
        zeroline: true,
      },
      yaxis: {
        title: { text: yLabel },
        showgrid: showGrid,
        zeroline: true,
        ...(yRange ? { range: yRange } : {}),
      },
      showlegend: showLegend && functions.length > 1,
      hovermode: "x unified" as const,
    };
    if (title) {
      l.title = { text: title, font: { size: 14 } };
    }
    return l;
  }, [xLabel, yLabel, xRange, yRange, title, showGrid, showLegend, functions.length]);

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper
        data={traces}
        layout={layout}
        className="w-full"
        style={{ height: 400 }}
      />

      {params.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-3 px-2">
          {params.map((p) => (
            <ParameterSlider
              key={p.name}
              label={p.label ?? p.name}
              min={p.min}
              max={p.max}
              step={p.step}
              value={paramValues[p.name]}
              onChange={(v) => handleParamChange(p.name, v)}
              unit={p.unit}
              className="flex-1 min-w-[160px] max-w-[260px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
