"use client";

import { useMemo, useState } from "react";
import SVGCanvas from "../common/SVGCanvas";

// ── Types ───────────────────────────────────────────────────────────────

interface ActionPotentialPlotProps {
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly restingPotential?: number;
  readonly thresholdPotential?: number;
  readonly peakPotential?: number;
  readonly showPhases?: boolean;
  readonly interactive?: boolean;
}

interface Phase {
  id: string;
  label: string;
  description: string;
  color: string;
  tStart: number;
  tEnd: number;
}

// ── Component ───────────────────────────────────────────────────────────

export default function ActionPotentialPlot({
  width = 600,
  height = 360,
  title,
  restingPotential = -70,
  thresholdPotential = -55,
  peakPotential = 30,
  showPhases = true,
  interactive = true,
}: ActionPotentialPlotProps) {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const padL = 60;
  const padR = 30;
  const padT = 30;
  const padB = 50;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // mV range
  const mVMin = -90;
  const mVMax = 50;
  const tMax = 6; // ms

  const scaleX = (t: number) => padL + (t / tMax) * plotW;
  const scaleY = (mV: number) => padT + ((mVMax - mV) / (mVMax - mVMin)) * plotH;

  const phases: Phase[] = useMemo(
    () => [
      { id: "resting", label: "Resting", description: `Membrane at ${restingPotential} mV (K⁺ leak channels)`, color: "#6b7280", tStart: 0, tEnd: 1.0 },
      { id: "depolarization", label: "Depolarization", description: "Na⁺ channels open → rapid inflow", color: "#ef4444", tStart: 1.0, tEnd: 2.0 },
      { id: "overshoot", label: "Overshoot", description: `Peaks at +${peakPotential} mV → Na⁺ channels inactivate`, color: "#f59e0b", tStart: 2.0, tEnd: 2.5 },
      { id: "repolarization", label: "Repolarization", description: "K⁺ channels open → K⁺ outflow restores negative potential", color: "#3b82f6", tStart: 2.5, tEnd: 3.8 },
      { id: "hyperpolarization", label: "Hyperpolarization", description: "K⁺ channels slow to close → undershoot below resting", color: "#8b5cf6", tStart: 3.8, tEnd: 5.0 },
      { id: "recovery", label: "Recovery", description: "Na⁺/K⁺ pump restores resting potential", color: "#6b7280", tStart: 5.0, tEnd: 6.0 },
    ],
    [restingPotential, peakPotential],
  );

  // Action potential waveform points
  const waveform = useMemo(() => {
    const rp = restingPotential;
    const th = thresholdPotential;
    const pk = peakPotential;
    const hyper = rp - 10;

    const pts: Array<[number, number]> = [
      [0, rp], [0.8, rp], [1.0, th],
      [1.5, 0], [2.0, pk], [2.2, pk - 5],
      [2.5, 0], [3.0, th], [3.5, rp],
      [3.8, hyper], [4.2, hyper + 2], [4.8, rp - 2],
      [5.5, rp], [6.0, rp],
    ];

    let d = `M ${scaleX(pts[0][0])} ${scaleY(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      const cx1 = scaleX(t0 + (t1 - t0) * 0.5);
      const cy1 = scaleY(v0);
      const cx2 = scaleX(t0 + (t1 - t0) * 0.5);
      const cy2 = scaleY(v1);
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${scaleX(t1)} ${scaleY(v1)}`;
    }
    return d;
  }, [restingPotential, thresholdPotential, peakPotential, plotW, plotH]);

  const activePhase = phases.find((p) => p.id === hoveredPhase);

  return (
    <div className="flex flex-col gap-2">
      {title && <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>}

      <SVGCanvas width={width} height={height} padding={5}>
        {/* Phase shading */}
        {showPhases &&
          phases.map((ph) => (
            <rect
              key={ph.id}
              x={scaleX(ph.tStart)}
              y={padT}
              width={scaleX(ph.tEnd) - scaleX(ph.tStart)}
              height={plotH}
              fill={ph.color}
              fillOpacity={hoveredPhase === ph.id ? 0.12 : 0.04}
              onMouseEnter={() => interactive && setHoveredPhase(ph.id)}
              onMouseLeave={() => interactive && setHoveredPhase(null)}
              className={interactive ? "cursor-pointer transition-[fill-opacity]" : undefined}
            />
          ))}

        {/* Grid lines */}
        {[-90, -70, -55, 0, 30, 50].map((mV) => (
          <g key={`grid-${mV}`}>
            <line
              x1={padL} y1={scaleY(mV)} x2={padL + plotW} y2={scaleY(mV)}
              className="stroke-foreground/5 stroke-[0.5]"
              strokeDasharray={mV === 0 ? "none" : "3,3"}
            />
            <text x={padL - 8} y={scaleY(mV)} textAnchor="end" dominantBaseline="central" className="fill-foreground/40 text-[9px] font-mono">
              {mV}
            </text>
          </g>
        ))}

        {/* Threshold line */}
        <line
          x1={padL} y1={scaleY(thresholdPotential)} x2={padL + plotW} y2={scaleY(thresholdPotential)}
          className="stroke-red-400/30 stroke-[1]"
          strokeDasharray="6,3"
        />
        <text x={padL + plotW + 4} y={scaleY(thresholdPotential)} dominantBaseline="central" className="fill-red-400/50 text-[8px] font-mono">
          threshold
        </text>

        {/* Resting potential line */}
        <line
          x1={padL} y1={scaleY(restingPotential)} x2={padL + plotW} y2={scaleY(restingPotential)}
          className="stroke-foreground/15 stroke-[1]"
          strokeDasharray="6,3"
        />

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} className="stroke-foreground/30 stroke-[1.5]" />
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} className="stroke-foreground/30 stroke-[1.5]" />

        {/* Axis labels */}
        <text x={padL + plotW / 2} y={height - 8} textAnchor="middle" className="fill-foreground/50 text-[10px] font-mono">
          Time (ms)
        </text>
        <text
          x={14} y={padT + plotH / 2}
          textAnchor="middle" dominantBaseline="central"
          transform={`rotate(-90, 14, ${padT + plotH / 2})`}
          className="fill-foreground/50 text-[10px] font-mono"
        >
          Membrane Potential (mV)
        </text>

        {/* Time ticks */}
        {[0, 1, 2, 3, 4, 5, 6].map((t) => (
          <g key={`tick-${t}`}>
            <line x1={scaleX(t)} y1={padT + plotH} x2={scaleX(t)} y2={padT + plotH + 5} className="stroke-foreground/30 stroke-[1]" />
            <text x={scaleX(t)} y={padT + plotH + 16} textAnchor="middle" className="fill-foreground/40 text-[9px] font-mono">{t}</text>
          </g>
        ))}

        {/* Waveform */}
        <path d={waveform} fill="none" className="stroke-emerald-400 stroke-[2.5]" />

        {/* Phase labels (top) */}
        {showPhases &&
          phases.map((ph) => {
            const mid = scaleX((ph.tStart + ph.tEnd) / 2);
            return (
              <text
                key={`label-${ph.id}`}
                x={mid} y={padT - 8}
                textAnchor="middle"
                fill={ph.color}
                className="text-[7px] font-mono"
                fillOpacity={hoveredPhase === ph.id ? 1 : 0.5}
              >
                {ph.label}
              </text>
            );
          })}
      </SVGCanvas>

      {/* Phase info */}
      {interactive && (
        <div className="h-10 flex items-center justify-center">
          {activePhase ? (
            <div className="text-xs font-mono">
              <span className="font-medium" style={{ color: activePhase.color }}>{activePhase.label}</span>
              <span className="text-muted-foreground ml-2">{activePhase.description}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Hover over a phase region to learn more</span>
          )}
        </div>
      )}
    </div>
  );
}
