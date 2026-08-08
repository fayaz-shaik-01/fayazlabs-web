"use client";

import { useState, useMemo, useCallback } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import { compile, type EvalFunction } from "mathjs";
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

interface VectorFieldVisualizerProps {
  readonly fxExpr?: string;
  readonly fyExpr?: string;
  readonly xRange?: [number, number];
  readonly yRange?: [number, number];
  readonly gridDensity?: number;
  readonly title?: string;
  readonly params?: ParamDef[];
  readonly showStreamlines?: boolean;
  readonly normalize?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────

export default function VectorFieldVisualizer({
  fxExpr = "-y",
  fyExpr = "x",
  xRange = [-4, 4],
  yRange = [-4, 4],
  gridDensity = 15,
  title,
  params = [],
  showStreamlines = false,
  normalize = true,
}: VectorFieldVisualizerProps) {
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

  const compiledFx = useMemo<EvalFunction | null>(() => {
    try { return compile(fxExpr); } catch { return null; }
  }, [fxExpr]);

  const compiledFy = useMemo<EvalFunction | null>(() => {
    try { return compile(fyExpr); } catch { return null; }
  }, [fyExpr]);

  // Generate quiver data
  const { xPos, yPos, uComp, vComp } = useMemo(() => {
    const dx = (xRange[1] - xRange[0]) / (gridDensity - 1);
    const dy = (yRange[1] - yRange[0]) / (gridDensity - 1);
    const xs: number[] = [];
    const ys: number[] = [];
    const us: number[] = [];
    const vs: number[] = [];

    for (let i = 0; i < gridDensity; i++) {
      for (let j = 0; j < gridDensity; j++) {
        const x = xRange[0] + i * dx;
        const y = yRange[0] + j * dy;
        xs.push(x);
        ys.push(y);

        let fx = 0;
        let fy = 0;
        try {
          const scope = { x, y, ...paramValues };
          fx = compiledFx ? Number(compiledFx.evaluate(scope)) : 0;
          fy = compiledFy ? Number(compiledFy.evaluate(scope)) : 0;
        } catch {
          // keep 0
        }

        if (normalize) {
          const mag = Math.hypot(fx, fy);
          if (mag > 1e-10) {
            fx /= mag;
            fy /= mag;
          }
        }

        us.push(Number.isFinite(fx) ? fx : 0);
        vs.push(Number.isFinite(fy) ? fy : 0);
      }
    }

    return { xPos: xs, yPos: ys, uComp: us, vComp: vs };
  }, [xRange, yRange, gridDensity, compiledFx, compiledFy, paramValues, normalize]);

  // Build arrow traces — each arrow is a line segment with an annotation-less arrowhead
  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];
    const scale = ((xRange[1] - xRange[0]) / gridDensity) * 0.4;

    // Arrow lines
    const xLines: (number | null)[] = [];
    const yLines: (number | null)[] = [];

    for (let i = 0; i < xPos.length; i++) {
      const ex = xPos[i] + uComp[i] * scale;
      const ey = yPos[i] + vComp[i] * scale;
      xLines.push(xPos[i], ex, null);
      yLines.push(yPos[i], ey, null);
    }

    // Use cone-like approach: tails as scatter with arrows
    t.push({
      x: xLines,
      y: yLines,
      type: "scatter",
      mode: "lines",
      line: { color: "rgba(59,130,246,0.5)", width: 1.2 },
      hoverinfo: "skip",
      showlegend: false,
    } as Data);

    // Arrowheads at tips
    const tipX: number[] = [];
    const tipY: number[] = [];
    const tipColors: number[] = [];
    for (let i = 0; i < xPos.length; i++) {
      tipX.push(xPos[i] + uComp[i] * scale);
      tipY.push(yPos[i] + vComp[i] * scale);
      tipColors.push(Math.hypot(uComp[i], vComp[i]));
    }

    t.push({
      x: tipX,
      y: tipY,
      type: "scatter",
      mode: "markers",
      marker: {
        size: 4,
        color: tipColors,
        colorscale: "Viridis",
        showscale: true,
        colorbar: { title: { text: "Magnitude" }, len: 0.5, thickness: 12 },
      },
      name: "Field",
      hovertemplate: tipX.map(
        (_, i) => `(${xPos[i].toFixed(2)}, ${yPos[i].toFixed(2)})<br>F = (${uComp[i].toFixed(3)}, ${vComp[i].toFixed(3)})<extra></extra>`,
      ),
    } as Data);

    return t;
  }, [xPos, yPos, uComp, vComp, xRange, gridDensity]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: {
        title: { text: "x" },
        range: xRange,
        showgrid: true,
        zeroline: true,
        scaleanchor: "y",
        scaleratio: 1,
      },
      yaxis: {
        title: { text: "y" },
        range: yRange,
        showgrid: true,
        zeroline: true,
      },
      showlegend: false,
      hovermode: "closest" as const,
      ...(title ? { title: { text: title, font: { size: 14 } } } : {}),
    }),
    [xRange, yRange, title],
  );

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper data={traces} layout={layout} className="w-full" style={{ height: 450 }} />

      <div className="flex items-center justify-center gap-4 text-sm font-mono text-muted-foreground">
        <span>F(x,y) = ({fxExpr}, {fyExpr})</span>
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
