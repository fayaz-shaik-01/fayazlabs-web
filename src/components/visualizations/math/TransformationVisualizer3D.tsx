"use client";

import { useState, useMemo, useCallback } from "react";
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

interface TransformationVisualizer3DProps {
  readonly matrix?: number[][];
  readonly showOriginal?: boolean;
  readonly showTransformed?: boolean;
  readonly shape?: "cube" | "sphere";
  readonly title?: string;
  readonly params?: ParamDef[];
  readonly range?: number;
}

// ── Geometry generators ─────────────────────────────────────────────────

function generateCubeVertices(): number[][] {
  const verts: number[][] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const x = (i & 1) ? 1 : -1;
    const y = (i & 2) ? 1 : -1;
    const z = (i & 4) ? 1 : -1;
    verts.push([x, y, z]);
  }
  return verts;
}

function generateCubeEdges(): [number, number][] {
  return [
    [0, 1], [2, 3], [4, 5], [6, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
}

function generateSpherePoints(samples: number = 20): number[][] {
  const pts: number[][] = [];
  for (let i = 0; i <= samples; i++) {
    const theta = (Math.PI * i) / samples;
    for (let j = 0; j <= samples; j++) {
      const phi = (2 * Math.PI * j) / samples;
      pts.push([
        Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta),
      ]);
    }
  }
  return pts;
}

function applyTransform(pts: number[][], M: number[][]): number[][] {
  return pts.map(([x, y, z]) => [
    M[0][0] * x + M[0][1] * y + (M[0][2] ?? 0) * z,
    M[1][0] * x + M[1][1] * y + (M[1][2] ?? 0) * z,
    (M[2]?.[0] ?? 0) * x + (M[2]?.[1] ?? 0) * y + (M[2]?.[2] ?? 1) * z,
  ]);
}

// ── Component ───────────────────────────────────────────────────────────

export default function TransformationVisualizer3D({
  matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  showOriginal = true,
  showTransformed = true,
  shape = "cube",
  title,
  params = [],
  range = 3,
}: TransformationVisualizer3DProps) {
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

  const originalPts = useMemo(() => {
    return shape === "sphere" ? generateSpherePoints(12) : generateCubeVertices();
  }, [shape]);

  const transformedPts = useMemo(() => applyTransform(originalPts, matrix), [originalPts, matrix]);

  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];

    if (shape === "cube") {
      const edges = generateCubeEdges();

      if (showOriginal) {
        for (const [a, b] of edges) {
          t.push({
            x: [originalPts[a][0], originalPts[b][0]],
            y: [originalPts[a][1], originalPts[b][1]],
            z: [originalPts[a][2], originalPts[b][2]],
            type: "scatter3d",
            mode: "lines",
            line: { color: "rgba(150,150,150,0.4)", width: 2 },
            showlegend: false,
            hoverinfo: "skip",
          } as Data);
        }
      }

      if (showTransformed) {
        for (const [a, b] of edges) {
          t.push({
            x: [transformedPts[a][0], transformedPts[b][0]],
            y: [transformedPts[a][1], transformedPts[b][1]],
            z: [transformedPts[a][2], transformedPts[b][2]],
            type: "scatter3d",
            mode: "lines",
            line: { color: "#3b82f6", width: 3 },
            showlegend: false,
            hoverinfo: "skip",
          } as Data);
        }
      }
    } else {
      // Sphere — scatter3d
      if (showOriginal) {
        t.push({
          x: originalPts.map((p) => p[0]),
          y: originalPts.map((p) => p[1]),
          z: originalPts.map((p) => p[2]),
          type: "scatter3d",
          mode: "markers",
          marker: { size: 1.5, color: "rgba(150,150,150,0.3)" },
          name: "Original",
          hoverinfo: "skip",
        } as Data);
      }

      if (showTransformed) {
        t.push({
          x: transformedPts.map((p) => p[0]),
          y: transformedPts.map((p) => p[1]),
          z: transformedPts.map((p) => p[2]),
          type: "scatter3d",
          mode: "markers",
          marker: { size: 2, color: "#3b82f6" },
          name: "Transformed",
        } as Data);
      }
    }

    // Basis vectors (transformed)
    const colors = ["#ef4444", "#10b981", "#f59e0b"];
    const labels = ["e₁", "e₂", "e₃"];
    for (let i = 0; i < 3 && i < matrix.length; i++) {
      const bx = matrix[0][i] ?? 0;
      const by = matrix[1]?.[i] ?? 0;
      const bz = matrix[2]?.[i] ?? 0;
      t.push({
        x: [0, bx],
        y: [0, by],
        z: [0, bz],
        type: "scatter3d",
        mode: "lines+markers",
        line: { color: colors[i], width: 4 },
        marker: { size: [2, 6], color: colors[i] },
        name: labels[i],
      } as Data);
    }

    return t;
  }, [shape, originalPts, transformedPts, showOriginal, showTransformed, matrix]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      scene: {
        xaxis: { range: [-range, range], title: { text: "x" } },
        yaxis: { range: [-range, range], title: { text: "y" } },
        zaxis: { range: [-range, range], title: { text: "z" } },
        aspectmode: "cube",
      },
      showlegend: true,
      ...(title ? { title: { text: title, font: { size: 14 } } } : {}),
    }),
    [range, title],
  );

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper data={traces} layout={layout} className="w-full" style={{ height: 480 }} />

      <div className="flex items-center justify-center gap-4 text-xs font-mono text-muted-foreground">
        <span>
          M = [{matrix.map((r) => `[${r.map((v) => v.toFixed(1)).join(", ")}]`).join(", ")}]
        </span>
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
