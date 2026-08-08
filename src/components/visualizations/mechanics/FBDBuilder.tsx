"use client";

import { useMemo, useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { ParameterSlider } from "../common/ParameterSlider";

// ── Types ───────────────────────────────────────────────────────────────

interface Force {
  label: string;
  magnitude?: number;
  angle: number; // degrees from +x axis
  x: number;
  y: number;
  color?: string;
  type?: "applied" | "reaction" | "weight" | "friction" | "tension" | "normal";
}

interface FBDBody {
  shape: "rect" | "circle" | "point";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  label?: string;
}

interface Support {
  type: "pin" | "roller" | "fixed";
  x: number;
  y: number;
}

interface FBDBuilderProps {
  readonly body: FBDBody;
  readonly forces: Force[];
  readonly supports?: Support[];
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly arrowScale?: number;
}

// ── Constants ───────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  applied: "#3b82f6",
  reaction: "#10b981",
  weight: "#ef4444",
  friction: "#f59e0b",
  tension: "#8b5cf6",
  normal: "#06b6d4",
};

// ── Arrow renderer ──────────────────────────────────────────────────────

function ForceArrow({
  force,
  scale,
}: {
  readonly force: Force;
  readonly scale: number;
}) {
  const rad = (force.angle * Math.PI) / 180;
  const len = (force.magnitude ?? 50) * scale;
  const dx = Math.cos(rad) * len;
  const dy = -Math.sin(rad) * len; // SVG y is inverted
  const tipX = force.x + dx;
  const tipY = force.y + dy;
  const color = force.color ?? TYPE_COLORS[force.type ?? "applied"] ?? "#3b82f6";

  // Arrowhead
  const headLen = 10;
  const headAngle = 25 * (Math.PI / 180);
  const ax1 = tipX - headLen * Math.cos(rad - headAngle);
  const ay1 = tipY + headLen * Math.sin(rad - headAngle);
  const ax2 = tipX - headLen * Math.cos(rad + headAngle);
  const ay2 = tipY + headLen * Math.sin(rad + headAngle);

  return (
    <g>
      <line
        x1={force.x}
        y1={force.y}
        x2={tipX}
        y2={tipY}
        stroke={color}
        strokeWidth={2}
      />
      <polygon
        points={`${tipX},${tipY} ${ax1},${ay1} ${ax2},${ay2}`}
        fill={color}
      />
      <text
        x={tipX + 8 * Math.cos(rad)}
        y={tipY - 8 * Math.sin(rad)}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-mono"
        fill={color}
      >
        {force.label}
        {force.magnitude != null && ` (${force.magnitude})`}
      </text>
    </g>
  );
}

// ── Support symbols ─────────────────────────────────────────────────────

function SupportSymbol({ support }: { readonly support: Support }) {
  const { type, x, y } = support;

  if (type === "pin") {
    return (
      <g>
        <polygon
          points={`${x},${y} ${x - 10},${y + 16} ${x + 10},${y + 16}`}
          className="fill-transparent stroke-foreground/50 stroke-[1.5]"
        />
        <line x1={x - 14} y1={y + 18} x2={x + 14} y2={y + 18} className="stroke-foreground/40 stroke-[1.5]" />
        {[-10, -4, 2, 8].map((offset) => (
          <line
            key={offset}
            x1={x + offset}
            y1={y + 18}
            x2={x + offset - 4}
            y2={y + 24}
            className="stroke-foreground/30 stroke-[1]"
          />
        ))}
      </g>
    );
  }

  if (type === "roller") {
    return (
      <g>
        <polygon
          points={`${x},${y} ${x - 10},${y + 14} ${x + 10},${y + 14}`}
          className="fill-transparent stroke-foreground/50 stroke-[1.5]"
        />
        <circle cx={x - 6} cy={y + 18} r={3} className="fill-transparent stroke-foreground/40 stroke-[1]" />
        <circle cx={x + 6} cy={y + 18} r={3} className="fill-transparent stroke-foreground/40 stroke-[1]" />
        <line x1={x - 14} y1={y + 22} x2={x + 14} y2={y + 22} className="stroke-foreground/40 stroke-[1.5]" />
      </g>
    );
  }

  // Fixed
  return (
    <g>
      <line x1={x} y1={y - 16} x2={x} y2={y + 16} className="stroke-foreground/50 stroke-[2]" />
      {[-12, -6, 0, 6, 12].map((offset) => (
        <line
          key={offset}
          x1={x}
          y1={y + offset}
          x2={x - 8}
          y2={y + offset + 6}
          className="stroke-foreground/30 stroke-[1]"
        />
      ))}
    </g>
  );
}

// ── Component ───────────────────────────────────────────────────────────

export default function FBDBuilder({
  body,
  forces: initialForces,
  supports = [],
  width = 500,
  height = 400,
  title,
  arrowScale = 1,
}: FBDBuilderProps) {
  const [forces, setForces] = useState(initialForces);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleSelect = useCallback((idx: number) => {
    setSelectedIdx((prev) => (prev === idx ? null : idx));
  }, []);

  const handleMagChange = useCallback(
    (v: number) => {
      if (selectedIdx === null) return;
      setForces((prev) =>
        prev.map((f, i) => (i === selectedIdx ? { ...f, magnitude: v } : f)),
      );
    },
    [selectedIdx],
  );

  const handleAngleChange = useCallback(
    (v: number) => {
      if (selectedIdx === null) return;
      setForces((prev) =>
        prev.map((f, i) => (i === selectedIdx ? { ...f, angle: v } : f)),
      );
    },
    [selectedIdx],
  );

  const handleRemove = useCallback(() => {
    if (selectedIdx === null) return;
    setForces((prev) => prev.filter((_, i) => i !== selectedIdx));
    setSelectedIdx(null);
  }, [selectedIdx]);

  const handleAddForce = useCallback(() => {
    setForces((prev) => [
      ...prev,
      { label: `F${prev.length + 1}`, magnitude: 50, angle: 90, x: body.x, y: body.y, type: "applied" as const },
    ]);
  }, [body.x, body.y]);

  // Sum of forces
  const { sumFx, sumFy } = useMemo(() => {
    let fx = 0;
    let fy = 0;
    for (const f of forces) {
      const mag = f.magnitude ?? 0;
      const rad = (f.angle * Math.PI) / 180;
      fx += mag * Math.cos(rad);
      fy += mag * Math.sin(rad);
    }
    return { sumFx: fx, sumFy: fy };
  }, [forces]);

  const selectedForce = selectedIdx !== null ? forces[selectedIdx] : null;

  return (
    <div className="flex flex-col gap-3">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}

      <SVGCanvas width={width} height={height} padding={20}>
        {/* Supports */}
        {supports.map((s, i) => (
          <SupportSymbol key={`support-${s.type}-${i}`} support={s} />
        ))}

        {/* Body */}
        {body.shape === "rect" && (
          <rect
            x={body.x - (body.width ?? 80) / 2}
            y={body.y - (body.height ?? 50) / 2}
            width={body.width ?? 80}
            height={body.height ?? 50}
            rx={3}
            className="fill-primary/5 stroke-foreground/50 stroke-[1.5]"
          />
        )}
        {body.shape === "circle" && (
          <circle
            cx={body.x}
            cy={body.y}
            r={body.radius ?? 30}
            className="fill-primary/5 stroke-foreground/50 stroke-[1.5]"
          />
        )}
        {body.shape === "point" && (
          <circle cx={body.x} cy={body.y} r={4} className="fill-foreground/60" />
        )}
        {body.label && (
          <text
            x={body.x}
            y={body.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground/70 text-[11px] font-mono"
          >
            {body.label}
          </text>
        )}

        {/* Forces */}
        {forces.map((f, i) => (
          <g key={`force-${f.label}-${i}`} onClick={() => handleSelect(i)} className="cursor-pointer">
            <ForceArrow force={f} scale={arrowScale} />
          </g>
        ))}
      </SVGCanvas>

      {/* Edit panel */}
      {selectedForce && (
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground font-medium">{selectedForce.label}</span>
            <button
              type="button"
              onClick={handleRemove}
              className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <ParameterSlider label="Magnitude" min={0} max={200} step={1} value={selectedForce.magnitude ?? 50} onChange={handleMagChange} />
            <ParameterSlider label="Angle" min={0} max={360} step={1} value={selectedForce.angle} onChange={handleAngleChange} unit="°" />
          </div>
        </div>
      )}

      {/* Summary + Add */}
      <div className="flex items-center justify-center gap-6 text-xs font-mono text-muted-foreground">
        <span>ΣFx = {sumFx.toFixed(2)}</span>
        <span>ΣFy = {sumFy.toFixed(2)}</span>
        <span
          className={
            Math.abs(sumFx) < 0.01 && Math.abs(sumFy) < 0.01
              ? "text-emerald-400"
              : "text-amber-400"
          }
        >
          {Math.abs(sumFx) < 0.01 && Math.abs(sumFy) < 0.01 ? "Equilibrium" : "Not in equilibrium"}
        </span>
        <button
          type="button"
          onClick={handleAddForce}
          className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          + Force
        </button>
      </div>
    </div>
  );
}
