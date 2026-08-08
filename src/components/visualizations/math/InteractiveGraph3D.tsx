"use client";

import { useState, useMemo, useCallback } from "react";
import { compile, type EvalFunction } from "mathjs";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

interface ParamDef {
  name: string;
  label?: string;
  min: number;
  max: number;
  step?: number;
  default: number;
  unit?: string;
}

interface InteractiveGraph3DProps {
  readonly expr: string;
  readonly params?: ParamDef[];
  readonly xRange?: [number, number];
  readonly yRange?: [number, number];
  readonly zRange?: [number, number];
  readonly xLabel?: string;
  readonly yLabel?: string;
  readonly zLabel?: string;
  readonly title?: string;
  readonly samples?: number;
  readonly colorscale?: string;
  readonly plotType?: "surface" | "contour";
  readonly showContourLines?: boolean;
  readonly opacity?: number;
}

// ── Component ───────────────────────────────────────────────────────────

export default function InteractiveGraph3D({
  expr,
  params = [],
  xRange = [-5, 5],
  yRange = [-5, 5],
  zRange,
  xLabel = "x",
  yLabel = "y",
  zLabel = "z",
  title,
  samples = 60,
  colorscale = "Viridis",
  plotType = "surface",
  showContourLines = false,
  opacity = 1,
}: InteractiveGraph3DProps) {
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

  // Generate grid
  const { xGrid, yGrid } = useMemo(() => {
    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;
    const dxStep = (xMax - xMin) / (samples - 1);
    const dyStep = (yMax - yMin) / (samples - 1);
    const xs = Array.from({ length: samples }, (_, i) => xMin + i * dxStep);
    const ys = Array.from({ length: samples }, (_, i) => yMin + i * dyStep);
    return { xGrid: xs, yGrid: ys };
  }, [xRange, yRange, samples]);

  // Evaluate z = f(x, y, params)
  const zGrid = useMemo(() => {
    let compiled: EvalFunction | null = null;
    try {
      compiled = compile(expr);
    } catch {
      return xGrid.map(() => yGrid.map(() => Number.NaN));
    }

    return yGrid.map((y) =>
      xGrid.map((x) => {
        try {
          const scope = { x, y, ...paramValues };
          const result = compiled!.evaluate(scope);
          const val = typeof result === "number" ? result : Number(result);
          return Number.isFinite(val) ? val : Number.NaN;
        } catch {
          return Number.NaN;
        }
      }),
    );
  }, [expr, xGrid, yGrid, paramValues]);

  const traces = useMemo<Data[]>(() => {
    if (plotType === "contour") {
      return [
        {
          x: xGrid,
          y: yGrid,
          z: zGrid,
          type: "contour",
          colorscale,
          contours: {
            coloring: "heatmap",
          },
          colorbar: { len: 0.6, thickness: 15 },
        } as Data,
      ];
    }

    return [
      {
        x: xGrid,
        y: yGrid,
        z: zGrid,
        type: "surface",
        colorscale,
        opacity,
        colorbar: { len: 0.6, thickness: 15 },
      } as Data,
    ];
  }, [xGrid, yGrid, zGrid, plotType, colorscale, showContourLines, opacity]);

  const layout = useMemo<Partial<Layout>>(() => {
    const base: Partial<Layout> = {
      hovermode: "closest" as const,
    };

    if (plotType === "surface") {
      (base as any).scene = {
        xaxis: { title: { text: xLabel } },
        yaxis: { title: { text: yLabel } },
        zaxis: {
          title: { text: zLabel },
          ...(zRange ? { range: zRange } : {}),
        },
        camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } },
      };
    } else {
      base.xaxis = { title: { text: xLabel }, range: xRange };
      base.yaxis = { title: { text: yLabel }, range: yRange };
    }

    if (title) {
      base.title = { text: title, font: { size: 14 } };
    }

    return base;
  }, [xLabel, yLabel, zLabel, xRange, yRange, zRange, title, plotType]);

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper
        data={traces}
        layout={layout}
        className="w-full"
        style={{ height: 480 }}
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
