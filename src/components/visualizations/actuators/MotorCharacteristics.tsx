"use client";

import { useMemo, useState } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface MotorCharacteristicsProps {
  readonly motorType?: "shunt" | "series" | "compound" | "stepper" | "servo";
  readonly ratedSpeed?: number;
  readonly ratedTorque?: number;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showGrid?: boolean;
}

// ── Motor curve generators ──────────────────────────────────────────────

function generateCurve(
  type: string,
  nPoints: number,
  ratedSpeed: number,
  ratedTorque: number,
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];

  for (let i = 0; i <= nPoints; i++) {
    const t = (i / nPoints) * ratedTorque * 1.5;
    let n: number;
    switch (type) {
      case "shunt":
        n = ratedSpeed * (1 - 0.08 * (t / ratedTorque));
        break;
      case "series":
        n = t > 0.05 * ratedTorque
          ? ratedSpeed * 1.8 * Math.sqrt(ratedTorque / Math.max(t, 0.1))
          : ratedSpeed * 3;
        break;
      case "compound":
        n = ratedSpeed * (1.1 - 0.25 * (t / ratedTorque));
        break;
      case "stepper":
        n = ratedSpeed * Math.max(0, 1 - (t / ratedTorque) * 0.6);
        break;
      case "servo":
        n = ratedSpeed * Math.max(0, 1 - Math.pow(t / (ratedTorque * 1.2), 2));
        break;
      default:
        n = ratedSpeed * (1 - 0.1 * (t / ratedTorque));
    }
    pts.push([t, Math.max(0, n)]);
  }
  return pts;
}

// ── Component ───────────────────────────────────────────────────────────

export default function MotorCharacteristics({
  motorType = "shunt",
  ratedSpeed = 1500,
  ratedTorque = 10,
  width = 550,
  height = 350,
  title,
  showGrid = true,
}: MotorCharacteristicsProps) {
  const [selectedType, setSelectedType] = useState(motorType);

  const padL = 65;
  const padR = 25;
  const padT = 30;
  const padB = 50;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxT = ratedTorque * 1.5;
  const maxN = ratedSpeed * (selectedType === "series" ? 3.5 : 1.5);

  const scaleX = (torque: number) => padL + (torque / maxT) * plotW;
  const scaleY = (speed: number) => padT + ((maxN - speed) / maxN) * plotH;

  const curve = useMemo(
    () => generateCurve(selectedType, 60, ratedSpeed, ratedTorque),
    [selectedType, ratedSpeed, ratedTorque],
  );

  const pathD = useMemo(() => {
    if (curve.length === 0) return "";
    let d = `M ${scaleX(curve[0][0])} ${scaleY(curve[0][1])}`;
    for (let i = 1; i < curve.length; i++) {
      d += ` L ${scaleX(curve[i][0])} ${scaleY(curve[i][1])}`;
    }
    return d;
  }, [curve, plotW, plotH]);

  const TYPES = ["shunt", "series", "compound", "stepper", "servo"] as const;
  const TYPE_COLORS: Record<string, string> = {
    shunt: "#3b82f6",
    series: "#ef4444",
    compound: "#f59e0b",
    stepper: "#8b5cf6",
    servo: "#22c55e",
  };

  return (
    <div className="flex flex-col gap-3 items-center">
      {title && <div className="text-sm font-medium text-muted-foreground">{title}</div>}

      {/* Motor type selector */}
      <div className="flex items-center gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelectedType(t)}
            className={cn(
              "px-2 py-1 text-xs font-mono rounded transition-colors capitalize",
              selectedType === t
                ? "text-white"
                : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10",
            )}
            style={selectedType === t ? { backgroundColor: TYPE_COLORS[t] } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      <SVGCanvas width={width} height={height} padding={5}>
        {/* Grid */}
        {showGrid && Array.from({ length: 6 }, (_, i) => {
          const torque = (i / 5) * maxT;
          const speed = (i / 5) * maxN;
          return (
            <g key={`grid-${i}`}>
              <line x1={scaleX(torque)} y1={padT} x2={scaleX(torque)} y2={padT + plotH} className="stroke-foreground/5 stroke-[0.5]" />
              <line x1={padL} y1={scaleY(speed)} x2={padL + plotW} y2={scaleY(speed)} className="stroke-foreground/5 stroke-[0.5]" />
            </g>
          );
        })}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} className="stroke-foreground/30 stroke-[1.5]" />
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} className="stroke-foreground/30 stroke-[1.5]" />

        {/* Axis labels */}
        <text x={padL + plotW / 2} y={height - 8} textAnchor="middle" className="fill-foreground/50 text-[10px] font-mono">Torque (N·m)</text>
        <text x={14} y={padT + plotH / 2} textAnchor="middle" dominantBaseline="central"
          transform={`rotate(-90, 14, ${padT + plotH / 2})`}
          className="fill-foreground/50 text-[10px] font-mono"
        >
          Speed (RPM)
        </text>

        {/* Tick labels */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
          const torque = frac * maxT;
          const speed = frac * maxN;
          return (
            <g key={`tick-${frac}`}>
              <text x={scaleX(torque)} y={padT + plotH + 16} textAnchor="middle" className="fill-foreground/35 text-[8px] font-mono">
                {torque.toFixed(0)}
              </text>
              <text x={padL - 8} y={scaleY(speed)} textAnchor="end" dominantBaseline="central" className="fill-foreground/35 text-[8px] font-mono">
                {speed.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Curve */}
        <path d={pathD} fill="none" stroke={TYPE_COLORS[selectedType]} strokeWidth={2.5} />

        {/* Rated point */}
        <circle cx={scaleX(ratedTorque)} cy={scaleY(ratedSpeed)} r={4}
          fill={TYPE_COLORS[selectedType]} fillOpacity={0.3}
          stroke={TYPE_COLORS[selectedType]} strokeWidth={2}
        />
        <text x={scaleX(ratedTorque) + 8} y={scaleY(ratedSpeed) - 8}
          className="text-[8px] font-mono" fill={TYPE_COLORS[selectedType]}
        >
          Rated ({ratedTorque}, {ratedSpeed})
        </text>
      </SVGCanvas>

      <div className="text-xs font-mono text-muted-foreground capitalize">
        {selectedType} DC Motor — Speed vs Torque Characteristic
      </div>
    </div>
  );
}
