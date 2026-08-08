"use client";

import { useState, useMemo, useCallback } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

type WaveformType = "square" | "sawtooth" | "triangle" | "rectified-sine" | "custom";

interface FourierCoefficient {
  n: number;
  an: number;
  bn: number;
}

interface FourierSeriesBuilderProps {
  readonly waveform?: WaveformType;
  readonly maxHarmonics?: number;
  readonly defaultHarmonics?: number;
  readonly period?: number;
  readonly amplitude?: number;
  readonly title?: string;
  readonly samples?: number;
  readonly showOriginal?: boolean;
  readonly showSpectrum?: boolean;
  readonly customCoefficients?: FourierCoefficient[];
  readonly customTarget?: (t: number) => number;
}

// ── Standard waveform Fourier coefficients ──────────────────────────────

function getCoefficients(
  waveform: WaveformType,
  N: number,
  A: number,
  custom?: FourierCoefficient[],
): { a0: number; coeffs: FourierCoefficient[] } {
  if (waveform === "custom" && custom) {
    return { a0: 0, coeffs: custom.slice(0, N) };
  }

  const coeffs: FourierCoefficient[] = [];

  switch (waveform) {
    case "square":
      for (let n = 1; n <= N; n++) {
        coeffs.push({
          n,
          an: 0,
          bn: n % 2 === 1 ? (4 * A) / (n * Math.PI) : 0,
        });
      }
      return { a0: 0, coeffs };

    case "sawtooth":
      for (let n = 1; n <= N; n++) {
        coeffs.push({
          n,
          an: 0,
          bn: ((-1) ** (n + 1) * 2 * A) / (n * Math.PI),
        });
      }
      return { a0: 0, coeffs };

    case "triangle":
      for (let n = 1; n <= N; n++) {
        coeffs.push({
          n,
          an: n % 2 === 1 ? ((-1) ** ((n - 1) / 2) * 8 * A) / (n * n * Math.PI * Math.PI) : 0,
          bn: 0,
        });
      }
      return { a0: 0, coeffs };

    case "rectified-sine":
      for (let n = 1; n <= N; n++) {
        coeffs.push({
          n,
          an: n % 2 === 0 ? (-2 * A) / (Math.PI * (n * n - 1)) : 0,
          bn: 0,
        });
      }
      return { a0: (2 * A) / Math.PI, coeffs };

    default:
      return { a0: 0, coeffs: [] };
  }
}

function evaluateFourierSum(
  a0: number,
  coeffs: FourierCoefficient[],
  t: number,
  T: number,
): number {
  const w0 = (2 * Math.PI) / T;
  let sum = a0 / 2;
  for (const { n, an, bn } of coeffs) {
    sum += an * Math.cos(n * w0 * t) + bn * Math.sin(n * w0 * t);
  }
  return sum;
}

function getTargetWaveform(waveform: WaveformType, A: number): ((t: number) => number) | null {
  switch (waveform) {
    case "square":
      return (t) => {
        const phase = ((t % 1) + 1) % 1;
        return phase < 0.5 ? A : -A;
      };
    case "sawtooth":
      return (t) => {
        const phase = ((t % 1) + 1) % 1;
        return A * (2 * phase - 1);
      };
    case "triangle":
      return (t) => {
        const phase = ((t % 1) + 1) % 1;
        return phase < 0.5 ? A * (4 * phase - 1) : A * (3 - 4 * phase);
      };
    case "rectified-sine":
      return (t) => A * Math.abs(Math.sin(Math.PI * t));
    default:
      return null;
  }
}

// ── Component ───────────────────────────────────────────────────────────

export default function FourierSeriesBuilder({
  waveform = "square",
  maxHarmonics = 50,
  defaultHarmonics = 5,
  period = 1,
  amplitude = 1,
  title,
  samples = 500,
  showOriginal = true,
  showSpectrum = false,
  customCoefficients,
  customTarget,
}: FourierSeriesBuilderProps) {
  const [numHarmonics, setNumHarmonics] = useState(defaultHarmonics);

  const handleHarmonicsChange = useCallback((v: number) => {
    setNumHarmonics(Math.round(v));
  }, []);

  const { a0, coeffs } = useMemo(
    () => getCoefficients(waveform, numHarmonics, amplitude, customCoefficients),
    [waveform, numHarmonics, amplitude, customCoefficients],
  );

  const tValues = useMemo(() => {
    const tMin = -2 * period;
    const tMax = 2 * period;
    const dt = (tMax - tMin) / (samples - 1);
    return Array.from({ length: samples }, (_, i) => tMin + i * dt);
  }, [period, samples]);

  const approxValues = useMemo(
    () => tValues.map((t) => evaluateFourierSum(a0, coeffs, t, period)),
    [tValues, a0, coeffs, period],
  );

  const targetFn = useMemo(
    () => customTarget ?? getTargetWaveform(waveform, amplitude),
    [waveform, amplitude, customTarget],
  );

  const targetValues = useMemo(
    () => (targetFn ? tValues.map((t) => targetFn(t / period)) : null),
    [tValues, targetFn, period],
  );

  // Main plot traces
  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];

    // Target waveform
    if (showOriginal && targetValues) {
      t.push({
        x: tValues,
        y: targetValues,
        type: "scatter",
        mode: "lines",
        name: "Target",
        line: { color: "rgba(150,150,150,0.4)", width: 1.5, dash: "dot" },
      });
    }

    // Fourier approximation
    t.push({
      x: tValues,
      y: approxValues,
      type: "scatter",
      mode: "lines",
      name: `N = ${numHarmonics}`,
      line: { color: "#3b82f6", width: 2 },
    });

    return t;
  }, [tValues, approxValues, targetValues, showOriginal, numHarmonics]);

  // Spectrum traces
  const spectrumTraces = useMemo<Data[]>(() => {
    if (!showSpectrum) return [];
    const ns = coeffs.map((c) => c.n);
    const magnitudes = coeffs.map((c) => Math.hypot(c.an, c.bn));

    return [
      {
        x: ns,
        y: magnitudes,
        type: "bar",
        name: "|cₙ|",
        marker: { color: "#8b5cf6" },
      } as Data,
    ];
  }, [coeffs, showSpectrum]);

  const mainLayout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: { title: { text: "t" }, showgrid: true, zeroline: true },
      yaxis: { title: { text: "f(t)" }, showgrid: true, zeroline: true },
      showlegend: true,
      hovermode: "x unified" as const,
      ...(title ? { title: { text: title, font: { size: 14 } } } : {}),
    }),
    [title],
  );

  const spectrumLayout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: { title: { text: "Harmonic (n)" }, showgrid: true, dtick: 1 },
      yaxis: { title: { text: "Magnitude" }, showgrid: true },
      showlegend: false,
      height: 200,
    }),
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper data={traces} layout={mainLayout} className="w-full" style={{ height: 380 }} />

      {showSpectrum && spectrumTraces.length > 0 && (
        <PlotlyWrapper data={spectrumTraces} layout={spectrumLayout} className="w-full" style={{ height: 200 }} />
      )}

      <div className="flex items-center justify-center gap-6 text-sm">
        <span className="font-mono text-muted-foreground">
          {waveform.charAt(0).toUpperCase() + waveform.slice(1)} wave
        </span>
        <span className="font-mono">
          N = <span className="text-primary font-medium">{numHarmonics}</span>
        </span>
      </div>

      <div className="px-2 max-w-[400px] mx-auto">
        <ParameterSlider
          label="Harmonics (N)"
          min={1}
          max={maxHarmonics}
          step={1}
          value={numHarmonics}
          onChange={handleHarmonicsChange}
        />
      </div>
    </div>
  );
}
