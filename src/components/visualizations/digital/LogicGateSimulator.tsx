"use client";

import { useState, useMemo, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

type GateType = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR" | "BUFFER";

interface GateDef {
  id: string;
  type: GateType;
  x: number;
  y: number;
  inputs?: string[];
  label?: string;
}

interface WireDef {
  from: { gate: string; output?: boolean };
  to: { gate: string; input: number };
}

interface LogicGateSimulatorProps {
  readonly gates: GateDef[];
  readonly wires?: WireDef[];
  readonly inputLabels?: string[];
  readonly outputLabel?: string;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly interactive?: boolean;
}

// ── Gate evaluation ─────────────────────────────────────────────────────

function evaluateGate(type: GateType, inputs: boolean[]): boolean {
  switch (type) {
    case "AND": return inputs.every(Boolean);
    case "OR": return inputs.some(Boolean);
    case "NOT": return !inputs[0];
    case "NAND": return !inputs.every(Boolean);
    case "NOR": return !inputs.some(Boolean);
    case "XOR": return inputs.filter(Boolean).length % 2 === 1;
    case "XNOR": return inputs.filter(Boolean).length % 2 === 0;
    case "BUFFER": return inputs[0] ?? false;
    default: return false;
  }
}

// ── Gate shapes ─────────────────────────────────────────────────────────

const GATE_W = 60;
const GATE_H = 40;

function GateShape({ gate, output }: { readonly gate: GateDef; readonly output: boolean }) {
  const { x, y, type } = gate;
  const color = output ? "#10b981" : "#ef4444";

  const bodyClass = "fill-transparent stroke-foreground/60 stroke-[1.5]";

  return (
    <g>
      {/* Gate body */}
      {(type === "AND" || type === "NAND") && (
        <path
          d={`M ${x - GATE_W / 2} ${y - GATE_H / 2} L ${x} ${y - GATE_H / 2} A ${GATE_H / 2} ${GATE_H / 2} 0 0 1 ${x} ${y + GATE_H / 2} L ${x - GATE_W / 2} ${y + GATE_H / 2} Z`}
          className={bodyClass}
        />
      )}
      {(type === "OR" || type === "NOR") && (
        <path
          d={`M ${x - GATE_W / 2} ${y - GATE_H / 2} Q ${x - 10} ${y} ${x - GATE_W / 2} ${y + GATE_H / 2} M ${x - GATE_W / 2} ${y - GATE_H / 2} Q ${x + 10} ${y - GATE_H / 2} ${x + GATE_W / 2} ${y} Q ${x + 10} ${y + GATE_H / 2} ${x - GATE_W / 2} ${y + GATE_H / 2}`}
          className={bodyClass}
        />
      )}
      {(type === "XOR" || type === "XNOR") && (
        <g>
          <path
            d={`M ${x - GATE_W / 2} ${y - GATE_H / 2} Q ${x + 10} ${y - GATE_H / 2} ${x + GATE_W / 2} ${y} Q ${x + 10} ${y + GATE_H / 2} ${x - GATE_W / 2} ${y + GATE_H / 2} Q ${x - 10} ${y} ${x - GATE_W / 2} ${y - GATE_H / 2}`}
            className={bodyClass}
          />
          <path
            d={`M ${x - GATE_W / 2 - 6} ${y - GATE_H / 2} Q ${x - 16} ${y} ${x - GATE_W / 2 - 6} ${y + GATE_H / 2}`}
            className="fill-none stroke-foreground/60 stroke-[1.5]"
          />
        </g>
      )}
      {(type === "NOT" || type === "BUFFER") && (
        <polygon
          points={`${x - GATE_W / 2},${y - GATE_H / 2} ${x + GATE_W / 2 - 6},${y} ${x - GATE_W / 2},${y + GATE_H / 2}`}
          className={bodyClass}
        />
      )}

      {/* Inversion bubble for NOT, NAND, NOR, XNOR */}
      {(type === "NOT" || type === "NAND" || type === "NOR" || type === "XNOR") && (
        <circle
          cx={x + GATE_W / 2 + 4}
          cy={y}
          r={4}
          className="fill-transparent stroke-foreground/60 stroke-[1.5]"
        />
      )}

      {/* Label */}
      <text
        x={x - 4}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground/70 text-[9px] font-mono font-bold"
      >
        {type}
      </text>

      {/* Output indicator */}
      <circle
        cx={x + GATE_W / 2 + (["NOT", "NAND", "NOR", "XNOR"].includes(type) ? 12 : 4)}
        cy={y}
        r={5}
        fill={color}
        opacity={0.7}
      />
    </g>
  );
}

// ── Component ───────────────────────────────────────────────────────────

export default function LogicGateSimulator({
  gates,
  wires = [],
  inputLabels = ["A", "B"],
  outputLabel = "Y",
  width = 600,
  height = 300,
  title,
  interactive = true,
}: LogicGateSimulatorProps) {
  const [inputStates, setInputStates] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const label of inputLabels) {
      init[label] = false;
    }
    return init;
  });

  const toggleInput = useCallback(
    (label: string) => {
      if (!interactive) return;
      setInputStates((prev) => ({ ...prev, [label]: !prev[label] }));
    },
    [interactive],
  );

  // Evaluate all gates
  const gateOutputs = useMemo(() => {
    const outputs: Record<string, boolean> = {};

    // Simple topological evaluation (assumes gates are in order)
    for (const gate of gates) {
      const inputs: boolean[] = [];
      if (gate.inputs) {
        for (const inp of gate.inputs) {
          if (inp in inputStates) {
            inputs.push(inputStates[inp]);
          } else if (inp in outputs) {
            inputs.push(outputs[inp]);
          } else {
            inputs.push(false);
          }
        }
      }
      outputs[gate.id] = evaluateGate(gate.type, inputs);
    }

    return outputs;
  }, [gates, inputStates]);

  const finalOutput = gates.length > 0 ? gateOutputs[gates.at(-1)!.id] ?? false : false;

  return (
    <div className="flex flex-col gap-3">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}

      <SVGCanvas width={width} height={height} padding={20}>
        {/* Gates */}
        {gates.map((gate) => (
          <GateShape key={gate.id} gate={gate} output={gateOutputs[gate.id] ?? false} />
        ))}

        {/* Wire connections */}
        {wires.map((wire, i) => {
          const fromGate = gates.find((g) => g.id === wire.from.gate);
          const toGate = gates.find((g) => g.id === wire.to.gate);
          if (!fromGate || !toGate) return null;
          const hasInversion = ["NOT", "NAND", "NOR", "XNOR"].includes(fromGate.type);
          const x1 = fromGate.x + GATE_W / 2 + (hasInversion ? 16 : 8);
          const y1 = fromGate.y;
          const x2 = toGate.x - GATE_W / 2;
          const inputOffset = wire.to.input === 0 ? -10 : 10;
          const y2 = toGate.y + inputOffset;

          return (
            <path
              key={`wire-${i}`}
              d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
              className={cn(
                "fill-none stroke-[1.5]",
                gateOutputs[fromGate.id] ? "stroke-emerald-400" : "stroke-foreground/30",
              )}
            />
          );
        })}
      </SVGCanvas>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        {inputLabels.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => toggleInput(label)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-mono font-medium transition-colors",
              inputStates[label]
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/20",
            )}
          >
            {label} = {inputStates[label] ? "1" : "0"}
          </button>
        ))}
        <span className="text-sm font-mono text-muted-foreground">→</span>
        <span
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-mono font-medium",
            finalOutput
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/20",
          )}
        >
          {outputLabel} = {finalOutput ? "1" : "0"}
        </span>
      </div>
    </div>
  );
}
