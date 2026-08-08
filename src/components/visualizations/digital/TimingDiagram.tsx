"use client";

import { useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";

// ── Types ───────────────────────────────────────────────────────────────

interface Signal {
  name: string;
  waveform: Array<0 | 1 | "x" | "z">;
  color?: string;
}

interface TimingDiagramProps {
  readonly signals: Signal[];
  readonly clockPeriod?: number;
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
  readonly showGrid?: boolean;
  readonly timeLabels?: string[];
}

// ── Constants ───────────────────────────────────────────────────────────

const SIGNAL_HEIGHT = 30;
const SIGNAL_GAP = 16;
const STEP_WIDTH = 50;
const LABEL_WIDTH = 60;
const TRANSITION_WIDTH = 4;

const DEFAULT_COLORS = [
  "#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16",
];

// ── Component ───────────────────────────────────────────────────────────

export default function TimingDiagram({
  signals: initialSignals,
  clockPeriod = 1,
  title,
  width: widthProp,
  height: heightProp,
  showGrid = true,
  timeLabels,
}: TimingDiagramProps) {
  const [waveforms, setWaveforms] = useState(() =>
    initialSignals.map((s) => [...s.waveform]),
  );

  const handleToggle = useCallback((signalIdx: number, bitIdx: number) => {
    setWaveforms((prev) => {
      const next = prev.map((w) => [...w]);
      const cur = next[signalIdx][bitIdx];
      if (cur === 0) next[signalIdx][bitIdx] = 1;
      else if (cur === 1) next[signalIdx][bitIdx] = 0;
      return next;
    });
  }, []);

  const signals = initialSignals.map((s, i) => ({ ...s, waveform: waveforms[i] }));

  const maxSteps = Math.max(...signals.map((s) => s.waveform.length), 1);
  const calculatedWidth = LABEL_WIDTH + maxSteps * STEP_WIDTH + 20;
  const calculatedHeight = signals.length * (SIGNAL_HEIGHT + SIGNAL_GAP) + 40;
  const width = widthProp ?? calculatedWidth;
  const height = heightProp ?? calculatedHeight;

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}
      <SVGCanvas width={width} height={height} padding={10}>
        {/* Grid lines */}
        {showGrid &&
          Array.from({ length: maxSteps + 1 }, (_, i) => {
            const x = LABEL_WIDTH + i * STEP_WIDTH;
            return (
              <line
                key={`grid-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height - 30}
                className="stroke-foreground/[0.06] stroke-[0.5]"
                strokeDasharray="3 3"
              />
            );
          })}

        {/* Time labels */}
        {Array.from({ length: maxSteps }, (_, i) => {
          const x = LABEL_WIDTH + i * STEP_WIDTH + STEP_WIDTH / 2;
          const label = timeLabels?.[i] ?? `${(i * clockPeriod).toFixed(0)}`;
          return (
            <text
              key={`time-${i}`}
              x={x}
              y={height - 12}
              textAnchor="middle"
              className="fill-foreground/30 text-[9px] font-mono"
            >
              {label}
            </text>
          );
        })}

        {/* Signals */}
        {signals.map((signal, si) => {
          const color = signal.color ?? DEFAULT_COLORS[si % DEFAULT_COLORS.length];
          const baseY = si * (SIGNAL_HEIGHT + SIGNAL_GAP) + 20;
          const highY = baseY;
          const lowY = baseY + SIGNAL_HEIGHT;

          // Build path
          let d = "";
          for (let i = 0; i < signal.waveform.length; i++) {
            const x = LABEL_WIDTH + i * STEP_WIDTH;
            const val = signal.waveform[i];
            const y = val === 1 ? highY : lowY;

            if (i === 0) {
              d += `M ${x} ${y}`;
            } else {
              const prevVal = signal.waveform[i - 1];
              if (val !== prevVal) {
                // Transition
                const prevY = prevVal === 1 ? highY : lowY;
                d += ` L ${x - TRANSITION_WIDTH} ${prevY} L ${x + TRANSITION_WIDTH} ${y}`;
              }
            }
            d += ` L ${x + STEP_WIDTH} ${y}`;
          }

          return (
            <g key={signal.name}>
              {/* Signal name */}
              <text
                x={LABEL_WIDTH - 8}
                y={baseY + SIGNAL_HEIGHT / 2}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-foreground/70 text-[11px] font-mono"
              >
                {signal.name}
              </text>

              {/* Clickable cells for toggling */}
              {signal.waveform.map((val, i) => {
                if (val === "x" || val === "z") return null;
                const cellX = LABEL_WIDTH + i * STEP_WIDTH;
                return (
                  <rect
                    key={`click-${i}`}
                    x={cellX}
                    y={highY}
                    width={STEP_WIDTH}
                    height={SIGNAL_HEIGHT}
                    fill="transparent"
                    className="cursor-pointer hover:fill-foreground/[0.04]"
                    onClick={() => handleToggle(si, i)}
                  />
                );
              })}

              {/* Waveform */}
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={2}
              />

              {/* Unknown / Hi-Z shading */}
              {signal.waveform.map((val, i) => {
                if (val !== "x" && val !== "z") return null;
                const x = LABEL_WIDTH + i * STEP_WIDTH;
                return (
                  <rect
                    key={`shade-${i}`}
                    x={x}
                    y={highY}
                    width={STEP_WIDTH}
                    height={SIGNAL_HEIGHT}
                    fill={val === "x" ? "rgba(239,68,68,0.08)" : "rgba(150,150,150,0.06)"}
                  />
                );
              })}
            </g>
          );
        })}
      </SVGCanvas>
    </div>
  );
}
