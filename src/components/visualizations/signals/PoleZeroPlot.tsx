"use client";

import { useMemo, useState, useCallback } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

interface ComplexPoint {
  re: number;
  im: number;
  label?: string;
}

interface PoleZeroPlotProps {
  readonly poles: ComplexPoint[];
  readonly zeros: ComplexPoint[];
  readonly plane?: "s" | "z";
  readonly title?: string;
  readonly range?: number;
  readonly showUnitCircle?: boolean;
  readonly showAxes?: boolean;
  readonly showLabels?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function generateCircle(
  cx: number,
  cy: number,
  r: number,
  samples: number = 100,
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const theta = (2 * Math.PI * i) / samples;
    x.push(cx + r * Math.cos(theta));
    y.push(cy + r * Math.sin(theta));
  }
  return { x, y };
}

function formatComplex(re: number, im: number): string {
  if (im === 0) return re.toFixed(2);
  if (re === 0) return `${im > 0 ? "" : "-"}j${Math.abs(im).toFixed(2)}`;
  return `${re.toFixed(2)} ${im > 0 ? "+" : "-"} j${Math.abs(im).toFixed(2)}`;
}

// ── Component ───────────────────────────────────────────────────────────

export default function PoleZeroPlot({
  poles: initialPoles,
  zeros: initialZeros,
  plane = "s",
  title,
  range = 4,
  showUnitCircle,
  showAxes = true,
  showLabels = true,
}: PoleZeroPlotProps) {
  const [poles, setPoles] = useState<ComplexPoint[]>(initialPoles);
  const [zeros, setZeros] = useState<ComplexPoint[]>(initialZeros);
  const [newRe, setNewRe] = useState(0);
  const [newIm, setNewIm] = useState(0);

  const handleAddPole = useCallback(() => {
    setPoles((prev) => [...prev, { re: newRe, im: newIm }]);
  }, [newRe, newIm]);

  const handleAddZero = useCallback(() => {
    setZeros((prev) => [...prev, { re: newRe, im: newIm }]);
  }, [newRe, newIm]);

  const handleRemovePole = useCallback((idx: number) => {
    setPoles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleRemoveZero = useCallback((idx: number) => {
    setZeros((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleReset = useCallback(() => {
    setPoles(initialPoles);
    setZeros(initialZeros);
  }, [initialPoles, initialZeros]);

  const isZPlane = plane === "z";
  const shouldShowUnitCircle = showUnitCircle ?? isZPlane;

  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];

    // Unit circle (for z-plane)
    if (shouldShowUnitCircle) {
      const circle = generateCircle(0, 0, 1);
      t.push({
        x: circle.x,
        y: circle.y,
        type: "scatter",
        mode: "lines",
        line: { color: "rgba(150,150,150,0.4)", width: 1.5, dash: "dash" },
        name: "Unit Circle",
        hoverinfo: "skip",
      } as Data);
    }

    // Poles (×)
    if (poles.length > 0) {
      t.push({
        x: poles.map((p) => p.re),
        y: poles.map((p) => p.im),
        type: "scatter",
        mode: showLabels ? "markers+text" : "markers",
        marker: {
          symbol: "x",
          size: 14,
          color: "#ef4444",
          line: { width: 2.5, color: "#ef4444" },
        },
        text: showLabels
          ? poles.map((p) => p.label ?? formatComplex(p.re, p.im))
          : undefined,
        textposition: "top center",
        textfont: { size: 10, color: "#fca5a5" },
        name: "Poles",
        hovertemplate: poles.map(
          (p) =>
            `<b>Pole</b><br>σ = ${p.re.toFixed(3)}<br>jω = ${p.im.toFixed(3)}<extra></extra>`,
        ),
      } as Data);
    }

    // Zeros (○)
    if (zeros.length > 0) {
      t.push({
        x: zeros.map((z) => z.re),
        y: zeros.map((z) => z.im),
        type: "scatter",
        mode: showLabels ? "markers+text" : "markers",
        marker: {
          symbol: "circle-open",
          size: 14,
          color: "#3b82f6",
          line: { width: 2.5, color: "#3b82f6" },
        },
        text: showLabels
          ? zeros.map((z) => z.label ?? formatComplex(z.re, z.im))
          : undefined,
        textposition: "top center",
        textfont: { size: 10, color: "#93c5fd" },
        name: "Zeros",
        hovertemplate: zeros.map(
          (z) =>
            `<b>Zero</b><br>σ = ${z.re.toFixed(3)}<br>jω = ${z.im.toFixed(3)}<extra></extra>`,
        ),
      } as Data);
    }

    return t;
  }, [poles, zeros, shouldShowUnitCircle, showLabels]);

  const layout = useMemo<Partial<Layout>>(() => {
    const axisLabel = isZPlane
      ? { x: "Re(z)", y: "Im(z)" }
      : { x: "σ (Real)", y: "jω (Imaginary)" };

    const l: Partial<Layout> = {
      xaxis: {
        title: { text: axisLabel.x },
        range: [-range, range],
        zeroline: showAxes,
        zerolinewidth: showAxes ? 2 : 0,
        showgrid: true,
        scaleanchor: "y",
        scaleratio: 1,
      },
      yaxis: {
        title: { text: axisLabel.y },
        range: [-range, range],
        zeroline: showAxes,
        zerolinewidth: showAxes ? 2 : 0,
        showgrid: true,
      },
      showlegend: true,
      hovermode: "closest" as const,
    };

    if (title) {
      l.title = { text: title, font: { size: 14 } };
    }

    return l;
  }, [isZPlane, range, showAxes, title]);

  // Summary info
  const stability = useMemo(() => {
    if (isZPlane) {
      const allInside = poles.every(
        (p) => Math.hypot(p.re, p.im) < 1,
      );
      return allInside ? "BIBO Stable" : "Unstable";
    }
    const allLeftHalf = poles.every((p) => p.re < 0);
    const anyOnAxis = poles.some((p) => p.re === 0);
    if (allLeftHalf) return "BIBO Stable";
    if (anyOnAxis) return "Marginally Stable";
    return "Unstable";
  }, [poles, isZPlane]);

  const stabilityColor =
    stability === "BIBO Stable"
      ? "text-emerald-400"
      : stability === "Marginally Stable"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper
        data={traces}
        layout={layout}
        className="w-full"
        style={{ height: 450 }}
      />

      <div className="flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{isZPlane ? "z" : "s"}-plane:</span>
          <span className="font-mono">
            {poles.length} pole{poles.length !== 1 ? "s" : ""}, {zeros.length} zero{zeros.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Stability:</span>
          <span className={`font-medium ${stabilityColor}`}>{stability}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 border-t border-white/[0.06] pt-3">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <ParameterSlider label="Real (σ)" min={-range} max={range} step={0.1} value={newRe} onChange={setNewRe} />
          <ParameterSlider label="Imag (jω)" min={-range} max={range} step={0.1} value={newIm} onChange={setNewIm} />
        </div>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={handleAddPole}
            className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            + Pole
          </button>
          <button
            type="button"
            onClick={handleAddZero}
            className="px-3 py-1 text-xs rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            + Zero
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1 text-xs rounded bg-white/[0.06] text-muted-foreground hover:bg-white/10 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Lists with remove buttons */}
        <div className="grid grid-cols-2 gap-4 text-xs max-w-md mx-auto">
          <div>
            <div className="text-muted-foreground mb-1 font-medium">Poles</div>
            {poles.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <span className="font-mono text-red-400">{formatComplex(p.re, p.im)}</span>
                <button onClick={() => handleRemovePole(i)} className="text-red-400/50 hover:text-red-400 ml-2">×</button>
              </div>
            ))}
            {poles.length === 0 && <span className="text-muted-foreground/50 italic">none</span>}
          </div>
          <div>
            <div className="text-muted-foreground mb-1 font-medium">Zeros</div>
            {zeros.map((z, i) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <span className="font-mono text-blue-400">{formatComplex(z.re, z.im)}</span>
                <button onClick={() => handleRemoveZero(i)} className="text-blue-400/50 hover:text-blue-400 ml-2">×</button>
              </div>
            ))}
            {zeros.length === 0 && <span className="text-muted-foreground/50 italic">none</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
