import { lazy, type ComponentType } from "react";
import type {
  VisualizationCategory,
  VisualizationTechnology,
} from "./common/VisualizationShell";

// ── Registry Entry ──────────────────────────────────────────────────────

export interface VisualizationEntry {
  component: React.LazyExoticComponent<ComponentType<any>>;
  category: VisualizationCategory;
  technology: VisualizationTechnology;
  description: string;
}

// ── Visualization Registry ──────────────────────────────────────────────
// Every visualization component MUST be registered here with a unique
// kebab-case ID. Components are lazy-loaded to keep the initial bundle small.
//
// Convention:
//   '{registry-id}': {
//     component: lazy(() => import('./{category}/{ComponentName}')),
//     category: '{category}',
//     technology: '{technology}',
//     description: 'Short description for title bar'
//   }

export const visualizationRegistry: Record<string, VisualizationEntry> = {
  // ── V1: Core Math & Signals ─────────────────────────────────────────
  "graph-2d": {
    component: lazy(() => import("./math/InteractiveGraph2D")),
    category: "math",
    technology: "plotly",
    description: "Interactive 2D Function Plotter",
  },
  "graph-3d": {
    component: lazy(() => import("./math/InteractiveGraph3D")),
    category: "math",
    technology: "plotly",
    description: "Interactive 3D Surface / Contour Plot",
  },
  "matrix-display": {
    component: lazy(() => import("./math/MatrixDisplay")),
    category: "math",
    technology: "svg",
    description: "Interactive Matrix Display",
  },
  "transform-2d": {
    component: lazy(() => import("./math/TransformationVisualizer2D")),
    category: "math",
    technology: "plotly",
    description: "2D Linear Transformation Visualizer",
  },
  "signal-plot": {
    component: lazy(() => import("./signals/SignalPlot")),
    category: "signals",
    technology: "plotly",
    description: "CT/DT Signal Plotter",
  },
  "pole-zero": {
    component: lazy(() => import("./signals/PoleZeroPlot")),
    category: "signals",
    technology: "plotly",
    description: "Pole-Zero Plot (s-plane / z-plane)",
  },

  // ── V2: Control & Circuits ──────────────────────────────────────────
  "bode-plot": {
    component: lazy(() => import("./control/BodePlotBuilder")),
    category: "control",
    technology: "plotly",
    description: "Bode Plot (Magnitude & Phase)",
  },
  "root-locus": {
    component: lazy(() => import("./control/RootLocusPlot")),
    category: "control",
    technology: "plotly",
    description: "Root Locus Plot",
  },
  "nyquist-plot": {
    component: lazy(() => import("./control/NyquistPlot")),
    category: "control",
    technology: "plotly",
    description: "Nyquist Plot",
  },
  "step-response": {
    component: lazy(() => import("./control/StepResponse")),
    category: "control",
    technology: "plotly",
    description: "Step / Impulse Response",
  },
  "block-diagram": {
    component: lazy(() => import("./control/BlockDiagram")),
    category: "control",
    technology: "svg",
    description: "Control System Block Diagram",
  },
  "circuit-diagram": {
    component: lazy(() => import("./circuits/CircuitDiagram")),
    category: "circuits",
    technology: "svg",
    description: "Circuit Schematic Diagram",
  },
  "phasor-diagram": {
    component: lazy(() => import("./circuits/PhasorDiagram")),
    category: "circuits",
    technology: "svg",
    description: "Phasor Diagram",
  },
  "filter-response": {
    component: lazy(() => import("./circuits/FilterResponsePlot")),
    category: "circuits",
    technology: "plotly",
    description: "Filter Frequency Response",
  },

  // ── V3: Signal Processing & Animations ──────────────────────────────
  "convolution": {
    component: lazy(() => import("./signals/ConvolutionAnimator")),
    category: "signals",
    technology: "plotly",
    description: "Convolution Animator",
  },
  "fourier-series": {
    component: lazy(() => import("./signals/FourierSeriesBuilder")),
    category: "signals",
    technology: "plotly",
    description: "Fourier Series Builder",
  },
  "sampling": {
    component: lazy(() => import("./signals/SamplingVisualizer")),
    category: "signals",
    technology: "plotly",
    description: "Sampling & Aliasing Visualizer",
  },
  "vector-field": {
    component: lazy(() => import("./math/VectorFieldVisualizer")),
    category: "math",
    technology: "plotly",
    description: "2D Vector Field Visualizer",
  },
  "transform-3d": {
    component: lazy(() => import("./math/TransformationVisualizer3D")),
    category: "math",
    technology: "plotly",
    description: "3D Linear Transformation Visualizer",
  },
  "prob-dist": {
    component: lazy(() => import("./math/ProbabilityDistribution")),
    category: "math",
    technology: "plotly",
    description: "Probability Distribution Explorer",
  },
  "decision-tree": {
    component: lazy(() => import("./math/DecisionTree")),
    category: "math",
    technology: "svg",
    description: "Decision / Probability Tree",
  },

  // ── V4: Digital, Mechanics & DS ─────────────────────────────────────
  "logic-gates": {
    component: lazy(() => import("./digital/LogicGateSimulator")),
    category: "digital",
    technology: "svg",
    description: "Logic Gate Simulator",
  },
  "karnaugh-map": {
    component: lazy(() => import("./digital/KarnaughMap")),
    category: "digital",
    technology: "svg",
    description: "Karnaugh Map",
  },
  "timing-diagram": {
    component: lazy(() => import("./digital/TimingDiagram")),
    category: "digital",
    technology: "svg",
    description: "Timing Diagram",
  },
  "fbd-builder": {
    component: lazy(() => import("./mechanics/FBDBuilder")),
    category: "mechanics",
    technology: "svg",
    description: "Interactive Free Body Diagram Builder",
  },
  "truss-viz": {
    component: lazy(() => import("./mechanics/TrussVisualizer")),
    category: "mechanics",
    technology: "svg",
    description: "Interactive Truss Visualizer",
  },
  "graph-viz": {
    component: lazy(() => import("./algorithms/GraphVisualizer")),
    category: "algorithms",
    technology: "svg",
    description: "Graph Visualizer",
  },
  "tree-viz": {
    component: lazy(() => import("./algorithms/TreeVisualizer")),
    category: "algorithms",
    technology: "svg",
    description: "Interactive Tree Visualizer",
  },
  "stack-queue": {
    component: lazy(() => import("./algorithms/StackQueueAnimator")),
    category: "algorithms",
    technology: "svg",
    description: "Stack & Queue Animator",
  },
  "linked-list": {
    component: lazy(() => import("./algorithms/LinkedListAnimator")),
    category: "algorithms",
    technology: "svg",
    description: "Linked List Animator",
  },
  "heap-viz": {
    component: lazy(() => import("./algorithms/HeapVisualizer")),
    category: "algorithms",
    technology: "svg",
    description: "Heap Visualizer",
  },
  "code-playground": {
    component: lazy(() => import("./code/CodePlayground")),
    category: "code",
    technology: "pyodide",
    description: "Interactive Code Playground",
  },

  // ── V5: Biology, Finance & Specialized ──────────────────────────────
  "neuron-diagram": {
    component: lazy(() => import("./biology/NeuronDiagram")),
    category: "biology",
    technology: "svg",
    description: "Interactive Neuron Diagram",
  },
  "action-potential": {
    component: lazy(() => import("./biology/ActionPotentialPlot")),
    category: "biology",
    technology: "svg",
    description: "Action Potential Plot",
  },
  "synapse-animation": {
    component: lazy(() => import("./biology/SynapseAnimation")),
    category: "biology",
    technology: "svg",
    description: "Synapse Transmission Animation",
  },
  "body-system": {
    component: lazy(() => import("./biology/BodySystemDiagram")),
    category: "biology",
    technology: "svg",
    description: "Body System Diagram",
  },
  "motor-chars": {
    component: lazy(() => import("./actuators/MotorCharacteristics")),
    category: "actuators",
    technology: "svg",
    description: "Motor Speed-Torque Characteristics",
  },
  "org-chart": {
    component: lazy(() => import("./finance/OrgChart")),
    category: "finance",
    technology: "svg",
    description: "Organization Chart",
  },
  "data-interp": {
    component: lazy(() => import("./finance/DataInterpretationChart")),
    category: "finance",
    technology: "svg",
    description: "Data Interpretation Chart",
  },
  "flashcard-deck": {
    component: lazy(() => import("./common/FlashcardDeck")),
    category: "math",
    technology: "svg",
    description: "Interactive Flashcard Deck",
  },
};

// ── Lookup helper ───────────────────────────────────────────────────────

export function getVisualization(id: string): VisualizationEntry | undefined {
  return visualizationRegistry[id];
}

export function hasVisualization(id: string): boolean {
  return id in visualizationRegistry;
}

export function listVisualizations(): Array<{
  id: string;
  entry: VisualizationEntry;
}> {
  return Object.entries(visualizationRegistry).map(([id, entry]) => ({
    id,
    entry,
  }));
}
