"use client";

import { useState, useMemo, useCallback } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

interface ComplexPoint {
  re: number;
  im: number;
}

interface RootLocusPlotProps {
  readonly openLoopPoles: ComplexPoint[];
  readonly openLoopZeros?: ComplexPoint[];
  readonly locusPoints?: Array<{
    gain: number;
    roots: ComplexPoint[];
  }>;
  readonly gainRange?: [number, number];
  readonly title?: string;
  readonly range?: number;
  readonly showAsymptotes?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatComplex(p: ComplexPoint): string {
  if (p.im === 0) return p.re.toFixed(2);
  if (p.re === 0) return `${p.im > 0 ? "" : "-"}j${Math.abs(p.im).toFixed(2)}`;
  return `${p.re.toFixed(2)} ${p.im > 0 ? "+" : "-"} j${Math.abs(p.im).toFixed(2)}`;
}

// ── Component ───────────────────────────────────────────────────────────

export default function RootLocusPlot({
  openLoopPoles,
  openLoopZeros = [],
  locusPoints = [],
  gainRange = [0, 100],
  title,
  range = 6,
  showAsymptotes = false,
}: RootLocusPlotProps) {
  const [gain, setGain] = useState(gainRange[0]);

  const handleGainChange = useCallback((v: number) => {
    setGain(v);
  }, []);

  // Find closest locus entry for current gain
  const currentRoots = useMemo<ComplexPoint[]>(() => {
    if (locusPoints.length === 0) return [];
    let closest = locusPoints[0];
    let minDist = Math.abs(closest.gain - gain);
    for (const lp of locusPoints) {
      const d = Math.abs(lp.gain - gain);
      if (d < minDist) {
        minDist = d;
        closest = lp;
      }
    }
    return closest.roots;
  }, [locusPoints, gain]);

  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];

    // Locus paths — group by branch
    if (locusPoints.length > 0) {
      const numBranches = locusPoints[0].roots.length;
      const branchColors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

      for (let b = 0; b < numBranches; b++) {
        t.push({
          x: locusPoints.map((lp) => lp.roots[b]?.re ?? 0),
          y: locusPoints.map((lp) => lp.roots[b]?.im ?? 0),
          type: "scatter",
          mode: "lines",
          line: { color: branchColors[b % branchColors.length], width: 2 },
          name: `Branch ${b + 1}`,
          hoverinfo: "skip",
        } as Data);
      }
    }

    // Open-loop poles (×)
    if (openLoopPoles.length > 0) {
      t.push({
        x: openLoopPoles.map((p) => p.re),
        y: openLoopPoles.map((p) => p.im),
        type: "scatter",
        mode: "markers",
        marker: { symbol: "x", size: 14, color: "#ef4444", line: { width: 2.5, color: "#ef4444" } },
        name: "OL Poles",
        hovertemplate: openLoopPoles.map(
          (p) => `<b>OL Pole</b><br>${formatComplex(p)}<extra></extra>`,
        ),
      } as Data);
    }

    // Open-loop zeros (○)
    if (openLoopZeros.length > 0) {
      t.push({
        x: openLoopZeros.map((z) => z.re),
        y: openLoopZeros.map((z) => z.im),
        type: "scatter",
        mode: "markers",
        marker: { symbol: "circle-open", size: 14, color: "#3b82f6", line: { width: 2.5, color: "#3b82f6" } },
        name: "OL Zeros",
        hovertemplate: openLoopZeros.map(
          (z) => `<b>OL Zero</b><br>${formatComplex(z)}<extra></extra>`,
        ),
      } as Data);
    }

    // Current closed-loop roots at selected gain
    if (currentRoots.length > 0) {
      t.push({
        x: currentRoots.map((r) => r.re),
        y: currentRoots.map((r) => r.im),
        type: "scatter",
        mode: "markers",
        marker: { symbol: "star", size: 12, color: "#f59e0b", line: { width: 1, color: "#fbbf24" } },
        name: `K = ${gain.toFixed(1)}`,
        hovertemplate: currentRoots.map(
          (r) => `<b>CL Root (K=${gain.toFixed(1)})</b><br>${formatComplex(r)}<extra></extra>`,
        ),
      } as Data);
    }

    // Asymptotes
    if (showAsymptotes && openLoopPoles.length > openLoopZeros.length) {
      const n = openLoopPoles.length - openLoopZeros.length;
      const centroid =
        (openLoopPoles.reduce((s, p) => s + p.re, 0) - openLoopZeros.reduce((s, z) => s + z.re, 0)) / n;

      for (let k = 0; k < n; k++) {
        const angle = ((2 * k + 1) * Math.PI) / n;
        const len = range * 2;
        t.push({
          x: [centroid, centroid + len * Math.cos(angle)],
          y: [0, len * Math.sin(angle)],
          type: "scatter",
          mode: "lines",
          line: { color: "rgba(150,150,150,0.3)", width: 1, dash: "dash" },
          name: k === 0 ? "Asymptotes" : undefined,
          showlegend: k === 0,
          hoverinfo: "skip",
        } as Data);
      }
    }

    return t;
  }, [locusPoints, openLoopPoles, openLoopZeros, currentRoots, gain, showAsymptotes, range]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: {
        title: { text: "Real Axis (σ)" },
        range: [-range, range],
        zeroline: true,
        zerolinewidth: 2,
        showgrid: true,
        scaleanchor: "y",
        scaleratio: 1,
      },
      yaxis: {
        title: { text: "Imaginary Axis (jω)" },
        range: [-range, range],
        zeroline: true,
        zerolinewidth: 2,
        showgrid: true,
      },
      showlegend: true,
      hovermode: "closest" as const,
      ...(title ? { title: { text: title, font: { size: 14 } } } : {}),
    }),
    [range, title],
  );

  // Stability check
  const isStable = currentRoots.length > 0 && currentRoots.every((r) => r.re < 0);
  const isMarginal = currentRoots.some((r) => r.re === 0);

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
          <span className="text-muted-foreground">K =</span>
          <span className="font-mono font-medium">{gain.toFixed(1)}</span>
        </div>
        {currentRoots.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Stability:</span>
            <span
              className={`font-medium ${
                isStable ? "text-emerald-400" : isMarginal ? "text-amber-400" : "text-red-400"
              }`}
            >
              {isStable ? "Stable" : isMarginal ? "Marginal" : "Unstable"}
            </span>
          </div>
        )}
      </div>

      <div className="px-2">
        <ParameterSlider
          label="Gain (K)"
          min={gainRange[0]}
          max={gainRange[1]}
          step={(gainRange[1] - gainRange[0]) / 200}
          value={gain}
          onChange={handleGainChange}
          className="max-w-[400px] mx-auto"
        />
      </div>
    </div>
  );
}
