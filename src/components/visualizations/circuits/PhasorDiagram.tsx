"use client";

import { useMemo, useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { ParameterSlider } from "../common/ParameterSlider";

// ── Types ───────────────────────────────────────────────────────────────

interface PhasorDef {
  magnitude: number;
  angleDeg: number;
  label: string;
  color?: string;
  dash?: boolean;
}

interface PhasorDiagramProps {
  readonly phasors: PhasorDef[];
  readonly title?: string;
  readonly showGrid?: boolean;
  readonly showAngles?: boolean;
  readonly showMagnitudes?: boolean;
  readonly size?: number;
  readonly scale?: number;
}

// ── Constants ───────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

// ── Component ───────────────────────────────────────────────────────────

export default function PhasorDiagram({
  phasors: initialPhasors,
  title,
  showGrid = true,
  showAngles = true,
  showMagnitudes = true,
  size = 400,
  scale: scaleProp,
}: PhasorDiagramProps) {
  const [overrides, setOverrides] = useState<Record<number, { magnitude?: number; angleDeg?: number }>>({});

  const handleChange = useCallback((index: number, key: "magnitude" | "angleDeg", value: number) => {
    setOverrides((prev) => ({
      ...prev,
      [index]: { ...prev[index], [key]: value },
    }));
  }, []);

  const phasors = useMemo(
    () =>
      initialPhasors.map((p, i) => ({
        ...p,
        magnitude: overrides[i]?.magnitude ?? p.magnitude,
        angleDeg: overrides[i]?.angleDeg ?? p.angleDeg,
      })),
    [initialPhasors, overrides],
  );

  const autoScale = useMemo(() => {
    if (scaleProp) return scaleProp;
    const maxMag = Math.max(...phasors.map((p) => p.magnitude), 1);
    return (size * 0.35) / maxMag;
  }, [phasors, size, scaleProp]);

  const cx = size / 2;
  const cy = size / 2;
  const gridRadius = size * 0.4;

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}
      <SVGCanvas width={size} height={size} padding={20}>
        {/* Grid circles */}
        {showGrid && (
          <g>
            {[0.25, 0.5, 0.75, 1].map((frac) => (
              <circle
                key={frac}
                cx={cx}
                cy={cy}
                r={gridRadius * frac}
                className="fill-none stroke-foreground/[0.06] stroke-[0.5]"
              />
            ))}
            {/* Axes */}
            <line
              x1={cx - gridRadius}
              y1={cy}
              x2={cx + gridRadius}
              y2={cy}
              className="stroke-foreground/[0.12] stroke-[0.8]"
            />
            <line
              x1={cx}
              y1={cy - gridRadius}
              x2={cx}
              y2={cy + gridRadius}
              className="stroke-foreground/[0.12] stroke-[0.8]"
            />
            {/* Axis labels */}
            <text x={cx + gridRadius + 8} y={cy + 4} className="fill-foreground/40 text-[10px]">
              Re
            </text>
            <text x={cx + 4} y={cy - gridRadius - 4} className="fill-foreground/40 text-[10px]">
              Im
            </text>
          </g>
        )}

        {/* Phasors */}
        {phasors.map((p, i) => {
          const color = p.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          const angleRad = (p.angleDeg * Math.PI) / 180;
          const tipX = cx + p.magnitude * autoScale * Math.cos(angleRad);
          const tipY = cy - p.magnitude * autoScale * Math.sin(angleRad); // SVG y-axis inverted

          return (
            <g key={p.label}>
              {/* Angle arc */}
              {showAngles && p.angleDeg !== 0 && (
                <path
                  d={describeArc(cx, cy, 25, 0, -p.angleDeg)}
                  className="fill-none stroke-[0.8]"
                  stroke={color}
                  opacity={0.4}
                />
              )}

              {/* Phasor line */}
              <line
                x1={cx}
                y1={cy}
                x2={tipX}
                y2={tipY}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={p.dash ? "6 3" : undefined}
              />

              {/* Arrowhead */}
              <circle cx={tipX} cy={tipY} r={3} fill={color} />

              {/* Label */}
              <text
                x={tipX + 8 * Math.cos(angleRad)}
                y={tipY - 8 * Math.sin(angleRad)}
                textAnchor="start"
                dominantBaseline="central"
                className="text-[11px] font-mono"
                fill={color}
              >
                {p.label}
                {showMagnitudes && ` (${p.magnitude.toFixed(1)}∠${p.angleDeg.toFixed(0)}°)`}
              </text>
            </g>
          );
        })}
      </SVGCanvas>

      {/* Interactive controls */}
      <div className="grid gap-3">
        {phasors.map((p, i) => {
          const color = p.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          return (
            <div key={p.label} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground font-mono">
                  {p.label}: {p.magnitude.toFixed(1)}∠{p.angleDeg.toFixed(0)}°
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ParameterSlider
                  label={`|${p.label}|`}
                  min={0}
                  max={Math.max(p.magnitude * 3, 10)}
                  step={0.1}
                  value={p.magnitude}
                  onChange={(v) => handleChange(i, "magnitude", v)}
                />
                <ParameterSlider
                  label={`∠${p.label}`}
                  min={-180}
                  max={180}
                  step={1}
                  value={p.angleDeg}
                  onChange={(v) => handleChange(i, "angleDeg", v)}
                  unit="°"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SVG arc helper ──────────────────────────────────────────────────────

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy - radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy - radius * Math.sin(endRad);
  const largeArc = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
  const sweep = endAngleDeg > startAngleDeg ? 0 : 1;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}
