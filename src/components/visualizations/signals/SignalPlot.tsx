"use client";

import { useState, useMemo, useCallback } from "react";
import { compile, type EvalFunction } from "mathjs";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

interface SignalDef {
  expr: string;
  label?: string;
  color?: string;
  type?: "continuous" | "discrete";
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

interface SignalPlotProps {
  readonly signals: SignalDef[];
  readonly params?: ParamDef[];
  readonly tRange?: [number, number];
  readonly yRange?: [number, number];
  readonly tLabel?: string;
  readonly yLabel?: string;
  readonly title?: string;
  readonly samples?: number;
  readonly discreteRange?: [number, number];
  readonly showGrid?: boolean;
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

// ── Component ───────────────────────────────────────────────────────────

export default function SignalPlot({
  signals,
  params = [],
  tRange = [-5, 5],
  yRange,
  tLabel = "t",
  yLabel = "x(t)",
  title,
  samples = 500,
  discreteRange,
  showGrid = true,
}: SignalPlotProps) {
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

  const traces = useMemo<Data[]>(() => {
    return signals.map((sig, idx) => {
      const isDiscrete = sig.type === "discrete";
      const color = sig.color ?? COLORS[idx % COLORS.length];

      let compiled: EvalFunction | null = null;
      try {
        compiled = compile(sig.expr);
      } catch {
        return {
          x: [],
          y: [],
          type: "scatter" as const,
          mode: "lines" as const,
          name: sig.label ?? sig.expr,
          line: { color },
          visible: sig.visible !== false,
        };
      }

      if (isDiscrete) {
        const [nMin, nMax] = discreteRange ?? [Math.floor(tRange[0]), Math.ceil(tRange[1])];
        const nValues: number[] = [];
        const yValues: (number | null)[] = [];

        for (let n = nMin; n <= nMax; n++) {
          nValues.push(n);
          try {
            const scope = { n, t: n, x: n, ...paramValues };
            const result = compiled!.evaluate(scope);
            const val = typeof result === "number" ? result : Number(result);
            yValues.push(Number.isFinite(val) ? val : null);
          } catch {
            yValues.push(null);
          }
        }

        return {
          x: nValues,
          y: yValues,
          type: "scatter" as const,
          mode: "lines+markers" as const,
          name: sig.label ?? sig.expr,
          marker: {
            color,
            size: 8,
            symbol: "circle",
            line: { width: 1, color: "rgba(0,0,0,0.3)" },
          },
          line: {
            color,
            width: 0,
          },
          visible: sig.visible !== false,
          connectgaps: false,
        };
      }

      // Continuous signal
      const [tMin, tMax] = tRange;
      const dt = (tMax - tMin) / (samples - 1);
      const tValues: number[] = [];
      const yValues: (number | null)[] = [];

      for (let i = 0; i < samples; i++) {
        const t = tMin + i * dt;
        tValues.push(t);
        try {
          const scope = { t, n: t, x: t, ...paramValues };
          const result = compiled!.evaluate(scope);
          const val = typeof result === "number" ? result : Number(result);
          yValues.push(Number.isFinite(val) ? val : null);
        } catch {
          yValues.push(null);
        }
      }

      return {
        x: tValues,
        y: yValues,
        type: "scatter" as const,
        mode: "lines" as const,
        name: sig.label ?? sig.expr,
        line: { color, width: 2 },
        visible: sig.visible !== false,
        connectgaps: false,
      };
    });
  }, [signals, tRange, discreteRange, samples, paramValues]);

  const layout = useMemo<Partial<Layout>>(() => {
    const hasDiscrete = signals.some((s) => s.type === "discrete");
    const l: Partial<Layout> = {
      xaxis: {
        title: { text: hasDiscrete ? "n" : tLabel },
        range: tRange,
        showgrid: showGrid,
        zeroline: true,
        ...(hasDiscrete ? { dtick: 1 } : {}),
      },
      yaxis: {
        title: { text: hasDiscrete ? "x[n]" : yLabel },
        showgrid: showGrid,
        zeroline: true,
        ...(yRange ? { range: yRange } : {}),
      },
      showlegend: signals.length > 1,
      hovermode: "x unified" as const,
    };
    if (title) {
      l.title = { text: title, font: { size: 14 } };
    }
    return l;
  }, [signals, tLabel, yLabel, tRange, yRange, title, showGrid]);

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
