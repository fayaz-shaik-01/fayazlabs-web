"use client";

import { useState, useMemo } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface DataSeries {
  label: string;
  values: number[];
  color?: string;
}

interface DataInterpretationChartProps {
  readonly categories: string[];
  readonly series: DataSeries[];
  readonly chartType?: "bar" | "line" | "grouped-bar" | "stacked-bar";
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly yLabel?: string;
  readonly showValues?: boolean;
  readonly interactive?: boolean;
}

const DEFAULT_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

// ── Component ───────────────────────────────────────────────────────────

export default function DataInterpretationChart({
  categories,
  series,
  chartType = "bar",
  width = 600,
  height = 380,
  title,
  yLabel,
  showValues = false,
  interactive = true,
}: DataInterpretationChartProps) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(chartType);

  const padL = 60;
  const padR = 25;
  const padT = 30;
  const padB = 60;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Compute max value
  const maxVal = useMemo(() => {
    if (selectedType === "stacked-bar") {
      let mx = 0;
      for (let i = 0; i < categories.length; i++) {
        const sum = series.reduce((s, ser) => s + (ser.values[i] ?? 0), 0);
        mx = Math.max(mx, sum);
      }
      return mx * 1.15;
    }
    let mx = 0;
    for (const ser of series) {
      for (const v of ser.values) mx = Math.max(mx, v);
    }
    return mx * 1.15;
  }, [categories, series, selectedType]);

  const scaleY = (v: number) => padT + ((maxVal - v) / maxVal) * plotH;
  const catW = plotW / categories.length;

  const TYPES = ["bar", "grouped-bar", "stacked-bar", "line"] as const;

  return (
    <div className="flex flex-col gap-3 items-center">
      {title && <div className="text-sm font-medium text-muted-foreground">{title}</div>}

      {/* Type selector */}
      <div className="flex items-center gap-1.5">
        {TYPES.map((t) => (
          <button key={t} type="button" onClick={() => setSelectedType(t)}
            className={cn(
              "px-2 py-1 text-[10px] font-mono rounded transition-colors capitalize",
              selectedType === t
                ? "bg-primary/10 text-primary"
                : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <SVGCanvas width={width} height={height} padding={5}>
        {/* Grid lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const v = (i / 5) * maxVal;
          return (
            <g key={`grid-${i}`}>
              <line x1={padL} y1={scaleY(v)} x2={padL + plotW} y2={scaleY(v)} className="stroke-foreground/5 stroke-[0.5]" />
              <text x={padL - 8} y={scaleY(v)} textAnchor="end" dominantBaseline="central" className="fill-foreground/35 text-[8px] font-mono">
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} className="stroke-foreground/30 stroke-[1.5]" />
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} className="stroke-foreground/30 stroke-[1.5]" />

        {/* Y label */}
        {yLabel && (
          <text x={12} y={padT + plotH / 2} textAnchor="middle" dominantBaseline="central"
            transform={`rotate(-90, 12, ${padT + plotH / 2})`}
            className="fill-foreground/50 text-[10px] font-mono"
          >
            {yLabel}
          </text>
        )}

        {/* Category labels */}
        {categories.map((cat, i) => (
          <text key={`cat-${i}`} x={padL + i * catW + catW / 2} y={padT + plotH + 18} textAnchor="middle"
            className="fill-foreground/50 text-[9px] font-mono"
          >
            {cat}
          </text>
        ))}

        {/* Simple bar / grouped / stacked */}
        {(selectedType === "bar" || selectedType === "grouped-bar" || selectedType === "stacked-bar") &&
          categories.map((_, ci) => {
            const baseX = padL + ci * catW;

            if (selectedType === "stacked-bar") {
              let cumY = 0;
              return (
                <g key={`stack-${ci}`}>
                  {series.map((ser, si) => {
                    const v = ser.values[ci] ?? 0;
                    const barH = (v / maxVal) * plotH;
                    const y = scaleY(cumY + v);
                    cumY += v;
                    const color = ser.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length];
                    const barKey = `${ci}-${si}`;
                    const isHl = hoveredBar === barKey;
                    return (
                      <g key={barKey}
                        onMouseEnter={() => interactive && setHoveredBar(barKey)}
                        onMouseLeave={() => interactive && setHoveredBar(null)}
                      >
                        <rect x={baseX + catW * 0.15} y={y} width={catW * 0.7} height={barH}
                          fill={color} fillOpacity={isHl ? 0.7 : 0.4}
                          stroke={color} strokeWidth={isHl ? 1.5 : 0}
                          rx={2} className="transition-[fill-opacity]"
                        />
                        {showValues && (
                          <text x={baseX + catW / 2} y={y + barH / 2} textAnchor="middle" dominantBaseline="central"
                            className="fill-foreground/60 text-[7px] font-mono"
                          >
                            {v}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            }

            if (selectedType === "grouped-bar") {
              const barW = (catW * 0.75) / series.length;
              return (
                <g key={`grouped-${ci}`}>
                  {series.map((ser, si) => {
                    const v = ser.values[ci] ?? 0;
                    const barH = (v / maxVal) * plotH;
                    const x = baseX + catW * 0.125 + si * barW;
                    const color = ser.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length];
                    const barKey = `${ci}-${si}`;
                    const isHl = hoveredBar === barKey;
                    return (
                      <g key={barKey}
                        onMouseEnter={() => interactive && setHoveredBar(barKey)}
                        onMouseLeave={() => interactive && setHoveredBar(null)}
                      >
                        <rect x={x} y={scaleY(v)} width={barW - 2} height={barH}
                          fill={color} fillOpacity={isHl ? 0.7 : 0.4}
                          stroke={color} strokeWidth={isHl ? 1.5 : 0}
                          rx={2} className="transition-[fill-opacity]"
                        />
                        {showValues && (
                          <text x={x + barW / 2} y={scaleY(v) - 6} textAnchor="middle"
                            className="fill-foreground/50 text-[7px] font-mono"
                          >
                            {v}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            }

            // Simple bar (first series only)
            const v = series[0]?.values[ci] ?? 0;
            const barH = (v / maxVal) * plotH;
            const color = series[0]?.color ?? DEFAULT_COLORS[0];
            const isHl = hoveredBar === `${ci}`;
            return (
              <g key={`bar-${ci}`}
                onMouseEnter={() => interactive && setHoveredBar(`${ci}`)}
                onMouseLeave={() => interactive && setHoveredBar(null)}
              >
                <rect x={baseX + catW * 0.2} y={scaleY(v)} width={catW * 0.6} height={barH}
                  fill={color} fillOpacity={isHl ? 0.7 : 0.4}
                  stroke={color} strokeWidth={isHl ? 1.5 : 0}
                  rx={3} className="transition-[fill-opacity]"
                />
                {showValues && (
                  <text x={baseX + catW / 2} y={scaleY(v) - 6} textAnchor="middle"
                    className="fill-foreground/50 text-[8px] font-mono"
                  >
                    {v}
                  </text>
                )}
              </g>
            );
          })}

        {/* Line chart */}
        {selectedType === "line" &&
          series.map((ser, si) => {
            const color = ser.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length];
            const points = ser.values.map((v, ci) => ({
              x: padL + ci * catW + catW / 2,
              y: scaleY(v),
            }));

            const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

            return (
              <g key={`line-${si}`}>
                <path d={d} fill="none" stroke={color} strokeWidth={2} />
                {points.map((p, i) => (
                  <circle key={`dot-${si}-${i}`} cx={p.x} cy={p.y} r={3.5}
                    fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5}
                  />
                ))}
              </g>
            );
          })}

        {/* Legend */}
        {series.length > 1 && (
          <g>
            {series.map((ser, si) => {
              const color = ser.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length];
              return (
                <g key={`legend-${si}`}>
                  <rect x={padL + si * 100} y={height - 18} width={10} height={10} rx={2} fill={color} fillOpacity={0.5} />
                  <text x={padL + si * 100 + 14} y={height - 12} dominantBaseline="central" className="fill-foreground/50 text-[8px] font-mono">
                    {ser.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </SVGCanvas>
    </div>
  );
}
