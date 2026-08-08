"use client";

import { useState, useMemo, useCallback } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

type FilterType = "lowpass" | "highpass" | "bandpass" | "bandstop";
type FilterOrder = 1 | 2;

interface ParamDef {
  name: string;
  label?: string;
  min: number;
  max: number;
  step?: number;
  default: number;
  unit?: string;
}

interface FilterResponsePlotProps {
  readonly filterType?: FilterType;
  readonly order?: FilterOrder;
  readonly fc?: number;
  readonly Q?: number;
  readonly bw?: number;
  readonly params?: ParamDef[];
  readonly freqRange?: [number, number];
  readonly samples?: number;
  readonly title?: string;
  readonly showPhase?: boolean;
  readonly showCutoff?: boolean;
}

// ── Filter transfer function evaluation ─────────────────────────────────

function evaluateFilter(
  omega: number,
  filterType: FilterType,
  order: FilterOrder,
  wc: number,
  Q: number,
): { mag: number; phaseDeg: number } {
  const s = omega / wc; // normalized frequency

  if (order === 1) {
    let re: number;
    let im: number;

    switch (filterType) {
      case "lowpass":
        // H = 1 / (1 + js)
        re = 1 / (1 + s * s);
        im = -s / (1 + s * s);
        break;
      case "highpass":
        // H = js / (1 + js)
        re = s * s / (1 + s * s);
        im = s / (1 + s * s);
        break;
      default:
        re = 1;
        im = 0;
    }

    return {
      mag: Math.hypot(re, im),
      phaseDeg: (Math.atan2(im, re) * 180) / Math.PI,
    };
  }

  // Second order
  const denom_re = 1 - s * s;
  const denom_im = s / Q;
  const denom_mag2 = denom_re * denom_re + denom_im * denom_im;

  let num_re: number;
  let num_im: number;

  switch (filterType) {
    case "lowpass":
      num_re = 1;
      num_im = 0;
      break;
    case "highpass":
      num_re = -(s * s);
      num_im = 0;
      break;
    case "bandpass":
      num_re = 0;
      num_im = s / Q;
      break;
    case "bandstop":
      num_re = 1 - s * s;
      num_im = 0;
      break;
    default:
      num_re = 1;
      num_im = 0;
  }

  const h_re = (num_re * denom_re + num_im * denom_im) / denom_mag2;
  const h_im = (num_im * denom_re - num_re * denom_im) / denom_mag2;

  return {
    mag: Math.hypot(h_re, h_im),
    phaseDeg: (Math.atan2(h_im, h_re) * 180) / Math.PI,
  };
}

// ── Component ───────────────────────────────────────────────────────────

export default function FilterResponsePlot({
  filterType = "lowpass",
  order = 2,
  fc = 1000,
  Q: qProp = 0.707,
  bw,
  params = [],
  freqRange = [1, 5],
  samples = 500,
  title,
  showPhase = true,
  showCutoff = true,
}: FilterResponsePlotProps) {
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

  const currentFc = paramValues["fc"] ?? fc;
  const currentQ = paramValues["Q"] ?? qProp;
  const wc = 2 * Math.PI * currentFc;

  // Generate log-spaced frequencies
  const frequencies = useMemo(() => {
    const [logMin, logMax] = freqRange;
    const dLog = (logMax - logMin) / (samples - 1);
    return Array.from({ length: samples }, (_, i) => Math.pow(10, logMin + i * dLog));
  }, [freqRange, samples]);

  const { magDb, phaseDeg } = useMemo(() => {
    const mDb: number[] = [];
    const ph: number[] = [];
    let prevPhase = 0;

    for (const freq of frequencies) {
      const omega = 2 * Math.PI * freq;
      const result = evaluateFilter(omega, filterType, order, wc, currentQ);
      const dbVal = 20 * Math.log10(Math.max(result.mag, 1e-20));
      mDb.push(dbVal);

      // Unwrap phase
      let phaseDegVal = result.phaseDeg;
      if (ph.length > 0) {
        while (phaseDegVal - prevPhase > 180) phaseDegVal -= 360;
        while (phaseDegVal - prevPhase < -180) phaseDegVal += 360;
      }
      ph.push(phaseDegVal);
      prevPhase = phaseDegVal;
    }

    return { magDb: mDb, phaseDeg: ph };
  }, [frequencies, filterType, order, wc, currentQ]);

  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [
      {
        x: frequencies,
        y: magDb,
        type: "scatter",
        mode: "lines",
        name: "|H(f)| dB",
        line: { color: "#3b82f6", width: 2 },
        yaxis: "y",
      },
    ];

    if (showPhase) {
      t.push({
        x: frequencies,
        y: phaseDeg,
        type: "scatter",
        mode: "lines",
        name: "∠H(f)°",
        line: { color: "#ef4444", width: 2 },
        yaxis: "y2",
      });
    }

    // Cutoff frequency marker
    if (showCutoff) {
      t.push({
        x: [currentFc, currentFc],
        y: [-60, 10],
        type: "scatter",
        mode: "lines",
        name: `fc = ${currentFc} Hz`,
        line: { color: "rgba(150,150,150,0.4)", width: 1, dash: "dash" },
        hoverinfo: "skip",
        yaxis: "y",
      } as Data);
    }

    return t;
  }, [frequencies, magDb, phaseDeg, showPhase, showCutoff, currentFc]);

  const filterLabel = filterType.charAt(0).toUpperCase() + filterType.slice(1);

  const layout = useMemo<Partial<Layout>>(() => {
    const l: Partial<Layout> = {
      xaxis: {
        title: { text: "Frequency (Hz)" },
        type: "log",
        showgrid: true,
      },
      yaxis: {
        title: { text: "Magnitude (dB)" },
        showgrid: true,
        zeroline: true,
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
        style={{ height: 420 }}
      />

      <div className="flex items-center justify-center gap-6 text-sm font-mono">
        <span className="text-muted-foreground">{filterLabel} · Order {order}</span>
        <span>fc = <span className="text-primary">{currentFc.toFixed(0)} Hz</span></span>
        {order === 2 && <span>Q = <span className="text-primary">{currentQ.toFixed(3)}</span></span>}
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
              unit={p.unit}
              className="flex-1 min-w-[160px] max-w-[260px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
