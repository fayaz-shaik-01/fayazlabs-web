"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";
import { compile, type EvalFunction } from "mathjs";

// ── Types ───────────────────────────────────────────────────────────────

interface ConvolutionAnimatorProps {
  readonly signalExpr?: string;
  readonly impulseExpr?: string;
  readonly signalLabel?: string;
  readonly impulseLabel?: string;
  readonly tRange?: [number, number];
  readonly samples?: number;
  readonly title?: string;
  readonly autoPlay?: boolean;
  readonly speed?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function safeEval(compiled: EvalFunction | null, scope: Record<string, number>): number {
  if (!compiled) return 0;
  try {
    const result = compiled.evaluate(scope);
    const val = typeof result === "number" ? result : Number(result);
    return Number.isFinite(val) ? val : 0;
  } catch {
    return 0;
  }
}

function computeConvolution(
  xSignal: number[],
  hSignal: number[],
  dt: number,
): number[] {
  const N = xSignal.length;
  const M = hSignal.length;
  const out = new Array(N + M - 1).fill(0);
  for (let n = 0; n < N + M - 1; n++) {
    for (let k = 0; k < M; k++) {
      const idx = n - k;
      if (idx >= 0 && idx < N) {
        out[n] += xSignal[idx] * hSignal[k] * dt;
      }
    }
  }
  return out;
}

// ── Component ───────────────────────────────────────────────────────────

export default function ConvolutionAnimator({
  signalExpr = "t >= 0 ? exp(-t) : 0",
  impulseExpr = "t >= 0 ? 1 : 0",
  signalLabel = "x(t)",
  impulseLabel = "h(t)",
  tRange = [-4, 8],
  samples = 300,
  title,
  autoPlay = false,
  speed = 50,
}: ConvolutionAnimatorProps) {
  const [tau, setTau] = useState(tRange[0]);
  const [playing, setPlaying] = useState(autoPlay);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dt = (tRange[1] - tRange[0]) / (samples - 1);
  const tValues = useMemo(
    () => Array.from({ length: samples }, (_, i) => tRange[0] + i * dt),
    [tRange, samples, dt],
  );

  // Compile expressions
  const compiledSignal = useMemo<EvalFunction | null>(() => {
    try { return compile(signalExpr); } catch { return null; }
  }, [signalExpr]);

  const compiledImpulse = useMemo<EvalFunction | null>(() => {
    try { return compile(impulseExpr); } catch { return null; }
  }, [impulseExpr]);

  // Evaluate signals
  const xValues = useMemo(
    () => tValues.map((t) => safeEval(compiledSignal, { t })),
    [tValues, compiledSignal],
  );

  const hValues = useMemo(
    () => tValues.map((t) => safeEval(compiledImpulse, { t })),
    [tValues, compiledImpulse],
  );

  // Full convolution
  const convResult = useMemo(
    () => computeConvolution(xValues, hValues, dt),
    [xValues, hValues, dt],
  );

  const convTValues = useMemo(
    () => Array.from({ length: convResult.length }, (_, i) => 2 * tRange[0] + i * dt),
    [convResult.length, tRange, dt],
  );

  // Flipped & shifted h(tau - t) at current tau
  const hFlipped = useMemo(
    () => tValues.map((t) => safeEval(compiledImpulse, { t: tau - t })),
    [tValues, tau, compiledImpulse],
  );

  // Product x(t) * h(tau - t) for shading
  const product = useMemo(
    () => tValues.map((_, i) => xValues[i] * hFlipped[i]),
    [tValues, xValues, hFlipped],
  );

  // Animation
  useEffect(() => {
    if (playing) {
      animRef.current = setInterval(() => {
        setTau((prev) => {
          const next = prev + dt * 2;
          return next > tRange[1] ? tRange[0] : next;
        });
      }, speed);
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [playing, dt, tRange, speed]);

  const handlePlayPause = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  // Convolution value at tau
  const convIdx = Math.round((tau - 2 * tRange[0]) / dt);
  const yConvAtTau = convIdx >= 0 && convIdx < convResult.length ? convResult[convIdx] : 0;

  const traces = useMemo<Data[]>(() => [
    // x(t)
    {
      x: tValues, y: xValues,
      type: "scatter" as const, mode: "lines" as const,
      name: signalLabel,
      line: { color: "#3b82f6", width: 2 },
    },
    // h(tau - t) flipped
    {
      x: tValues, y: hFlipped,
      type: "scatter" as const, mode: "lines" as const,
      name: `h(${tau.toFixed(1)} − t)`,
      line: { color: "#ef4444", width: 2, dash: "dash" },
    },
    // Product region
    {
      x: tValues, y: product,
      type: "scatter" as const, mode: "lines" as const,
      name: "Product",
      fill: "tozeroy",
      fillcolor: "rgba(139, 92, 246, 0.2)",
      line: { color: "#8b5cf6", width: 1 },
    },
    // Convolution result
    {
      x: convTValues, y: convResult,
      type: "scatter" as const, mode: "lines" as const,
      name: "(x * h)(t)",
      line: { color: "#10b981", width: 2.5 },
    },
    // Current tau marker
    {
      x: [tau], y: [yConvAtTau],
      type: "scatter" as const, mode: "markers" as const,
      marker: { size: 10, color: "#f59e0b", symbol: "circle" },
      name: `τ = ${tau.toFixed(2)}`,
    },
  ], [tValues, xValues, hFlipped, product, convTValues, convResult, tau, yConvAtTau, signalLabel]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: { title: { text: "t" }, range: [tRange[0] - 1, tRange[1] + 1], showgrid: true, zeroline: true },
      yaxis: { title: { text: "Amplitude" }, showgrid: true, zeroline: true },
      showlegend: true,
      hovermode: "x unified" as const,
      legend: { x: 0, y: 1 },
      ...(title ? { title: { text: title, font: { size: 14 } } } : {}),
    }),
    [tRange, title],
  );

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper data={traces} layout={layout} className="w-full" style={{ height: 400 }} />

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePlayPause}
          className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <span className="font-mono text-sm text-muted-foreground">
          τ = {tau.toFixed(2)} · y(τ) = {yConvAtTau.toFixed(3)}
        </span>
      </div>

      <div className="px-2 max-w-[400px] mx-auto">
        <ParameterSlider
          label="τ (shift)"
          min={tRange[0]}
          max={tRange[1]}
          step={dt}
          value={tau}
          onChange={setTau}
        />
      </div>
    </div>
  );
}
