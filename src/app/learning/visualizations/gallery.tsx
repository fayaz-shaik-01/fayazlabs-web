"use client";

import { useState, Suspense } from "react";
import { listVisualizations } from "@/components/visualizations/registry";
import {
  VisualizationSkeleton,
} from "@/components/visualizations/common/VisualizationShell";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Sample props for each component so they render something meaningful ──

const sampleProps: Record<string, Record<string, unknown>> = {
  "graph-2d": {
    functions: [
      { expr: "a * sin(x)", label: "a·sin(x)", color: "#3b82f6" },
      { expr: "a * cos(x)", label: "a·cos(x)", color: "#ef4444" },
    ],
    params: [{ name: "a", label: "Amplitude", min: 0.5, max: 3, step: 0.1, default: 1 }],
    xRange: [-6.28, 6.28],
    title: "Trigonometric Functions",
  },
  "graph-3d": {
    expr: "sin(sqrt(x^2 + y^2))",
    xRange: [-5, 5],
    yRange: [-5, 5],
    samples: 30,
    title: "3D Sinc Function",
  },
  "matrix-display": {
    matrix: [[1, 2], [3, 4]],
    label: "A",
    showDeterminant: true,
    showTranspose: true,
    showInverse: true,
    highlightDiagonal: true,
    operations: [
      { label: "R₂ ← R₂ - 3R₁", matrix: [[1, 2], [0, -2]] },
      { label: "R₂ ← R₂ / -2", matrix: [[1, 2], [0, 1]] },
      { label: "R₁ ← R₁ - 2R₂", matrix: [[1, 0], [0, 1]] },
    ],
  },
  "transform-2d": {
    matrixExpr: "[[a, b], [c, d]]",
    params: [
      { name: "a", label: "a₁₁", min: -3, max: 3, step: 0.1, default: 2 },
      { name: "b", label: "a₁₂", min: -3, max: 3, step: 0.1, default: 1 },
      { name: "c", label: "a₂₁", min: -3, max: 3, step: 0.1, default: 0 },
      { name: "d", label: "a₂₂", min: -3, max: 3, step: 0.1, default: 1 },
    ],
    showGrid: true,
    showDeterminant: true,
  },
  "signal-plot": {
    signals: [
      { type: "continuous", expr: "A * sin(2 * pi * f * t)", label: "x(t) = A·sin(2πft)" },
    ],
    params: [
      { name: "A", label: "Amplitude", min: 0.5, max: 3, step: 0.1, default: 1 },
      { name: "f", label: "Frequency (Hz)", min: 0.5, max: 5, step: 0.5, default: 1, unit: "Hz" },
    ],
    tRange: [-2, 2],
    title: "Continuous-Time Signal",
  },
  "pole-zero": {
    poles: [{ re: -1, im: 2 }, { re: -1, im: -2 }],
    zeros: [{ re: 0, im: 0 }],
    plane: "s",
    title: "Second-Order System",
  },
  "bode-plot": {
    numerator: [1],
    denominator: [1, 2, 1],
    title: "Bode Plot: 1/(s\u00b2+2s+1)",
  },
  "root-locus": {
    openLoopPoles: [
      { re: 0, im: 0 },
      { re: -1, im: 0 },
      { re: -2, im: 0 },
    ],
    openLoopZeros: [],
    title: "Root Locus: K/(s(s+1)(s+2))",
  },
  "nyquist-plot": {
    numerator: [1],
    denominator: [1, 3, 2, 0],
    title: "Nyquist: 1/(s(s+1)(s+2))",
  },
  "step-response": {
    numerator: [1],
    denominator: [1, 2, 1],
    title: "Unit Step Response",
  },
  "block-diagram": {
    blocks: [
      { id: "R", label: "R(s)", x: 60, y: 120, type: "input" as const },
      { id: "sum", label: "Σ", x: 180, y: 120, type: "summing" as const },
      { id: "G", label: "G(s)", x: 320, y: 120, type: "transfer" as const },
      { id: "Y", label: "Y(s)", x: 480, y: 120, type: "output" as const },
      { id: "H", label: "H(s)", x: 320, y: 240, type: "transfer" as const },
    ],
    connections: [
      { from: "R", to: "sum", label: "+" },
      { from: "sum", to: "G" },
      { from: "G", to: "Y" },
      { from: "Y", to: "H", path: "feedback-below" as const },
      { from: "H", to: "sum", sign: "-" as const },
    ],
  },
  "circuit-diagram": {
    components: [
      { type: "voltage-source" as const, id: "V1", x: 60, y: 120, label: "V1 = 5V" },
      { type: "resistor" as const, id: "R1", x: 200, y: 60, label: "R1 = 1kΩ" },
      { type: "capacitor" as const, id: "C1", x: 340, y: 120, label: "C1 = 10µF" },
      { type: "ground" as const, id: "GND", x: 200, y: 200 },
    ],
    wires: [
      { points: [{ x: 60, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 60 }] },
      { points: [{ x: 200, y: 60 }, { x: 340, y: 60 }, { x: 340, y: 80 }] },
      { points: [{ x: 340, y: 160 }, { x: 340, y: 200 }, { x: 200, y: 200 }] },
      { points: [{ x: 200, y: 200 }, { x: 60, y: 200 }, { x: 60, y: 160 }] },
    ],
  },
  "phasor-diagram": {
    phasors: [
      { magnitude: 5, angleDeg: 0, label: "V", color: "#3b82f6" },
      { magnitude: 3, angleDeg: 60, label: "I", color: "#ef4444" },
    ],
  },
  "filter-response": {
    filterType: "lowpass",
    cutoffFreq: 1000,
    order: 2,
    title: "2nd-Order Butterworth LPF",
  },
  "convolution": {
    signal1: "rect",
    signal2: "rect",
    title: "Rectangular Convolution",
  },
  "fourier-series": {
    waveform: "square",
    harmonics: 5,
    title: "Fourier Series: Square Wave",
  },
  "sampling": {
    signalFreq: 5,
    samplingFreq: 20,
    title: "Sampling & Aliasing Demo",
  },
  "vector-field": {
    expression: { u: "-y", v: "x" },
    xRange: [-3, 3],
    yRange: [-3, 3],
    title: "Rotation Field",
  },
  "transform-3d": {
    matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  },
  "prob-dist": {
    distribution: "normal",
    params: { mean: 0, std: 1 },
    title: "Standard Normal Distribution",
  },
  "decision-tree": {
    root: {
      id: "root",
      label: "Start",
      type: "decision" as const,
      children: [
        {
          id: "a",
          label: "Yes",
          type: "chance" as const,
          probability: 0.6,
          children: [
            { id: "a1", label: "Win", type: "outcome" as const, value: "+100" },
            { id: "a2", label: "Lose", type: "outcome" as const, value: "-50" },
          ],
        },
        {
          id: "b",
          label: "No",
          type: "outcome" as const,
          probability: 0.4,
          value: "0",
        },
      ],
    },
  },
  "logic-gates": {
    gates: [
      { type: "AND" as const, id: "g1", inputs: ["A", "B"], x: 100, y: 60 },
    ],
  },
  "karnaugh-map": {
    variables: 3,
    minterms: [0, 1, 3, 7],
  },
  "timing-diagram": {
    signals: [
      { name: "CLK", waveform: [0, 1, 0, 1, 0, 1, 0, 1] },
      { name: "D", waveform: [0, 0, 1, 1, 0, 0, 1, 1] },
      { name: "Q", waveform: [0, 0, 0, 1, 1, 0, 0, 1] },
    ],
  },
  "fbd-builder": {
    body: { shape: "rect" as const, x: 200, y: 150, width: 100, height: 60, label: "Block" },
    forces: [
      { magnitude: 100, angle: 270, label: "W = 100N", x: 200, y: 150, type: "weight" as const },
      { magnitude: 100, angle: 90, label: "N = 100N", x: 200, y: 180, type: "normal" as const },
      { magnitude: 50, angle: 0, label: "F = 50N", x: 200, y: 150, type: "applied" as const },
    ],
  },
  "truss-viz": {
    nodes: [
      { id: "A", x: 100, y: 250, fixed: true, label: "A" },
      { id: "B", x: 500, y: 250, roller: true, label: "B" },
      { id: "C", x: 300, y: 100, label: "C" },
    ],
    members: [
      { from: "A", to: "B", label: "AB" },
      { from: "B", to: "C", label: "BC" },
      { from: "C", to: "A", label: "CA" },
    ],
    externalForces: [
      { nodeId: "C", fy: 80, label: "P = 10kN" },
    ],
  },
  "graph-viz": {
    nodes: [
      { id: "A", x: 50, y: 100 },
      { id: "B", x: 200, y: 50 },
      { id: "C", x: 200, y: 150 },
      { id: "D", x: 350, y: 100 },
    ],
    edges: [
      { from: "A", to: "B", weight: 4 },
      { from: "A", to: "C", weight: 2 },
      { from: "B", to: "D", weight: 3 },
      { from: "C", to: "D", weight: 1 },
    ],
    directed: true,
  },
  "tree-viz": {
    root: {
      id: "n10", value: 10,
      left: { id: "n5", value: 5, left: { id: "n3", value: 3 }, right: { id: "n7", value: 7 } },
      right: { id: "n15", value: 15, left: { id: "n12", value: 12 }, right: { id: "n20", value: 20 } },
    },
    title: "Binary Search Tree",
    showNullLeaves: true,
  },
  "stack-queue": {
    mode: "stack",
    initialItems: [10, 20, 30],
  },
  "linked-list": {
    nodes: [
      { value: 1, next: 2 },
      { value: 2, next: 3 },
      { value: 3, next: null },
    ],
  },
  "heap-viz": {
    values: [1, 3, 5, 7, 9, 8, 6],
    type: "min",
  },
  "code-playground": {
    language: "python",
    initialCode: "# Calculate factorial\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))",
  },
  "neuron-diagram": {
    showLabels: true,
    highlightPart: "axon",
  },
  "action-potential": {
    showPhases: true,
    animated: false,
  },
  "synapse-animation": {
    speed: 1,
    showLabels: true,
  },
  "body-system": {
    system: "nervous",
    showLabels: true,
  },
  "motor-chars": {
    motorType: "dc-shunt",
    ratedVoltage: 220,
    ratedSpeed: 1500,
  },
  "org-chart": {
    root: {
      id: "ceo",
      label: "CEO",
      children: [
        {
          id: "cfo",
          label: "CFO",
          children: [
            { id: "acc", label: "Accounting" },
            { id: "fin", label: "Finance" },
          ],
        },
        {
          id: "cto",
          label: "CTO",
          children: [
            { id: "eng", label: "Engineering" },
            { id: "qa", label: "QA" },
          ],
        },
      ],
    },
  },
  "data-interp": {
    chartType: "bar",
    categories: ["2020", "2021", "2022", "2023"],
    series: [
      { label: "Revenue", values: [120, 145, 190, 210], color: "#3b82f6" },
      { label: "Profit", values: [30, 42, 65, 78], color: "#22c55e" },
    ],
    title: "Revenue & Profit Growth",
  },
  "flashcard-deck": {
    cards: [
      { front: "What is a matrix?", back: "A rectangular array of numbers arranged in rows and columns." },
      { front: "What is the transpose?", back: "The matrix obtained by interchanging rows and columns: (A\u1D40)\u1D62\u2C7C = a\u2C7C\u1D62" },
      { front: "When can two matrices be multiplied?", back: "When the number of columns in the first equals the number of rows in the second." },
    ],
  },
};

// ── Category labels ─────────────────────────────────────────────────────

const categoryLabels: Record<string, string> = {
  math: "Math & Linear Algebra",
  signals: "Signals & Systems",
  control: "Control Systems",
  circuits: "Circuits & Electronics",
  digital: "Digital Electronics",
  mechanics: "Engineering Mechanics",
  algorithms: "Data Structures & Algorithms",
  code: "Code Playground",
  biology: "Biology & Neuroscience",
  actuators: "Actuators & Motors",
  finance: "Finance & Data Interpretation",
};

// ── Gallery Component ───────────────────────────────────────────────────

export function VisualizationGallery() {
  const all = listVisualizations();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group by category
  const grouped = all.reduce<Record<string, typeof all>>((acc, item) => {
    const cat = item.entry.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-4 text-xl font-semibold capitalize">
            {categoryLabels[category] ?? category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ id, entry }) => {
              const isExpanded = expandedId === id;
              return (
                <div
                  key={id}
                  className={cn(
                    "rounded-lg border bg-card transition-all",
                    isExpanded && "sm:col-span-2 lg:col-span-3"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div>
                      <span className="font-mono text-sm text-primary">
                        {id}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {entry.description}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t p-4">
                      <Suspense fallback={<VisualizationSkeleton />}>
                        <ExpandedVisualization id={id} component={entry.component} />
                      </Suspense>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function ExpandedVisualization({
  id,
  component: Component,
}: {
  readonly id: string;
  readonly component: React.LazyExoticComponent<React.ComponentType<any>>;
}) {
  const props = sampleProps[id] ?? {};
  return <Component {...props} />;
}
