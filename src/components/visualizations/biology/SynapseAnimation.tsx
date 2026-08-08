"use client";

import { useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface SynapseAnimationProps {
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showLabels?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────

export default function SynapseAnimation({
  width = 600,
  height = 350,
  title,
  showLabels = true,
}: SynapseAnimationProps) {
  const [step, setStep] = useState(0);

  const steps = [
    { label: "Resting", description: "No signal — vesicles stored in presynaptic terminal" },
    { label: "AP Arrives", description: "Action potential reaches axon terminal → Ca²⁺ channels open" },
    { label: "Vesicle Fusion", description: "Ca²⁺ influx triggers vesicle fusion with membrane" },
    { label: "NT Release", description: "Neurotransmitters released into synaptic cleft via exocytosis" },
    { label: "Receptor Binding", description: "NTs bind to receptors on postsynaptic membrane → ion channels open" },
    { label: "Reuptake", description: "NTs removed by reuptake, enzymatic breakdown, or diffusion" },
  ];

  const next = useCallback(() => setStep((s) => Math.min(s + 1, steps.length - 1)), [steps.length]);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const reset = useCallback(() => setStep(0), []);

  // Layout constants
  const preX = 100;
  const postX = width - 100;
  const midX = (preX + postX) / 2;
  const topY = 60;
  const botY = height - 80;
  const cleftTop = 140;
  const cleftBot = 210;

  return (
    <div className="flex flex-col gap-3 items-center">
      {title && <div className="text-sm font-medium text-muted-foreground">{title}</div>}

      <SVGCanvas width={width} height={height} padding={10}>
        {/* Presynaptic terminal */}
        <rect x={preX - 60} y={topY} width={width - 2 * (preX - 60)} height={cleftTop - topY} rx={12}
          className={cn(
            "stroke-[2] transition-colors",
            step >= 1 ? "fill-amber-500/10 stroke-amber-400" : "fill-foreground/5 stroke-foreground/20",
          )}
        />
        {showLabels && (
          <text x={midX} y={topY + 14} textAnchor="middle" className="fill-foreground/50 text-[9px] font-mono">
            PRESYNAPTIC TERMINAL
          </text>
        )}

        {/* Vesicles */}
        {[
          { cx: midX - 60, cy: topY + 40, released: step >= 3 },
          { cx: midX - 20, cy: topY + 35, released: step >= 3 },
          { cx: midX + 20, cy: topY + 42, released: step >= 4 },
          { cx: midX + 55, cy: topY + 38, released: false },
        ].map((v, i) => (
          <circle key={`vesicle-${i}`} cx={v.cx} cy={v.released && step >= 3 ? cleftTop + 15 : v.cy} r={10}
            className={cn(
              "stroke-[1.5] transition-all duration-700",
              v.released ? "fill-emerald-500/20 stroke-emerald-400" : "fill-purple-500/15 stroke-purple-400/50",
            )}
          />
        ))}

        {/* Ca²⁺ ions (show at step 2+) */}
        {step >= 2 && [midX - 80, midX - 40, midX + 40, midX + 80].map((cx, i) => (
          <text key={`ca-${i}`} x={cx} y={topY + 60} textAnchor="middle" className="fill-amber-400 text-[8px] font-mono font-bold">
            Ca²⁺
          </text>
        ))}

        {/* Synaptic Cleft */}
        <rect x={preX - 60} y={cleftTop} width={width - 2 * (preX - 60)} height={cleftBot - cleftTop}
          className="fill-foreground/[0.02] stroke-none"
        />
        <line x1={preX - 60} y1={cleftTop} x2={postX + 60} y2={cleftTop} className="stroke-foreground/15 stroke-[1]" strokeDasharray="4,3" />
        <line x1={preX - 60} y1={cleftBot} x2={postX + 60} y2={cleftBot} className="stroke-foreground/15 stroke-[1]" strokeDasharray="4,3" />
        {showLabels && (
          <text x={midX} y={(cleftTop + cleftBot) / 2} textAnchor="middle" dominantBaseline="central" className="fill-foreground/25 text-[8px] font-mono italic">
            SYNAPTIC CLEFT (~20nm)
          </text>
        )}

        {/* Neurotransmitter dots in cleft (step 4+) */}
        {step >= 3 &&
          [midX - 40, midX - 15, midX + 10, midX + 35].map((cx, i) => (
            <circle key={`nt-${i}`} cx={cx} cy={step >= 4 ? cleftBot - 8 : (cleftTop + cleftBot) / 2} r={4}
              className="fill-emerald-400 transition-all duration-500"
            />
          ))}

        {/* Postsynaptic membrane */}
        <rect x={preX - 60} y={cleftBot} width={width - 2 * (preX - 60)} height={botY - cleftBot + 20} rx={12}
          className={cn(
            "stroke-[2] transition-colors",
            step >= 4 ? "fill-blue-500/10 stroke-blue-400" : "fill-foreground/5 stroke-foreground/20",
          )}
        />
        {showLabels && (
          <text x={midX} y={cleftBot + 14} textAnchor="middle" className="fill-foreground/50 text-[9px] font-mono">
            POSTSYNAPTIC MEMBRANE
          </text>
        )}

        {/* Receptors */}
        {[midX - 50, midX - 20, midX + 10, midX + 40].map((cx, i) => (
          <g key={`receptor-${i}`}>
            <rect x={cx - 6} y={cleftBot - 4} width={12} height={10} rx={2}
              className={cn(
                "stroke-[1] transition-colors",
                step >= 4 ? "fill-blue-400/30 stroke-blue-400" : "fill-foreground/10 stroke-foreground/15",
              )}
            />
          </g>
        ))}

        {/* Ion channels (step 5) */}
        {step >= 4 && (
          <g>
            <text x={midX} y={cleftBot + 40} textAnchor="middle" className="fill-blue-400 text-[8px] font-mono">
              Na⁺ influx → Postsynaptic Potential
            </text>
          </g>
        )}

        {/* Reuptake arrows (step 6) */}
        {step >= 5 && (
          <g>
            <text x={midX} y={cleftBot + 55} textAnchor="middle" className="fill-purple-400 text-[8px] font-mono">
              ↑ Reuptake / Enzymatic breakdown
            </text>
          </g>
        )}
      </SVGCanvas>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={prev} disabled={step === 0}
          className="px-3 py-1 text-xs font-mono rounded bg-foreground/5 text-foreground/60 hover:bg-foreground/10 disabled:opacity-30 transition-colors">
          ← Prev
        </button>
        <span className="text-xs font-mono text-muted-foreground">
          Step {step + 1}/{steps.length}
        </span>
        <button type="button" onClick={next} disabled={step === steps.length - 1}
          className="px-3 py-1 text-xs font-mono rounded bg-foreground/5 text-foreground/60 hover:bg-foreground/10 disabled:opacity-30 transition-colors">
          Next →
        </button>
        <button type="button" onClick={reset}
          className="px-3 py-1 text-xs font-mono rounded bg-foreground/5 text-foreground/60 hover:bg-foreground/10 transition-colors">
          Reset
        </button>
      </div>

      <div className="text-center text-xs font-mono">
        <span className="text-primary font-medium">{steps[step].label}</span>
        <span className="text-muted-foreground ml-2">{steps[step].description}</span>
      </div>
    </div>
  );
}
