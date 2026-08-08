"use client";

import { useMemo, useState, useCallback } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

interface NyquistPlotProps {
  readonly numerator: number[];
  readonly denominator: number[];
  readonly freqRange?: [number, number];
  readonly samples?: number;
  readonly title?: string;
  readonly range?: number;
  readonly showCriticalPoint?: boolean;
  readonly showMirror?: boolean;
}

// ── Transfer function eval (reused pattern) ─────────────────────────────

function evaluatePoly(coeffs: number[], omega: number): { re: number; im: number } {
  let re = 0;
  let im = 0;
  const n = coeffs.length - 1;
  for (let i = 0; i <= n; i++) {
    const power = n - i;
    const jPower = power % 4;
    const mag = coeffs[i] * Math.pow(omega, power);
    switch (jPower) {
      case 0: re += mag; break;
      case 1: im += mag; break;
      case 2: re -= mag; break;
      case 3: im -= mag; break;
    }
  }
  return { re, im };
}

function complexDiv(
  a: { re: number; im: number },
  b: { re: number; im: number },
): { re: number; im: number } {
  const denom = b.re * b.re + b.im * b.im;
  if (denom === 0) return { re: 0, im: 0 };
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
}

// ── Component ───────────────────────────────────────────────────────────

export default function NyquistPlot({
  numerator,
  denominator,
  freqRange = [-2, 4],
  samples = 1000,
  title,
  range: plotRange,
  showCriticalPoint = true,
  showMirror = true,
}: NyquistPlotProps) {
  const [gain, setGain] = useState(1);

  const handleGainChange = useCallback((v: number) => setGain(v), []);

  const scaledNumerator = useMemo(
    () => numerator.map((c) => c * gain),
    [numerator, gain],
  );

  const { realParts, imagParts, frequencies } = useMemo(() => {
    const [logMin, logMax] = freqRange;
    const dLog = (logMax - logMin) / (samples - 1);
    const reArr: number[] = [];
    const imArr: number[] = [];
    const freqs: number[] = [];

    for (let i = 0; i < samples; i++) {
      const omega = Math.pow(10, logMin + i * dLog);
      freqs.push(omega);
      const num = evaluatePoly(scaledNumerator, omega);
      const den = evaluatePoly(denominator, omega);
      const h = complexDiv(num, den);
      reArr.push(h.re);
      imArr.push(h.im);
    }

    return { realParts: reArr, imagParts: imArr, frequencies: freqs };
  }, [scaledNumerator, denominator, freqRange, samples]);

  const autoRange = useMemo(() => {
    if (plotRange) return plotRange;
    const maxRe = Math.max(...realParts.map(Math.abs), 1);
    const maxIm = Math.max(...imagParts.map(Math.abs), 1);
    return Math.ceil(Math.max(maxRe, maxIm) * 1.3);
  }, [realParts, imagParts, plotRange]);

  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];

    // Main Nyquist contour (ω > 0)
    t.push({
      x: realParts,
      y: imagParts,
      type: "scatter",
      mode: "lines",
      line: { color: "#3b82f6", width: 2 },
      name: "ω > 0",
      hovertemplate: realParts.map(
        (re, i) =>
          `Re: ${re.toFixed(3)}<br>Im: ${imagParts[i].toFixed(3)}<br>ω: ${frequencies[i].toFixed(3)} rad/s<extra></extra>`,
      ),
    } as Data);

    // Mirror (ω < 0)
    if (showMirror) {
      t.push({
        x: realParts,
        y: imagParts.map((im) => -im),
        type: "scatter",
        mode: "lines",
        line: { color: "#3b82f6", width: 1.5, dash: "dash" },
        name: "ω < 0",
        hoverinfo: "skip",
      } as Data);
    }

    // Critical point (-1, 0)
    if (showCriticalPoint) {
      t.push({
        x: [-1],
        y: [0],
        type: "scatter",
        mode: "markers",
        marker: { symbol: "x", size: 12, color: "#ef4444", line: { width: 2.5, color: "#ef4444" } },
        name: "(-1, j0)",
      } as Data);
    }

    // Direction arrows at a few points
    const arrowIndices = [
      Math.floor(samples * 0.15),
      Math.floor(samples * 0.4),
      Math.floor(samples * 0.7),
    ];
    for (const idx of arrowIndices) {
      if (idx < realParts.length) {
        t.push({
          x: [realParts[idx]],
          y: [imagParts[idx]],
          type: "scatter",
          mode: "markers",
          marker: { symbol: "arrow", size: 10, color: "#3b82f6", angleref: "previous" },
          showlegend: false,
          hoverinfo: "skip",
        } as Data);
      }
    }

    return t;
  }, [realParts, imagParts, frequencies, showMirror, showCriticalPoint, samples]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: {
        title: { text: "Real" },
        range: [-autoRange, autoRange],
        zeroline: true,
        zerolinewidth: 2,
        showgrid: true,
        scaleanchor: "y",
        scaleratio: 1,
      },
      yaxis: {
        title: { text: "Imaginary" },
        range: [-autoRange, autoRange],
        zeroline: true,
        zerolinewidth: 2,
        showgrid: true,
      },
      showlegend: true,
      hovermode: "closest" as const,
      ...(title ? { title: { text: title, font: { size: 14 } } } : {}),
    }),
    [autoRange, title],
  );

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper
        data={traces}
        layout={layout}
        className="w-full"
        style={{ height: 450 }}
      />
      <div className="max-w-sm mx-auto w-full">
        <ParameterSlider
          label="Gain K"
          min={0.1}
          max={20}
          step={0.1}
          value={gain}
          onChange={handleGainChange}
        />
      </div>
    </div>
  );
}
