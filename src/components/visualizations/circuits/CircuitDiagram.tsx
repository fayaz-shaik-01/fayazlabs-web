"use client";

import { useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

type ComponentType =
  | "resistor"
  | "capacitor"
  | "inductor"
  | "voltage-source"
  | "current-source"
  | "ground"
  | "node"
  | "diode"
  | "opamp"
  | "switch";

interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label?: string;
  value?: string;
  rotation?: number;
  highlight?: boolean;
}

interface WireDef {
  points: Array<{ x: number; y: number }>;
  label?: string;
  highlight?: boolean;
}

interface CircuitDiagramProps {
  readonly components: CircuitComponent[];
  readonly wires: WireDef[];
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showValues?: boolean;
  readonly annotations?: Array<{
    x: number;
    y: number;
    text: string;
    color?: string;
  }>;
}

// ── Component symbols ───────────────────────────────────────────────────

function Resistor({ c, showValues }: { readonly c: CircuitComponent; readonly showValues: boolean }) {
  const hl = c.highlight ? "stroke-primary stroke-[2]" : "stroke-foreground/70 stroke-[1.5]";
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      {/* Zigzag */}
      <polyline
        points="-30,0 -20,0 -16,-8 -8,8 0,-8 8,8 16,-8 20,0 30,0"
        className={cn("fill-none", hl)}
      />
      {showValues && c.label && (
        <text x={0} y={-14} textAnchor="middle" className="fill-foreground/70 text-[10px] font-mono">
          {c.label}
        </text>
      )}
      {showValues && c.value && (
        <text x={0} y={20} textAnchor="middle" className="fill-muted-foreground text-[9px] font-mono">
          {c.value}
        </text>
      )}
    </g>
  );
}

function Capacitor({ c, showValues }: { readonly c: CircuitComponent; readonly showValues: boolean }) {
  const hl = c.highlight ? "stroke-primary stroke-[2]" : "stroke-foreground/70 stroke-[1.5]";
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      <line x1={-30} y1={0} x2={-4} y2={0} className={cn("fill-none", hl)} />
      <line x1={-4} y1={-12} x2={-4} y2={12} className={cn("fill-none", hl)} />
      <line x1={4} y1={-12} x2={4} y2={12} className={cn("fill-none", hl)} />
      <line x1={4} y1={0} x2={30} y2={0} className={cn("fill-none", hl)} />
      {showValues && c.label && (
        <text x={0} y={-18} textAnchor="middle" className="fill-foreground/70 text-[10px] font-mono">
          {c.label}
        </text>
      )}
      {showValues && c.value && (
        <text x={0} y={24} textAnchor="middle" className="fill-muted-foreground text-[9px] font-mono">
          {c.value}
        </text>
      )}
    </g>
  );
}

function Inductor({ c, showValues }: { readonly c: CircuitComponent; readonly showValues: boolean }) {
  const hl = c.highlight ? "stroke-primary stroke-[2]" : "stroke-foreground/70 stroke-[1.5]";
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      <line x1={-30} y1={0} x2={-20} y2={0} className={cn("fill-none", hl)} />
      {/* Humps */}
      <path
        d="M -20,0 C -20,-12 -10,-12 -10,0 C -10,-12 0,-12 0,0 C 0,-12 10,-12 10,0 C 10,-12 20,-12 20,0"
        className={cn("fill-none", hl)}
      />
      <line x1={20} y1={0} x2={30} y2={0} className={cn("fill-none", hl)} />
      {showValues && c.label && (
        <text x={0} y={-14} textAnchor="middle" className="fill-foreground/70 text-[10px] font-mono">
          {c.label}
        </text>
      )}
      {showValues && c.value && (
        <text x={0} y={20} textAnchor="middle" className="fill-muted-foreground text-[9px] font-mono">
          {c.value}
        </text>
      )}
    </g>
  );
}

function VoltageSource({ c, showValues }: { readonly c: CircuitComponent; readonly showValues: boolean }) {
  const hl = c.highlight ? "stroke-primary stroke-[2]" : "stroke-foreground/70 stroke-[1.5]";
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      <line x1={-30} y1={0} x2={-14} y2={0} className={cn("fill-none", hl)} />
      <circle cx={0} cy={0} r={14} className={cn("fill-none", hl)} />
      {/* + and - */}
      <text x={-5} y={3} textAnchor="middle" className="fill-foreground/60 text-[10px]">+</text>
      <text x={5} y={3} textAnchor="middle" className="fill-foreground/60 text-[10px]">−</text>
      <line x1={14} y1={0} x2={30} y2={0} className={cn("fill-none", hl)} />
      {showValues && c.label && (
        <text x={0} y={-20} textAnchor="middle" className="fill-foreground/70 text-[10px] font-mono">
          {c.label}
        </text>
      )}
      {showValues && c.value && (
        <text x={0} y={28} textAnchor="middle" className="fill-muted-foreground text-[9px] font-mono">
          {c.value}
        </text>
      )}
    </g>
  );
}

function CurrentSource({ c, showValues }: { readonly c: CircuitComponent; readonly showValues: boolean }) {
  const hl = c.highlight ? "stroke-primary stroke-[2]" : "stroke-foreground/70 stroke-[1.5]";
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      <line x1={-30} y1={0} x2={-14} y2={0} className={cn("fill-none", hl)} />
      <circle cx={0} cy={0} r={14} className={cn("fill-none", hl)} />
      {/* Arrow inside */}
      <line x1={-6} y1={0} x2={6} y2={0} className={cn("fill-none", hl)} />
      <polygon points="6,0 2,-3 2,3" className="fill-foreground/60" />
      <line x1={14} y1={0} x2={30} y2={0} className={cn("fill-none", hl)} />
      {showValues && c.label && (
        <text x={0} y={-20} textAnchor="middle" className="fill-foreground/70 text-[10px] font-mono">
          {c.label}
        </text>
      )}
    </g>
  );
}

function Ground({ c }: { readonly c: CircuitComponent }) {
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      <line x1={0} y1={-10} x2={0} y2={0} className="stroke-foreground/70 stroke-[1.5] fill-none" />
      <line x1={-12} y1={0} x2={12} y2={0} className="stroke-foreground/70 stroke-[1.5] fill-none" />
      <line x1={-8} y1={4} x2={8} y2={4} className="stroke-foreground/70 stroke-[1.5] fill-none" />
      <line x1={-4} y1={8} x2={4} y2={8} className="stroke-foreground/70 stroke-[1.5] fill-none" />
    </g>
  );
}

function CircuitNode({ c }: { readonly c: CircuitComponent }) {
  return (
    <g>
      <circle
        cx={c.x}
        cy={c.y}
        r={3}
        className={cn("fill-foreground/70", c.highlight && "fill-primary")}
      />
      {c.label && (
        <text x={c.x} y={c.y - 10} textAnchor="middle" className="fill-foreground/60 text-[9px] font-mono">
          {c.label}
        </text>
      )}
    </g>
  );
}

function Diode({ c, showValues }: { readonly c: CircuitComponent; readonly showValues: boolean }) {
  const hl = c.highlight ? "stroke-primary stroke-[2]" : "stroke-foreground/70 stroke-[1.5]";
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      <line x1={-30} y1={0} x2={-8} y2={0} className={cn("fill-none", hl)} />
      <polygon points="-8,-10 -8,10 8,0" className={cn("fill-none", hl)} />
      <line x1={8} y1={-10} x2={8} y2={10} className={cn("fill-none", hl)} />
      <line x1={8} y1={0} x2={30} y2={0} className={cn("fill-none", hl)} />
      {showValues && c.label && (
        <text x={0} y={-16} textAnchor="middle" className="fill-foreground/70 text-[10px] font-mono">
          {c.label}
        </text>
      )}
    </g>
  );
}

function OpAmp({ c, showValues }: { readonly c: CircuitComponent; readonly showValues: boolean }) {
  const hl = c.highlight ? "stroke-primary stroke-[2]" : "stroke-foreground/70 stroke-[1.5]";
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      <polygon points="-25,-25 -25,25 25,0" className={cn("fill-none", hl)} />
      {/* + and - inputs */}
      <text x={-20} y={-10} className="fill-foreground/50 text-[10px]">−</text>
      <text x={-20} y={14} className="fill-foreground/50 text-[10px]">+</text>
      {/* Input/output leads */}
      <line x1={-40} y1={-15} x2={-25} y2={-15} className={cn("fill-none", hl)} />
      <line x1={-40} y1={15} x2={-25} y2={15} className={cn("fill-none", hl)} />
      <line x1={25} y1={0} x2={40} y2={0} className={cn("fill-none", hl)} />
      {showValues && c.label && (
        <text x={0} y={-30} textAnchor="middle" className="fill-foreground/70 text-[10px] font-mono">
          {c.label}
        </text>
      )}
    </g>
  );
}

function SwitchSymbol({ c, showValues }: { readonly c: CircuitComponent; readonly showValues: boolean }) {
  const hl = c.highlight ? "stroke-primary stroke-[2]" : "stroke-foreground/70 stroke-[1.5]";
  return (
    <g transform={`translate(${c.x},${c.y}) rotate(${c.rotation ?? 0})`}>
      <line x1={-30} y1={0} x2={-8} y2={0} className={cn("fill-none", hl)} />
      <circle cx={-8} cy={0} r={3} className={cn("fill-none", hl)} />
      <line x1={-5} y1={0} x2={12} y2={-10} className={cn("fill-none", hl)} />
      <circle cx={15} cy={0} r={3} className={cn("fill-none", hl)} />
      <line x1={18} y1={0} x2={30} y2={0} className={cn("fill-none", hl)} />
      {showValues && c.label && (
        <text x={0} y={-16} textAnchor="middle" className="fill-foreground/70 text-[10px] font-mono">
          {c.label}
        </text>
      )}
    </g>
  );
}

// ── Component dispatcher ────────────────────────────────────────────────

function CircuitComponentRenderer({
  component,
  showValues,
}: {
  readonly component: CircuitComponent;
  readonly showValues: boolean;
}) {
  switch (component.type) {
    case "resistor": return <Resistor c={component} showValues={showValues} />;
    case "capacitor": return <Capacitor c={component} showValues={showValues} />;
    case "inductor": return <Inductor c={component} showValues={showValues} />;
    case "voltage-source": return <VoltageSource c={component} showValues={showValues} />;
    case "current-source": return <CurrentSource c={component} showValues={showValues} />;
    case "ground": return <Ground c={component} />;
    case "node": return <CircuitNode c={component} />;
    case "diode": return <Diode c={component} showValues={showValues} />;
    case "opamp": return <OpAmp c={component} showValues={showValues} />;
    case "switch": return <SwitchSymbol c={component} showValues={showValues} />;
    default: return null;
  }
}

// ── Wire renderer ───────────────────────────────────────────────────────

function Wire({ wire }: { readonly wire: WireDef }) {
  if (wire.points.length < 2) return null;
  const d = wire.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <g>
      <path
        d={d}
        className={cn(
          "fill-none stroke-[1.5]",
          wire.highlight ? "stroke-primary" : "stroke-foreground/50",
        )}
      />
      {wire.label && wire.points.length >= 2 && (
        <text
          x={(wire.points[0].x + wire.points[1].x) / 2}
          y={(wire.points[0].y + wire.points[1].y) / 2 - 8}
          textAnchor="middle"
          className="fill-foreground/50 text-[9px] font-mono"
        >
          {wire.label}
        </text>
      )}
    </g>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function CircuitDiagram({
  components: initialComponents,
  wires,
  width = 600,
  height = 350,
  title,
  showValues = true,
  annotations,
}: CircuitDiagramProps) {
  const [components, setComponents] = useState(initialComponents);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleValueChange = useCallback((id: string, newValue: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: newValue } : c)),
    );
  }, []);

  const selectedComp = components.find((c) => c.id === selectedId);

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}
      <SVGCanvas width={width} height={height} padding={30}>
        {/* Wires first (behind components) */}
        {wires.map((wire, i) => (
          <Wire key={`wire-${i}`} wire={wire} />
        ))}

        {/* Components */}
        {components.map((comp) => (
          <g
            key={comp.id}
            onClick={() => handleSelect(comp.id)}
            className="cursor-pointer"
          >
            <CircuitComponentRenderer
              component={{ ...comp, highlight: comp.id === selectedId || comp.highlight }}
              showValues={showValues}
            />
          </g>
        ))}

        {/* Annotations */}
        {annotations?.map((ann, i) => (
          <text
            key={`ann-${i}`}
            x={ann.x}
            y={ann.y}
            textAnchor="middle"
            className="text-[10px] font-mono"
            fill={ann.color ?? "currentColor"}
            opacity={0.7}
          >
            {ann.text}
          </text>
        ))}
      </SVGCanvas>

      {/* Edit panel */}
      {selectedComp?.value !== undefined && (
        <div className="flex items-center justify-center gap-3 text-xs border-t border-white/[0.06] pt-3">
          <span className="font-mono text-muted-foreground">
            {selectedComp.label ?? selectedComp.id}:
          </span>
          <input
            type="text"
            value={selectedComp.value}
            onChange={(e) => handleValueChange(selectedComp.id, e.target.value)}
            className="w-24 px-2 py-1 text-xs font-mono rounded bg-white/[0.06] border border-white/[0.08] text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  );
}
