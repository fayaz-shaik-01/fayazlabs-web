"use client";

import { useState, useMemo, useCallback } from "react";
import { multiply, det } from "mathjs";
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
}

interface TransformationVisualizer2DProps {
  readonly matrix?: number[][];
  readonly matrixExpr?: string;
  readonly params?: ParamDef[];
  readonly showGrid?: boolean;
  readonly showEigenvectors?: boolean;
  readonly showUnitCircle?: boolean;
  readonly showDeterminant?: boolean;
  readonly gridDensity?: number;
  readonly range?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function buildMatrix(
  matrixProp: number[][] | undefined,
  matrixExpr: string | undefined,
  paramValues: Record<string, number>,
): number[][] {
  if (matrixProp) return matrixProp;

  if (matrixExpr) {
    try {
      const replaced = matrixExpr.replace(/[a-zA-Z_]\w*/g, (match) =>
        match in paramValues ? String(paramValues[match]) : match,
      );
      const parsed = JSON.parse(replaced);
      if (Array.isArray(parsed) && parsed.length === 2) return parsed;
    } catch {
      // fallback
    }
  }

  return [
    [1, 0],
    [0, 1],
  ];
}

function applyTransform(m: number[][], v: [number, number]): [number, number] {
  const result = multiply(m, v) as number[];
  return [result[0], result[1]];
}

function generateGridLines(density: number, range: number): Array<[number, number][]> {
  const lines: Array<[number, number][]> = [];
  for (let i = -density; i <= density; i++) {
    const t = (i / density) * range;
    // Vertical line
    lines.push([
      [t, -range],
      [t, range],
    ]);
    // Horizontal line
    lines.push([
      [-range, t],
      [range, t],
    ]);
  }
  return lines;
}

function generateUnitCircle(samples: number = 64): Array<[number, number]> {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const theta = (2 * Math.PI * i) / samples;
    return [Math.cos(theta), Math.sin(theta)] as [number, number];
  });
}

// ── Component ───────────────────────────────────────────────────────────

export default function TransformationVisualizer2D({
  matrix: matrixProp,
  matrixExpr,
  params = [],
  showGrid = true,
  showEigenvectors = false,
  showUnitCircle = true,
  showDeterminant = true,
  gridDensity = 5,
  range = 4,
}: TransformationVisualizer2DProps) {
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

  const m = useMemo(
    () => buildMatrix(matrixProp, matrixExpr, paramValues),
    [matrixProp, matrixExpr, paramValues],
  );

  const detVal = useMemo(() => {
    try {
      return det(m) as number;
    } catch {
      return 0;
    }
  }, [m]);

  // Build traces
  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];

    // Original grid
    if (showGrid) {
      const origLines = generateGridLines(gridDensity, range);
      for (const line of origLines) {
        t.push({
          x: line.map((p) => p[0]),
          y: line.map((p) => p[1]),
          type: "scatter",
          mode: "lines",
          line: { color: "rgba(100,100,255,0.15)", width: 1 },
          showlegend: false,
          hoverinfo: "skip",
        } as Data);
      }

      // Transformed grid
      for (const line of origLines) {
        const transformed = line.map((p) => applyTransform(m, p));
        t.push({
          x: transformed.map((p) => p[0]),
          y: transformed.map((p) => p[1]),
          type: "scatter",
          mode: "lines",
          line: { color: "rgba(255,100,100,0.3)", width: 1 },
          showlegend: false,
          hoverinfo: "skip",
        } as Data);
      }
    }

    // Unit circle (original)
    if (showUnitCircle) {
      const circle = generateUnitCircle();
      t.push({
        x: circle.map((p) => p[0]),
        y: circle.map((p) => p[1]),
        type: "scatter",
        mode: "lines",
        line: { color: "#6366f1", width: 2, dash: "dash" },
        name: "Unit Circle",
      } as Data);

      // Transformed unit circle
      const transformedCircle = circle.map((p) => applyTransform(m, p));
      t.push({
        x: transformedCircle.map((p) => p[0]),
        y: transformedCircle.map((p) => p[1]),
        type: "scatter",
        mode: "lines",
        line: { color: "#ef4444", width: 2 },
        name: "Transformed",
      } as Data);
    }

    // Basis vectors (original)
    const basisColors = ["#3b82f6", "#10b981"];
    const basisLabels = ["e₁", "e₂"];
    const basis: [number, number][] = [
      [1, 0],
      [0, 1],
    ];

    for (let i = 0; i < 2; i++) {
      // Original
      t.push({
        x: [0, basis[i][0]],
        y: [0, basis[i][1]],
        type: "scatter",
        mode: "lines+markers",
        line: { color: basisColors[i], width: 3, dash: "dash" },
        marker: { size: 6, symbol: "arrow", angleref: "previous" },
        name: basisLabels[i],
      } as Data);

      // Transformed
      const tv = applyTransform(m, basis[i]);
      t.push({
        x: [0, tv[0]],
        y: [0, tv[1]],
        type: "scatter",
        mode: "lines+markers",
        line: { color: basisColors[i], width: 3 },
        marker: { size: 8, symbol: "arrow", angleref: "previous" },
        name: `T(${basisLabels[i]})`,
      } as Data);
    }

    return t;
  }, [m, showGrid, showUnitCircle, gridDensity, range]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: {
        range: [-range * 1.2, range * 1.2],
        zeroline: true,
        scaleanchor: "y",
        scaleratio: 1,
        title: { text: "x" },
      },
      yaxis: {
        range: [-range * 1.2, range * 1.2],
        zeroline: true,
        title: { text: "y" },
      },
      showlegend: true,
      legend: { x: 1, xanchor: "right" as const, y: 1 },
      hovermode: "closest" as const,
    }),
    [range],
  );

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper
        data={traces}
        layout={layout}
        className="w-full"
        style={{ height: 450 }}
      />

      {/* Matrix display + det */}
      <div className="flex items-center justify-center gap-6 text-sm font-mono">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-muted-foreground">Matrix</span>
          <div className="flex gap-2 text-foreground/90">
            <span>[{m[0].map((v) => v.toFixed(1)).join(", ")}]</span>
            <span>[{m[1].map((v) => v.toFixed(1)).join(", ")}]</span>
          </div>
        </div>
        {showDeterminant && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-muted-foreground">det(A)</span>
            <span className={detVal < 0 ? "text-red-400" : detVal === 0 ? "text-amber-400" : "text-emerald-400"}>
              {detVal.toFixed(2)}
            </span>
          </div>
        )}
      </div>

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
              className="flex-1 min-w-[160px] max-w-[260px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
