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

type ResponseType = "step" | "impulse" | "both";

interface StepResponseProps {
  readonly responseType?: ResponseType;
  readonly wn?: number;
  readonly zeta?: number;
  readonly gain?: number;
  readonly timeRange?: [number, number];
  readonly samples?: number;
  readonly title?: string;
  readonly params?: ParamDef[];
  readonly showSpecifications?: boolean;
  readonly customStep?: Array<{ t: number; y: number }>;
  readonly customImpulse?: Array<{ t: number; y: number }>;
}

// ── Second-order system response ────────────────────────────────────────

function secondOrderStep(
  t: number,
  wn: number,
  zeta: number,
  K: number,
): number {
  if (t < 0) return 0;
  if (zeta < 0) return 0;

  if (zeta === 0) {
    // Undamped
    return K * (1 - Math.cos(wn * t));
  }

  if (zeta < 1) {
    // Underdamped
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    const phi = Math.acos(zeta);
    return K * (1 - (Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t + phi));
  }

  if (zeta === 1) {
    // Critically damped
    return K * (1 - (1 + wn * t) * Math.exp(-wn * t));
  }

  // Overdamped
  const s1 = -zeta * wn + wn * Math.sqrt(zeta * zeta - 1);
  const s2 = -zeta * wn - wn * Math.sqrt(zeta * zeta - 1);
  return K * (1 + (s1 * Math.exp(s2 * t) - s2 * Math.exp(s1 * t)) / (s2 - s1));
}

function secondOrderImpulse(
  t: number,
  wn: number,
  zeta: number,
  K: number,
): number {
  if (t <= 0) return 0;

  if (zeta < 1) {
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    return K * (wn / Math.sqrt(1 - zeta * zeta)) * Math.exp(-zeta * wn * t) * Math.sin(wd * t);
  }

  if (zeta === 1) {
    return K * wn * wn * t * Math.exp(-wn * t);
  }

  // Overdamped
  const s1 = -zeta * wn + wn * Math.sqrt(zeta * zeta - 1);
  const s2 = -zeta * wn - wn * Math.sqrt(zeta * zeta - 1);
  return K * wn * wn * (Math.exp(s1 * t) - Math.exp(s2 * t)) / (s1 - s2);
}

// ── Time-domain specifications ──────────────────────────────────────────

function computeSpecs(wn: number, zeta: number) {
  if (zeta >= 1 || zeta <= 0 || wn <= 0) return null;
  const wd = wn * Math.sqrt(1 - zeta * zeta);
  const tr = (Math.PI - Math.acos(zeta)) / wd;
  const tp = Math.PI / wd;
  const mp = Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta)) * 100;
  const ts = 4 / (zeta * wn); // 2% criterion

  return { tr, tp, mp, ts };
}

// ── Component ───────────────────────────────────────────────────────────

export default function StepResponse({
  responseType = "step",
  wn: wnProp = 1,
  zeta: zetaProp = 0.5,
  gain: gainProp = 1,
  timeRange = [0, 15],
  samples = 500,
  title,
  params = [],
  showSpecifications = true,
  customStep,
  customImpulse,
}: StepResponseProps) {
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

  const wn = paramValues["wn"] ?? wnProp;
  const zeta = paramValues["zeta"] ?? zetaProp;
  const K = paramValues["K"] ?? gainProp;

  // Time values
  const tValues = useMemo(() => {
    const [tMin, tMax] = timeRange;
    const dt = (tMax - tMin) / (samples - 1);
    return Array.from({ length: samples }, (_, i) => tMin + i * dt);
  }, [timeRange, samples]);

  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];

    if (responseType === "step" || responseType === "both") {
      if (customStep) {
        t.push({
          x: customStep.map((p) => p.t),
          y: customStep.map((p) => p.y),
          type: "scatter",
          mode: "lines",
          name: "Step Response",
          line: { color: "#3b82f6", width: 2 },
        });
      } else {
        t.push({
          x: tValues,
          y: tValues.map((tv) => secondOrderStep(tv, wn, zeta, K)),
          type: "scatter",
          mode: "lines",
          name: "Step Response",
          line: { color: "#3b82f6", width: 2 },
        });
      }
    }

    if (responseType === "impulse" || responseType === "both") {
      if (customImpulse) {
        t.push({
          x: customImpulse.map((p) => p.t),
          y: customImpulse.map((p) => p.y),
          type: "scatter",
          mode: "lines",
          name: "Impulse Response",
          line: { color: "#ef4444", width: 2, dash: "dash" },
        });
      } else {
        t.push({
          x: tValues,
          y: tValues.map((tv) => secondOrderImpulse(tv, wn, zeta, K)),
          type: "scatter",
          mode: "lines",
          name: "Impulse Response",
          line: { color: "#ef4444", width: 2, dash: "dash" },
        });
      }
    }

    // Steady-state line for step response
    if (responseType === "step" || responseType === "both") {
      t.push({
        x: timeRange,
        y: [K, K],
        type: "scatter",
        mode: "lines",
        name: "Steady State",
        line: { color: "rgba(150,150,150,0.5)", width: 1, dash: "dot" },
        hoverinfo: "skip",
      } as Data);
    }

    return t;
  }, [responseType, tValues, wn, zeta, K, customStep, customImpulse, timeRange]);

  const layout = useMemo<Partial<Layout>>(
    () => ({
      xaxis: { title: { text: "Time (s)" }, range: timeRange, showgrid: true, zeroline: true },
      yaxis: { title: { text: "Amplitude" }, showgrid: true, zeroline: true },
      showlegend: responseType === "both" || (customStep !== undefined && customImpulse !== undefined),
      hovermode: "x unified" as const,
      ...(title ? { title: { text: title, font: { size: 14 } } } : {}),
    }),
    [timeRange, title, responseType, customStep, customImpulse],
  );

  const specs = useMemo(() => {
    if (!showSpecifications || customStep) return null;
    return computeSpecs(wn, zeta);
  }, [wn, zeta, showSpecifications, customStep]);

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper
        data={traces}
        layout={layout}
        className="w-full"
        style={{ height: 400 }}
      />

      {/* Time-domain specifications */}
      {specs && (
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-mono">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-muted-foreground">ζ</span>
            <span className={zeta < 1 ? "text-blue-400" : "text-amber-400"}>{zeta.toFixed(3)}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-muted-foreground">ωn</span>
            <span>{wn.toFixed(2)} rad/s</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-muted-foreground">Rise Time</span>
            <span>{specs.tr.toFixed(3)} s</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-muted-foreground">Peak Time</span>
            <span>{specs.tp.toFixed(3)} s</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-muted-foreground">% Overshoot</span>
            <span className={specs.mp > 20 ? "text-red-400" : "text-emerald-400"}>{specs.mp.toFixed(1)}%</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-muted-foreground">Settling (2%)</span>
            <span>{specs.ts.toFixed(3)} s</span>
          </div>
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
