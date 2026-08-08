"use client";

import { useState, useMemo, useCallback } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

interface SamplingVisualizerProps {
  readonly signalFreq?: number;
  readonly defaultSamplingFreq?: number;
  readonly maxSamplingFreq?: number;
  readonly duration?: number;
  readonly title?: string;
  readonly samples?: number;
  readonly showSpectrum?: boolean;
  readonly showReconstruction?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────

export default function SamplingVisualizer({
  signalFreq = 5,
  defaultSamplingFreq = 12,
  maxSamplingFreq = 60,
  duration = 1,
  title,
  samples = 500,
  showSpectrum = true,
  showReconstruction = true,
}: SamplingVisualizerProps) {
  const [fs, setFs] = useState(defaultSamplingFreq);

  const handleFsChange = useCallback((v: number) => {
    setFs(v);
  }, []);

  const nyquist = 2 * signalFreq;
  const isAliasing = fs < nyquist;

  // Continuous signal
  const tCont = useMemo(() => {
    const dt = duration / (samples - 1);
    return Array.from({ length: samples }, (_, i) => i * dt);
  }, [duration, samples]);

  const xCont = useMemo(
    () => tCont.map((t) => Math.sin(2 * Math.PI * signalFreq * t)),
    [tCont, signalFreq],
  );

  // Sampled points
  const { tSampled, xSampled } = useMemo(() => {
    const Ts = 1 / fs;
    const numSamples = Math.floor(duration / Ts) + 1;
    const ts: number[] = [];
    const xs: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      const t = i * Ts;
      if (t <= duration) {
        ts.push(t);
        xs.push(Math.sin(2 * Math.PI * signalFreq * t));
      }
    }
    return { tSampled: ts, xSampled: xs };
  }, [fs, duration, signalFreq]);

  // Sinc reconstruction
  const xReconstructed = useMemo(() => {
    if (!showReconstruction) return null;
    const Ts = 1 / fs;
    return tCont.map((t) => {
      let sum = 0;
      for (let i = 0; i < tSampled.length; i++) {
        const arg = (t - tSampled[i]) / Ts;
        const sincVal = arg === 0 ? 1 : Math.sin(Math.PI * arg) / (Math.PI * arg);
        sum += xSampled[i] * sincVal;
      }
      return sum;
    });
  }, [tCont, tSampled, xSampled, fs, showReconstruction]);

  // Time-domain traces
  const timeTraces = useMemo<Data[]>(() => {
    const t: Data[] = [
      {
        x: tCont,
        y: xCont,
        type: "scatter",
        mode: "lines",
        name: `x(t) = sin(2π·${signalFreq}t)`,
        line: { color: "rgba(150,150,150,0.4)", width: 1.5, dash: "dot" },
      },
      {
        x: tSampled,
        y: xSampled,
        type: "scatter",
        mode: "markers",
        name: `Sampled (fs=${fs} Hz)`,
        marker: { size: 8, color: "#3b82f6", symbol: "circle" },
      },
    ];

    // Stem lines
    for (let i = 0; i < tSampled.length; i++) {
      t.push({
        x: [tSampled[i], tSampled[i]],
        y: [0, xSampled[i]],
        type: "scatter",
        mode: "lines",
        line: { color: "#3b82f6", width: 1 },
        showlegend: false,
        hoverinfo: "skip",
      } as Data);
    }

    if (showReconstruction && xReconstructed) {
      t.push({
        x: tCont,
        y: xReconstructed,
        type: "scatter",
        mode: "lines",
        name: "Reconstructed",
        line: { color: isAliasing ? "#ef4444" : "#10b981", width: 2 },
      });
    }

    return t;
  }, [tCont, xCont, tSampled, xSampled, fs, signalFreq, showReconstruction, xReconstructed, isAliasing]);

  // Spectrum traces
  const spectrumTraces = useMemo<Data[]>(() => {
    if (!showSpectrum) return [];

    const freqAxis = [-fs - signalFreq, -fs + signalFreq, -signalFreq, signalFreq, fs - signalFreq, fs + signalFreq];
    const magnitudes = freqAxis.map(() => 0.5);

    return [
      {
        x: [-signalFreq, signalFreq],
        y: [0.5, 0.5],
        type: "bar",
        name: "Original",
        marker: { color: "rgba(150,150,150,0.4)" },
        width: 0.5,
      } as Data,
      {
        x: freqAxis,
        y: magnitudes,
        type: "bar",
        name: "Replicas",
        marker: { color: isAliasing ? "rgba(239,68,68,0.6)" : "rgba(59,130,246,0.5)" },
        width: 0.5,
      } as Data,
    ];
  }, [showSpectrum, signalFreq, fs, isAliasing]);

  const timeLayout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: { title: { text: "Time (s)" }, range: [0, duration], showgrid: true, zeroline: true },
      yaxis: { title: { text: "Amplitude" }, range: [-1.5, 1.5], showgrid: true, zeroline: true },
      showlegend: true,
      hovermode: "x unified" as const,
      ...(title ? { title: { text: title, font: { size: 14 } } } : {}),
    }),
    [duration, title],
  );

  const spectrumLayout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: {
        title: { text: "Frequency (Hz)" },
        range: [-(fs + signalFreq + 5), fs + signalFreq + 5],
        showgrid: true,
        zeroline: true,
      },
      yaxis: { title: { text: "|X(f)|" }, showgrid: true },
      showlegend: true,
      barmode: "overlay" as const,
    }),
    [fs, signalFreq],
  );

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper data={timeTraces} layout={timeLayout} className="w-full" style={{ height: 350 }} />

      {showSpectrum && spectrumTraces.length > 0 && (
        <PlotlyWrapper data={spectrumTraces} layout={spectrumLayout} className="w-full" style={{ height: 220 }} />
      )}

      <div className="flex items-center justify-center gap-6 text-sm font-mono">
        <span>
          f<sub>signal</sub> = {signalFreq} Hz
        </span>
        <span>
          f<sub>s</sub> = <span className="text-primary">{fs.toFixed(0)} Hz</span>
        </span>
        <span>
          f<sub>Nyquist</sub> = {nyquist} Hz
        </span>
        <span className={isAliasing ? "text-red-400 font-medium" : "text-emerald-400 font-medium"}>
          {isAliasing ? "ALIASING" : "No Aliasing"}
        </span>
      </div>

      <div className="px-2 max-w-[400px] mx-auto">
        <ParameterSlider
          label="Sampling Frequency (fs)"
          min={1}
          max={maxSamplingFreq}
          step={0.5}
          value={fs}
          onChange={handleFsChange}
          unit="Hz"
        />
      </div>
    </div>
  );
}
