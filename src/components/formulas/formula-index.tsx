"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Copy, Check, BookOpen, Filter } from "lucide-react";
import { getAllTracks } from "@/lib/curriculum";
import { LatexRenderer } from "@/components/shared/latex-renderer";

// ── Types ────────────────────────────────────────────────────────────────

interface Formula {
  id: string;
  name: string;
  latex: string;
  plainEnglish?: string;
  track: string;
  module: string;
  lesson: string;
  tags: string[];
}

// ── Sample formulas (from KO extraction) ─────────────────────────────────

const sampleFormulas: Formula[] = [
  {
    id: "ko_matrix_multiplication_rule",
    name: "Matrix Multiplication",
    latex: "(AB)_{ij} = \\sum_{k=1}^{n} a_{ik} b_{kj}",
    plainEnglish: "Element (i,j) of AB is the dot product of row i of A and column j of B",
    track: "gate-ra-2027",
    module: "linear-algebra",
    lesson: "matrices",
    tags: ["matrix", "multiplication"],
  },
  {
    id: "ko_symmetric_decomposition",
    name: "Symmetric + Skew-Symmetric Decomposition",
    latex: "A = \\frac{A + A^T}{2} + \\frac{A - A^T}{2}",
    plainEnglish: "Any square matrix can be uniquely written as the sum of a symmetric and a skew-symmetric matrix",
    track: "gate-ra-2027",
    module: "linear-algebra",
    lesson: "matrices",
    tags: ["decomposition", "symmetric"],
  },
  {
    id: "f_det_2x2",
    name: "2×2 Determinant",
    latex: "\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc",
    plainEnglish: "Product of main diagonal minus product of anti-diagonal",
    track: "gate-ra-2027",
    module: "linear-algebra",
    lesson: "determinants",
    tags: ["determinant", "2x2"],
  },
  {
    id: "f_eigenvalue",
    name: "Eigenvalue Equation",
    latex: "\\det(A - \\lambda I) = 0",
    plainEnglish: "Characteristic equation: the determinant of (A minus lambda times identity) equals zero",
    track: "gate-ra-2027",
    module: "linear-algebra",
    lesson: "eigenvalues",
    tags: ["eigenvalue", "characteristic-equation"],
  },
  {
    id: "f_cramer",
    name: "Cramer's Rule",
    latex: "x_i = \\frac{\\det(A_i)}{\\det(A)}",
    plainEnglish: "Each unknown equals the determinant of A with column i replaced by b, divided by det(A)",
    track: "gate-ra-2027",
    module: "linear-algebra",
    lesson: "system-of-equations",
    tags: ["cramer", "linear-system"],
  },
  {
    id: "f_routh",
    name: "Routh Array First Column",
    latex: "s^n: a_n,\\; s^{n-1}: a_{n-1},\\; s^{n-2}: \\frac{a_{n-1}a_{n-2} - a_n a_{n-3}}{a_{n-1}}",
    plainEnglish: "Each element computed from the 2×2 determinant of rows above, divided by first element of row above",
    track: "gate-ra-2027",
    module: "control-systems",
    lesson: "routh-hurwitz",
    tags: ["routh", "stability"],
  },
  {
    id: "f_transfer",
    name: "Closed-Loop Transfer Function",
    latex: "T(s) = \\frac{G(s)}{1 + G(s)H(s)}",
    plainEnglish: "Output/Input for negative feedback: forward gain divided by (1 + loop gain)",
    track: "gate-ra-2027",
    module: "control-systems",
    lesson: "transfer-function",
    tags: ["transfer-function", "feedback"],
  },
  {
    id: "f_pid",
    name: "PID Controller",
    latex: "G_c(s) = K_p + \\frac{K_i}{s} + K_d s",
    plainEnglish: "Proportional + Integral + Derivative controller in s-domain",
    track: "gate-ra-2027",
    module: "control-systems",
    lesson: "pid-controllers",
    tags: ["PID", "controller"],
  },
];

// ── Formula Card ─────────────────────────────────────────────────────────

function FormulaCard({ formula, index }: Readonly<{ formula: Formula; index: number }>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formula.latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.12] transition-colors group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{formula.name}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[0.625rem] text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
          title="Copy LaTeX"
        >
          {copied ? (
            <><Check className="h-3 w-3 text-lab-green" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3" /> LaTeX</>
          )}
        </button>
      </div>

      {/* LaTeX rendered via KaTeX */}
      <div className="my-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center overflow-x-auto">
        <LatexRenderer latex={formula.latex} display />
      </div>

      {/* Plain English */}
      {formula.plainEnglish && (
        <p className="text-xs text-muted-foreground/60 italic mb-3">
          {formula.plainEnglish}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {formula.tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.5625rem] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground/50 font-mono"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-[0.5625rem] text-muted-foreground/30 font-mono">
          {formula.module}/{formula.lesson}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────

export function FormulaIndex() {
  const [query, setQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const tracks = getAllTracks();

  const filtered = useMemo(
    () =>
      sampleFormulas.filter((f) => {
        if (selectedTrack !== "all" && f.track !== selectedTrack) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          return (
            f.name.toLowerCase().includes(q) ||
            f.plainEnglish?.toLowerCase().includes(q) ||
            f.tags.some((t) => t.toLowerCase().includes(q)) ||
            f.latex.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [query, selectedTrack]
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-glow-accent/[0.05] blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mono-tag text-lab-green mb-6 flex items-center gap-2"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-green animate-glow-pulse" />
            [FORMULA_INDEX: LOADED]
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35 }}
            className="text-display-xl text-foreground max-w-3xl"
          >
            Formula
            <br />
            <span className="text-gradient-hero">Quick Reference</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-6 text-body-lg text-muted-foreground max-w-xl"
          >
            Searchable formula index with LaTeX rendering. Copy any formula for
            your notes or assignments.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 flex items-center gap-6"
          >
            <div className="border-l border-lab-green/20 pl-3">
              <div className="text-xl font-bold text-foreground font-mono">{sampleFormulas.length}</div>
              <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> FORMULAS
              </div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search formulas..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-foreground focus:border-primary/40 focus:outline-none"
          >
            <option value="all">All Tracks</option>
            {tracks.map((t) => (
              <option key={t.slug} value={t.slug}>{t.title}</option>
            ))}
          </select>

          <span className="text-xs text-muted-foreground/50 font-mono">
            {filtered.length} formula{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Formula Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((formula, i) => (
            <FormulaCard key={formula.id} formula={formula} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground/50">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No formulas match your search.</p>
          </div>
        )}
      </div>
    </>
  );
}
