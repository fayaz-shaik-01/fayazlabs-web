"use client";

import { useState, useMemo } from "react";
import PlotlyWrapper from "../common/PlotlyWrapper";
import { ParameterSlider } from "../common/ParameterSlider";
import type { Data, Layout } from "plotly.js";

// ── Types ───────────────────────────────────────────────────────────────

type DistType =
  | "normal"
  | "uniform"
  | "exponential"
  | "poisson"
  | "binomial"
  | "rayleigh";

interface ProbabilityDistributionProps {
  readonly distribution?: DistType;
  readonly title?: string;
  readonly showCdf?: boolean;
  readonly showMean?: boolean;
  readonly showStd?: boolean;
  readonly xRange?: [number, number];
  readonly samples?: number;
}

// ── Distribution functions ──────────────────────────────────────────────

function normalPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function normalCdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / (sigma * Math.SQRT2);
  return 0.5 * (1 + erf(z));
}

function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function uniformPdf(x: number, a: number, b: number): number {
  return x >= a && x <= b ? 1 / (b - a) : 0;
}

function exponentialPdf(x: number, lambda: number): number {
  return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
}

function poissonPmf(k: number, lambda: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function binomialPmf(k: number, n: number, p: number): number {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  let logP = 0;
  for (let i = 0; i < k; i++) logP += Math.log(n - i) - Math.log(i + 1);
  logP += k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logP);
}

function rayleighPdf(x: number, sigma: number): number {
  if (x < 0) return 0;
  return (x / (sigma * sigma)) * Math.exp(-(x * x) / (2 * sigma * sigma));
}

// ── Component ───────────────────────────────────────────────────────────

export default function ProbabilityDistribution({
  distribution = "normal",
  title,
  showCdf = false,
  showMean = true,
  showStd = true,
  xRange: xRangeProp,
  samples = 300,
}: ProbabilityDistributionProps) {
  // Distribution-specific parameters with defaults
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [lambda, setLambda] = useState(2);
  const [n, setN] = useState(20);
  const [p, setP] = useState(0.5);

  const isContinuous = distribution !== "poisson" && distribution !== "binomial";

  // Auto x-range
  const xRange = useMemo<[number, number]>(() => {
    if (xRangeProp) return xRangeProp;
    switch (distribution) {
      case "normal": return [mu - 4 * sigma, mu + 4 * sigma];
      case "uniform": return [mu - 2, mu + sigma + 2];
      case "exponential": return [0, 5 / lambda];
      case "poisson": return [0, Math.max(lambda * 3, 10)];
      case "binomial": return [0, n];
      case "rayleigh": return [0, 4 * sigma];
      default: return [-5, 5];
    }
  }, [distribution, mu, sigma, lambda, n, xRangeProp]);

  // Compute PDF/PMF
  const { xVals, yPdf, yCdf, meanVal, stdVal } = useMemo(() => {
    const xs: number[] = [];
    const pdf: number[] = [];
    const cdf: number[] = [];
    let mean = 0;
    let std = 0;

    if (isContinuous) {
      const dx = (xRange[1] - xRange[0]) / (samples - 1);
      let cumulative = 0;
      for (let i = 0; i < samples; i++) {
        const x = xRange[0] + i * dx;
        xs.push(x);
        let pdfVal = 0;
        switch (distribution) {
          case "normal": pdfVal = normalPdf(x, mu, sigma); break;
          case "uniform": pdfVal = uniformPdf(x, mu, mu + sigma); break;
          case "exponential": pdfVal = exponentialPdf(x, lambda); break;
          case "rayleigh": pdfVal = rayleighPdf(x, sigma); break;
        }
        pdf.push(pdfVal);
        cumulative += pdfVal * dx;
        cdf.push(showCdf && distribution === "normal" ? normalCdf(x, mu, sigma) : cumulative);
      }

      switch (distribution) {
        case "normal": mean = mu; std = sigma; break;
        case "uniform": mean = mu + sigma / 2; std = sigma / Math.sqrt(12); break;
        case "exponential": mean = 1 / lambda; std = 1 / lambda; break;
        case "rayleigh": mean = sigma * Math.sqrt(Math.PI / 2); std = sigma * Math.sqrt((4 - Math.PI) / 2); break;
      }
    } else {
      // Discrete
      let cumulative = 0;
      const kMax = Math.round(xRange[1]);
      for (let k = 0; k <= kMax; k++) {
        xs.push(k);
        const pmfVal = distribution === "poisson" ? poissonPmf(k, lambda) : binomialPmf(k, n, p);
        pdf.push(pmfVal);
        cumulative += pmfVal;
        cdf.push(cumulative);
      }
      if (distribution === "poisson") { mean = lambda; std = Math.sqrt(lambda); }
      else { mean = n * p; std = Math.sqrt(n * p * (1 - p)); }
    }

    return { xVals: xs, yPdf: pdf, yCdf: cdf, meanVal: mean, stdVal: std };
  }, [distribution, xRange, samples, mu, sigma, lambda, n, p, isContinuous, showCdf]);

  const traces = useMemo<Data[]>(() => {
    const t: Data[] = [];

    if (isContinuous) {
      t.push({
        x: xVals, y: yPdf,
        type: "scatter", mode: "lines",
        name: "PDF", fill: "tozeroy",
        fillcolor: "rgba(59,130,246,0.15)",
        line: { color: "#3b82f6", width: 2 },
      });
    } else {
      t.push({
        x: xVals, y: yPdf,
        type: "bar",
        name: "PMF",
        marker: { color: "#3b82f6" },
      } as Data);
    }

    if (showCdf) {
      t.push({
        x: xVals, y: yCdf,
        type: "scatter", mode: "lines",
        name: "CDF",
        line: { color: "#10b981", width: 2 },
        yaxis: "y2",
      });
    }

    if (showMean) {
      t.push({
        x: [meanVal, meanVal],
        y: [0, Math.max(...yPdf) * 1.1],
        type: "scatter", mode: "lines",
        name: `μ = ${meanVal.toFixed(2)}`,
        line: { color: "#f59e0b", width: 1.5, dash: "dash" },
        hoverinfo: "skip",
      } as Data);
    }

    return t;
  }, [xVals, yPdf, yCdf, isContinuous, showCdf, showMean, meanVal]);

  const layout = useMemo<Partial<Layout>>(() => {
    const l: Partial<Layout> = {
      xaxis: { title: { text: isContinuous ? "x" : "k" }, showgrid: true },
      yaxis: { title: { text: isContinuous ? "f(x)" : "P(X=k)" }, showgrid: true },
      showlegend: true,
      hovermode: "x unified" as const,
    };
    if (showCdf) {
      l.yaxis2 = { title: { text: "F(x)" }, side: "right", overlaying: "y", showgrid: false };
    }
    if (title) l.title = { text: title, font: { size: 14 } };
    return l;
  }, [isContinuous, showCdf, title]);

  const distLabel = distribution.charAt(0).toUpperCase() + distribution.slice(1);

  return (
    <div className="flex flex-col gap-4">
      <PlotlyWrapper data={traces} layout={layout} className="w-full" style={{ height: 380 }} />

      <div className="flex items-center justify-center gap-6 text-sm font-mono">
        <span className="text-muted-foreground">{distLabel}</span>
        {showMean && <span>μ = {meanVal.toFixed(3)}</span>}
        {showStd && <span>σ = {stdVal.toFixed(3)}</span>}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 px-2 justify-center">
        {(distribution === "normal" || distribution === "rayleigh") && (
          <>
            {distribution === "normal" && (
              <ParameterSlider label="μ (mean)" min={-5} max={5} step={0.1} value={mu} onChange={setMu} className="w-[200px]" />
            )}
            <ParameterSlider label="σ (std)" min={0.1} max={5} step={0.1} value={sigma} onChange={setSigma} className="w-[200px]" />
          </>
        )}
        {(distribution === "exponential" || distribution === "poisson") && (
          <ParameterSlider label="λ" min={0.1} max={10} step={0.1} value={lambda} onChange={setLambda} className="w-[200px]" />
        )}
        {distribution === "binomial" && (
          <>
            <ParameterSlider label="n (trials)" min={1} max={50} step={1} value={n} onChange={setN} className="w-[200px]" />
            <ParameterSlider label="p (prob)" min={0.01} max={0.99} step={0.01} value={p} onChange={setP} className="w-[200px]" />
          </>
        )}
        {distribution === "uniform" && (
          <>
            <ParameterSlider label="a (min)" min={-5} max={4} step={0.1} value={mu} onChange={setMu} className="w-[200px]" />
            <ParameterSlider label="b−a (width)" min={0.5} max={10} step={0.1} value={sigma} onChange={setSigma} className="w-[200px]" />
          </>
        )}
      </div>
    </div>
  );
}
