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
  unit?: string;
}

interface BodePlotBuilderProps {
  readonly numerator: number[];
  readonly denominator: number[];
  readonly params?: ParamDef[];
  readonly freqRange?: [number, number];
  readonly title?: string;
  readonly samples?: number;
  readonly showPhase?: boolean;
  readonly showGainMargin?: boolean;
  readonly showPhaseMargin?: boolean;
}

// ── Transfer function evaluation ────────────────────────────────────────

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

export default function BodePlotBuilder({
  numerator,
  denominator,
  params = [],
  freqRange = [-2, 4],
  title,
  samples = 500,
  showPhase = true,
  showGainMargin = false,
  showPhaseMargin = false,
}: BodePlotBuilderProps) {
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

  // Generate log-spaced frequencies
  const frequencies = useMemo(() => {
    const [logMin, logMax] = freqRange;
    const dLog = (logMax - logMin) / (samples - 1);
    return Array.from({ length: samples }, (_, i) => Math.pow(10, logMin + i * dLog));
  }, [freqRange, samples]);

  // Compute magnitude and phase
  const { magnitudeDb, phaseDeg, gainCrossoverFreq, phaseCrossoverFreq } = useMemo(() => {
    const magDb: number[] = [];
    const phDeg: number[] = [];
    let gcFreq: number | null = null;
    let pcFreq: number | null = null;
    let prevMagDb = 0;
    let prevPhaseDeg = 0;

    for (const omega of frequencies) {
      const num = evaluatePoly(numerator, omega);
      const den = evaluatePoly(denominator, omega);
      const h = complexDiv(num, den);
      const mag = Math.hypot(h.re, h.im);
      const magDbVal = 20 * Math.log10(Math.max(mag, 1e-20));
      const phaseRad = Math.atan2(h.im, h.re);
      let phaseDegVal = (phaseRad * 180) / Math.PI;

      // Unwrap phase
      if (phDeg.length > 0) {
        while (phaseDegVal - prevPhaseDeg > 180) phaseDegVal -= 360;
        while (phaseDegVal - prevPhaseDeg < -180) phaseDegVal += 360;
      }

      magDb.push(magDbVal);
      phDeg.push(phaseDegVal);

      // Gain crossover (|H| crosses 0 dB)
      if (gcFreq === null && magDb.length > 1 && prevMagDb >= 0 && magDbVal < 0) {
        gcFreq = omega;
      }

      // Phase crossover (phase crosses -180°)
      if (pcFreq === null && phDeg.length > 1 && prevPhaseDeg > -180 && phaseDegVal <= -180) {
        pcFreq = omega;
      }

      prevMagDb = magDbVal;
      prevPhaseDeg = phaseDegVal;
    }

    return {
      magnitudeDb: magDb,
      phaseDeg: phDeg,
      gainCrossoverFreq: gcFreq,
      phaseCrossoverFreq: pcFreq,
    };
  }, [numerator, denominator, frequencies]);

  // Magnitude trace
  const magTrace: Data = {
    x: frequencies,
    y: magnitudeDb,
    type: "scatter",
    mode: "lines",
    name: "|H(jω)| dB",
    line: { color: "#3b82f6", width: 2 },
    xaxis: "x",
    yaxis: "y",
  };

  // Phase trace
  const phaseTrace: Data = {
    x: frequencies,
    y: phaseDeg,
    type: "scatter",
    mode: "lines",
    name: "∠H(jω)°",
    line: { color: "#ef4444", width: 2 },
    xaxis: "x",
    yaxis: "y2",
  };

  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [magTrace];
    if (showPhase) t.push(phaseTrace);

    // Gain margin marker
    if (showGainMargin && phaseCrossoverFreq !== null) {
      const idx = frequencies.findIndex((f) => f >= phaseCrossoverFreq);
      if (idx >= 0) {
        t.push({
          x: [phaseCrossoverFreq],
          y: [magnitudeDb[idx]],
          type: "scatter",
          mode: "text+markers",
          marker: { size: 10, color: "#f59e0b", symbol: "diamond" },
          text: [`GM = ${(-magnitudeDb[idx]).toFixed(1)} dB`],
          textposition: "top center",
          textfont: { size: 10, color: "#fbbf24" },
          name: "Gain Margin",
          xaxis: "x",
          yaxis: "y",
        } as Data);
      }
    }

    // Phase margin marker
    if (showPhaseMargin && gainCrossoverFreq !== null) {
      const idx = frequencies.findIndex((f) => f >= gainCrossoverFreq);
      if (idx >= 0) {
        const pm = 180 + phaseDeg[idx];
        t.push({
          x: [gainCrossoverFreq],
          y: [phaseDeg[idx]],
          type: "scatter",
          mode: "text+markers",
          marker: { size: 10, color: "#10b981", symbol: "diamond" },
          text: [`PM = ${pm.toFixed(1)}°`],
          textposition: "top center",
          textfont: { size: 10, color: "#34d399" },
          name: "Phase Margin",
          xaxis: "x",
          yaxis: "y2",
        } as Data);
      }
    }

    return t;
  }, [magTrace, phaseTrace, showPhase, showGainMargin, showPhaseMargin, gainCrossoverFreq, phaseCrossoverFreq, frequencies, magnitudeDb, phaseDeg]);

  const layout = useMemo<Partial<Layout>>(() => {
    const l: Partial<Layout> = {
      xaxis: {
        title: { text: "Frequency (rad/s)" },
        type: "log",
        showgrid: true,
        zeroline: false,
      },
      yaxis: {
        title: { text: "Magnitude (dB)" },
        showgrid: true,
        zeroline: true,
        zerolinewidth: 2,
        side: "left",
      },
      showlegend: true,
      hovermode: "x unified" as const,
      legend: { x: 1, xanchor: "right" as const, y: 1 },
    };

    if (showPhase) {
      l.yaxis2 = {
        title: { text: "Phase (°)" },
        showgrid: false,
        zeroline: false,
        side: "right",
        overlaying: "y",
      };
    }

    if (title) {
      l.title = { text: title, font: { size: 14 } };
    }

    return l;
  }, [title, showPhase]);

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper
        data={traces}
        layout={layout}
        className="w-full"
        style={{ height: 450 }}
      />

      {/* Margin summary */}
      {(showGainMargin || showPhaseMargin) && (
        <div className="flex items-center justify-center gap-8 text-sm font-mono">
          {showGainMargin && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-muted-foreground">Gain Margin</span>
              <span className="text-amber-400">
                {phaseCrossoverFreq !== null
                  ? `${(-magnitudeDb[frequencies.findIndex((f) => f >= phaseCrossoverFreq)]).toFixed(1)} dB`
                  : "∞ (stable)"}
              </span>
            </div>
          )}
          {showPhaseMargin && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-muted-foreground">Phase Margin</span>
              <span className="text-emerald-400">
                {gainCrossoverFreq !== null
                  ? `${(180 + phaseDeg[frequencies.findIndex((f) => f >= gainCrossoverFreq)]).toFixed(1)}°`
                  : "∞ (stable)"}
              </span>
            </div>
          )}
        </div>
      )}

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
