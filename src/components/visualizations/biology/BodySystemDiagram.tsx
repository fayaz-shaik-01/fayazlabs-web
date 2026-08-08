"use client";

import { useState } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface BodySystem {
  id: string;
  label: string;
  description: string;
  color: string;
  organs: string[];
}

interface BodySystemDiagramProps {
  readonly systems?: BodySystem[];
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly highlightSystem?: string;
  readonly interactive?: boolean;
}

const DEFAULT_SYSTEMS: BodySystem[] = [
  {
    id: "nervous",
    label: "Nervous System",
    description: "Brain, spinal cord, nerves — electrical signaling & control",
    color: "#f59e0b",
    organs: ["Brain", "Spinal Cord", "Peripheral Nerves"],
  },
  {
    id: "musculoskeletal",
    label: "Musculoskeletal",
    description: "Bones, muscles, tendons — structure & movement",
    color: "#ef4444",
    organs: ["Bones", "Skeletal Muscle", "Tendons", "Joints"],
  },
  {
    id: "endocrine",
    label: "Endocrine System",
    description: "Hormonal glands — chemical signaling & regulation",
    color: "#8b5cf6",
    organs: ["Hypothalamus", "Pituitary", "Thyroid", "Adrenals"],
  },
  {
    id: "cardiovascular",
    label: "Cardiovascular",
    description: "Heart, blood vessels — transport of O₂, nutrients, hormones",
    color: "#ec4899",
    organs: ["Heart", "Arteries", "Veins", "Capillaries"],
  },
  {
    id: "respiratory",
    label: "Respiratory",
    description: "Lungs, airways — gas exchange (O₂ in, CO₂ out)",
    color: "#06b6d4",
    organs: ["Lungs", "Trachea", "Bronchi", "Diaphragm"],
  },
  {
    id: "digestive",
    label: "Digestive",
    description: "GI tract — nutrient breakdown & absorption",
    color: "#22c55e",
    organs: ["Stomach", "Intestines", "Liver", "Pancreas"],
  },
];

// ── Component ───────────────────────────────────────────────────────────

export default function BodySystemDiagram({
  systems = DEFAULT_SYSTEMS,
  width = 650,
  height = 380,
  title,
  highlightSystem,
  interactive = true,
}: BodySystemDiagramProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? highlightSystem ?? null;
  const activeSystem = systems.find((s) => s.id === active);

  const cols = Math.min(systems.length, 3);
  const rows = Math.ceil(systems.length / cols);
  const cellW = (width - 40) / cols;
  const cellH = (height - 80) / rows;
  const iconR = Math.min(cellW, cellH) * 0.22;

  return (
    <div className="flex flex-col gap-2">
      {title && <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>}

      <SVGCanvas width={width} height={height} padding={10}>
        {systems.map((sys, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cx = 20 + col * cellW + cellW / 2;
          const cy = 20 + row * cellH + cellH / 2;
          const isActive = active === sys.id;

          return (
            <g
              key={sys.id}
              onMouseEnter={() => interactive && setHovered(sys.id)}
              onMouseLeave={() => interactive && setHovered(null)}
              className={interactive ? "cursor-pointer" : undefined}
            >
              {/* Card background */}
              <rect
                x={cx - cellW / 2 + 8}
                y={cy - cellH / 2 + 4}
                width={cellW - 16}
                height={cellH - 8}
                rx={10}
                className={cn(
                  "stroke-[1.5] transition-colors",
                  isActive
                    ? `fill-[${sys.color}]/10`
                    : "fill-foreground/[0.02]",
                )}
                stroke={isActive ? sys.color : "currentColor"}
                strokeOpacity={isActive ? 0.6 : 0.1}
                fill={isActive ? sys.color : "transparent"}
                fillOpacity={isActive ? 0.08 : 0}
              />

              {/* Circle icon */}
              <circle
                cx={cx} cy={cy - 15} r={iconR}
                stroke={sys.color}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeOpacity={isActive ? 0.8 : 0.3}
                fill={sys.color}
                fillOpacity={isActive ? 0.15 : 0.05}
              />

              {/* System initial */}
              <text x={cx} y={cy - 15} textAnchor="middle" dominantBaseline="central"
                fill={sys.color}
                fillOpacity={isActive ? 1 : 0.5}
                className="text-[13px] font-mono font-bold"
              >
                {sys.label.charAt(0)}
              </text>

              {/* Label */}
              <text x={cx} y={cy + iconR + 8} textAnchor="middle"
                fill={isActive ? sys.color : "currentColor"}
                className={cn("text-[10px] font-mono font-medium", !isActive && "text-foreground/50")}
              >
                {sys.label}
              </text>

              {/* Organ list */}
              {isActive && sys.organs.slice(0, 3).map((organ, j) => (
                <text key={`organ-${j}`} x={cx} y={cy + iconR + 22 + j * 12} textAnchor="middle"
                  className="fill-foreground/40 text-[8px] font-mono"
                >
                  {organ}
                </text>
              ))}
            </g>
          );
        })}
      </SVGCanvas>

      {/* Description */}
      {interactive && (
        <div className="h-10 flex items-center justify-center">
          {activeSystem ? (
            <span className="text-xs text-muted-foreground">{activeSystem.description}</span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Hover over a system to see details</span>
          )}
        </div>
      )}
    </div>
  );
}
