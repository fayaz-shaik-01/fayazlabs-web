"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Network, ZoomIn, ZoomOut, Maximize2, Filter } from "lucide-react";


// ── Types ────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: "concept" | "formula" | "theorem" | "definition";
  module: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: "prerequisite" | "related" | "usedIn";
}

// ── Sample data ──────────────────────────────────────────────────────────

const sampleNodes: GraphNode[] = [
  { id: "matrix", label: "Matrix", type: "concept", module: "linear-algebra", x: 300, y: 200 },
  { id: "determinant", label: "Determinant", type: "concept", module: "linear-algebra", x: 500, y: 150 },
  { id: "inverse", label: "Matrix Inverse", type: "concept", module: "linear-algebra", x: 550, y: 300 },
  { id: "rank", label: "Rank", type: "concept", module: "linear-algebra", x: 400, y: 350 },
  { id: "eigenvalue", label: "Eigenvalues", type: "concept", module: "linear-algebra", x: 650, y: 200 },
  { id: "linear-system", label: "Linear Systems", type: "concept", module: "linear-algebra", x: 350, y: 500 },
  { id: "rank-nullity", label: "Rank-Nullity Theorem", type: "theorem", module: "linear-algebra", x: 250, y: 420 },
  { id: "cramer", label: "Cramer's Rule", type: "formula", module: "linear-algebra", x: 500, y: 450 },
  { id: "cayley-hamilton", label: "Cayley-Hamilton", type: "theorem", module: "linear-algebra", x: 700, y: 350 },
  { id: "transfer-fn", label: "Transfer Function", type: "concept", module: "control-systems", x: 800, y: 250 },
  { id: "bode", label: "Bode Plot", type: "concept", module: "control-systems", x: 900, y: 200 },
  { id: "routh", label: "Routh-Hurwitz", type: "theorem", module: "control-systems", x: 850, y: 400 },
  { id: "pid", label: "PID Controller", type: "concept", module: "control-systems", x: 950, y: 350 },
  { id: "stability", label: "Stability", type: "concept", module: "control-systems", x: 800, y: 500 },
  { id: "fourier", label: "Fourier Transform", type: "concept", module: "signals-systems", x: 150, y: 350 },
  { id: "laplace", label: "Laplace Transform", type: "concept", module: "signals-systems", x: 100, y: 250 },
  { id: "convolution", label: "Convolution", type: "concept", module: "signals-systems", x: 100, y: 450 },
];

const sampleEdges: GraphEdge[] = [
  { from: "matrix", to: "determinant", type: "prerequisite" },
  { from: "determinant", to: "inverse", type: "prerequisite" },
  { from: "matrix", to: "rank", type: "prerequisite" },
  { from: "rank", to: "rank-nullity", type: "prerequisite" },
  { from: "rank", to: "linear-system", type: "prerequisite" },
  { from: "determinant", to: "cramer", type: "usedIn" },
  { from: "cramer", to: "linear-system", type: "related" },
  { from: "determinant", to: "eigenvalue", type: "prerequisite" },
  { from: "eigenvalue", to: "cayley-hamilton", type: "prerequisite" },
  { from: "eigenvalue", to: "transfer-fn", type: "usedIn" },
  { from: "transfer-fn", to: "bode", type: "prerequisite" },
  { from: "transfer-fn", to: "routh", type: "prerequisite" },
  { from: "transfer-fn", to: "stability", type: "related" },
  { from: "routh", to: "stability", type: "prerequisite" },
  { from: "pid", to: "transfer-fn", type: "related" },
  { from: "laplace", to: "transfer-fn", type: "usedIn" },
  { from: "fourier", to: "laplace", type: "related" },
  { from: "convolution", to: "fourier", type: "related" },
  { from: "inverse", to: "linear-system", type: "usedIn" },
];

// ── Color map ────────────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  "linear-algebra": "#8b5cf6",
  "control-systems": "#06b6d4",
  "signals-systems": "#f59e0b",
};

const EDGE_STYLES: Record<string, { color: string; dash: string }> = {
  prerequisite: { color: "var(--primary)", dash: "" },
  related: { color: "var(--muted-foreground)", dash: "4 4" },
  usedIn: { color: "var(--lab-green)", dash: "8 4" },
};

// ── Component ────────────────────────────────────────────────────────────

export function KnowledgeGraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const filteredNodes = useMemo(
    () => selectedModule === "all" ? sampleNodes : sampleNodes.filter((n) => n.module === selectedModule),
    [selectedModule]
  );

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(
    () => sampleEdges.filter((e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)),
    [filteredNodeIds]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    for (const edge of filteredEdges) {
      const fromNode = filteredNodes.find((n) => n.id === edge.from);
      const toNode = filteredNodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) continue;

      const style = EDGE_STYLES[edge.type] || EDGE_STYLES.related;
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--muted-foreground").trim() || "rgba(150,150,150,0.3)";
      ctx.lineWidth = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode) ? 2 : 0.8;
      ctx.globalAlpha = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode) ? 0.8 : 0.2;
      if (style.dash) {
        ctx.setLineDash(style.dash.split(" ").map(Number));
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // Draw nodes
    for (const node of filteredNodes) {
      const color = MODULE_COLORS[node.module] || "#8b5cf6";
      const isHovered = hoveredNode === node.id;
      const isConnected = hoveredNode && filteredEdges.some(
        (e) => (e.from === hoveredNode && e.to === node.id) || (e.to === hoveredNode && e.from === node.id)
      );
      const radius = node.type === "concept" ? 8 : 6;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered ? radius + 3 : radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = isHovered ? 1 : isConnected ? 0.9 : hoveredNode ? 0.3 : 0.7;
      ctx.fill();

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
      }

      // Label
      ctx.globalAlpha = isHovered ? 1 : isConnected ? 0.9 : hoveredNode ? 0.2 : 0.7;
      ctx.font = isHovered ? "bold 11px system-ui" : "10px system-ui";
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--foreground").trim() || "#fff";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + radius + 14);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, [filteredNodes, filteredEdges, hoveredNode, zoom, pan]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left - pan.x) / zoom;
      const my = (e.clientY - rect.top - pan.y) / zoom;

      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
        return;
      }

      let found: string | null = null;
      for (const node of filteredNodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (dx * dx + dy * dy < 200) {
          found = node.id;
          break;
        }
      }
      setHoveredNode(found);
      canvas.style.cursor = found ? "pointer" : isDragging ? "grabbing" : "grab";
    },
    [filteredNodes, zoom, pan, isDragging, dragStart]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.3, Math.min(3, z * delta)));
    },
    []
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
        <div className="absolute top-0 left-1/2 w-[500px] h-[500px] rounded-full bg-glow-violet/[0.05] blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-12 sm:pt-40 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mono-tag text-lab-green mb-6 flex items-center gap-2"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-green animate-glow-pulse" />
            [KNOWLEDGE_GRAPH: INTERACTIVE]
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35 }}
            className="text-display-xl text-foreground max-w-3xl"
          >
            Knowledge
            <br />
            <span className="text-gradient-hero">Graph</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-6 text-body-lg text-muted-foreground max-w-xl"
          >
            Explore concept relationships and learning dependencies. Hover on
            nodes to see connections, scroll to zoom, drag to pan.
          </motion.p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Graph */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-xs text-foreground focus:border-primary/40 focus:outline-none"
            >
              <option value="all">All Modules</option>
              <option value="linear-algebra">Linear Algebra</option>
              <option value="control-systems">Control Systems</option>
              <option value="signals-systems">Signals & Systems</option>
            </select>

            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 ml-4">
              {Object.entries(MODULE_COLORS).map(([mod, color]) => (
                <span key={mod} className="flex items-center gap-1 text-[0.625rem] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  {mod.replace("-", " ")}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Reset view"
              aria-label="Reset view"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative rounded-xl border border-border bg-muted/10 overflow-hidden"
          style={{ height: "60vh", minHeight: 400 }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* Hovered node info */}
          {hoveredNode && (
            <div className="absolute top-4 right-4 rounded-lg border border-border bg-background/90 backdrop-blur-sm p-3 shadow-lg min-w-[180px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Network className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {filteredNodes.find((n) => n.id === hoveredNode)?.label}
                </span>
              </div>
              <div className="text-[0.625rem] text-muted-foreground space-y-0.5">
                <div>
                  Type: <span className="text-foreground/80">{filteredNodes.find((n) => n.id === hoveredNode)?.type}</span>
                </div>
                <div>
                  Module: <span className="text-foreground/80">{filteredNodes.find((n) => n.id === hoveredNode)?.module}</span>
                </div>
                <div>
                  Connections: <span className="text-foreground/80">
                    {filteredEdges.filter((e) => e.from === hoveredNode || e.to === hoveredNode).length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3 text-[0.625rem] text-muted-foreground/50 font-mono">
            <span>{filteredNodes.length} nodes</span>
            <span>{filteredEdges.length} edges</span>
            <span>{Math.round(zoom * 100)}% zoom</span>
          </div>
        </div>
      </div>
    </>
  );
}
