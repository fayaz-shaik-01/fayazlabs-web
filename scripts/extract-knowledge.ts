#!/usr/bin/env tsx
/**
 * Knowledge Extraction Script
 *
 * Reads all compiled Velite TrackLesson data and generates:
 *  1. knowledge-graph.json  — All KOs and edges
 *  2. search-index.json     — Searchable content with types
 *  3. formula-index.json    — All formulas with LaTeX
 *
 * Run after `velite build`:
 *   npx tsx scripts/extract-knowledge.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, join } from "path";

// ── Types ──────────────────────────────────────────────────────────────────

interface VeliteKO {
  id: string;
  type: string;
  title?: string;
  latex?: string;
  plainEnglish?: string;
  prerequisites: string[];
  usedIn: string[];
  difficulty?: string;
  tags: string[];
  examRelevance?: {
    gate?: string;
    sebi?: string;
  };
}

interface VeliteTrackLesson {
  slug: string;
  slugAsParams: string;
  title: string;
  description: string;
  track: string;
  module: string;
  lesson: string;
  difficulty: string;
  prerequisites: string[];
  tags: string[];
  concepts: string[];
  relatedLessons: string[];
  learningObjectives: string[];
  knowledgeObjects: VeliteKO[];
  published: boolean;
  status: string;
}

interface KnowledgeObject {
  id: string;
  type: string;
  title: string;
  latex?: string;
  plainEnglish?: string;
  prerequisites: string[];
  usedIn: string[];
  difficulty: string;
  tags: string[];
  examRelevance?: { gate?: string; sebi?: string };
  track: string;
  module: string;
  lesson: string;
}

interface KnowledgeEdge {
  source: string;
  target: string;
  relationship: string;
}

interface KnowledgeGraph {
  version: string;
  generatedAt: string;
  totalObjects: number;
  totalEdges: number;
  objects: Record<string, KnowledgeObject>;
  edges: KnowledgeEdge[];
  byType: Record<string, string[]>;
  byTrack: Record<string, string[]>;
  byModule: Record<string, string[]>;
  byLesson: Record<string, string[]>;
}

interface SearchEntry {
  id: string;
  type: string;
  title: string;
  snippet: string;
  track: string;
  module: string;
  lesson: string;
  url: string;
  tags: string[];
  difficulty: string;
}

interface FormulaEntry {
  id: string;
  name: string;
  latex: string;
  plainEnglish: string;
  track: string;
  module: string;
  lesson: string;
  tags: string[];
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  const projectRoot = resolve(__dirname, "..");
  const veliteDir = join(projectRoot, ".velite");
  const outputDir = join(projectRoot, "public", "data");

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Load Velite output — per-collection JSON files
  const trackLessonsPath = join(veliteDir, "trackLessons.json");
  if (!existsSync(trackLessonsPath)) {
    console.log("⚠️  .velite/trackLessons.json not found. Generating from curriculum data...");
    generateFromCurriculum(projectRoot, outputDir);
    return;
  }

  const trackLessons: VeliteTrackLesson[] = JSON.parse(readFileSync(trackLessonsPath, "utf-8"));

  console.log(`📖 Found ${trackLessons.length} track lessons`);

  // Extract Knowledge Objects
  const allObjects: Record<string, KnowledgeObject> = {};
  const allEdges: KnowledgeEdge[] = [];
  const searchEntries: SearchEntry[] = [];
  const formulaEntries: FormulaEntry[] = [];

  for (const lesson of trackLessons) {
    if (!lesson.published) continue;

    // Add lesson-level search entry
    searchEntries.push({
      id: `lesson_${lesson.track}_${lesson.module}_${lesson.lesson}`,
      type: "lesson",
      title: lesson.title,
      snippet: lesson.description,
      track: lesson.track,
      module: lesson.module,
      lesson: lesson.lesson,
      url: `/learning/${lesson.track}/${lesson.module}/${lesson.lesson}`,
      tags: lesson.tags,
      difficulty: lesson.difficulty,
    });

    // Auto-generate KOs from concepts (for lessons without explicit KO frontmatter)
    if (lesson.knowledgeObjects.length === 0 && lesson.concepts.length > 0) {
      for (const concept of lesson.concepts) {
        const koId = `ko_${lesson.track}_${concept}`;
        if (!allObjects[koId]) {
          allObjects[koId] = {
            id: koId,
            type: "concept",
            title: concept.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            prerequisites: [],
            usedIn: [],
            difficulty: lesson.difficulty,
            tags: lesson.tags,
            track: lesson.track,
            module: lesson.module,
            lesson: lesson.lesson,
          };

          searchEntries.push({
            id: koId,
            type: "concept",
            title: allObjects[koId].title,
            snippet: `Concept from ${lesson.title}`,
            track: lesson.track,
            module: lesson.module,
            lesson: lesson.lesson,
            url: `/learning/${lesson.track}/${lesson.module}/${lesson.lesson}#${concept}`,
            tags: lesson.tags,
            difficulty: lesson.difficulty,
          });
        }
      }
    }

    // Process explicit Knowledge Objects
    for (const ko of lesson.knowledgeObjects) {
      const koObj: KnowledgeObject = {
        id: ko.id,
        type: ko.type,
        title: ko.title ?? ko.id.replace(/^ko_/, "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        latex: ko.latex,
        plainEnglish: ko.plainEnglish,
        prerequisites: ko.prerequisites,
        usedIn: ko.usedIn,
        difficulty: ko.difficulty ?? lesson.difficulty,
        tags: [...new Set([...ko.tags, ...lesson.tags])],
        examRelevance: ko.examRelevance,
        track: lesson.track,
        module: lesson.module,
        lesson: lesson.lesson,
      };

      allObjects[ko.id] = koObj;

      // Build edges
      for (const prereq of ko.prerequisites) {
        allEdges.push({ source: prereq, target: ko.id, relationship: "prerequisite" });
      }
      for (const used of ko.usedIn) {
        allEdges.push({ source: ko.id, target: used, relationship: "usedIn" });
      }

      // Add search entry
      searchEntries.push({
        id: ko.id,
        type: ko.type,
        title: koObj.title,
        snippet: ko.plainEnglish ?? `${ko.type} from ${lesson.title}`,
        track: lesson.track,
        module: lesson.module,
        lesson: lesson.lesson,
        url: `/learning/${lesson.track}/${lesson.module}/${lesson.lesson}#${ko.id}`,
        tags: koObj.tags,
        difficulty: koObj.difficulty,
      });

      // Add formula entry
      if (ko.type === "formula" && ko.latex) {
        formulaEntries.push({
          id: ko.id,
          name: koObj.title,
          latex: ko.latex,
          plainEnglish: ko.plainEnglish ?? "",
          track: lesson.track,
          module: lesson.module,
          lesson: lesson.lesson,
          tags: koObj.tags,
        });
      }
    }

    // Build edges from lesson-level prerequisites and related lessons
    for (const prereq of lesson.prerequisites) {
      const lessonKoId = `lesson_${lesson.track}_${lesson.module}_${lesson.lesson}`;
      allEdges.push({
        source: prereq,
        target: lessonKoId,
        relationship: "prerequisite",
      });
    }
    for (const related of lesson.relatedLessons) {
      const lessonKoId = `lesson_${lesson.track}_${lesson.module}_${lesson.lesson}`;
      allEdges.push({
        source: lessonKoId,
        target: related,
        relationship: "related",
      });
    }
  }

  // Build indices
  const byType: Record<string, string[]> = {};
  const byTrack: Record<string, string[]> = {};
  const byModule: Record<string, string[]> = {};
  const byLesson: Record<string, string[]> = {};

  for (const [id, obj] of Object.entries(allObjects)) {
    (byType[obj.type] ??= []).push(id);
    (byTrack[obj.track] ??= []).push(id);
    (byModule[`${obj.track}/${obj.module}`] ??= []).push(id);
    (byLesson[`${obj.track}/${obj.module}/${obj.lesson}`] ??= []).push(id);
  }

  // Write Knowledge Graph
  const graph: KnowledgeGraph = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    totalObjects: Object.keys(allObjects).length,
    totalEdges: allEdges.length,
    objects: allObjects,
    edges: allEdges,
    byType,
    byTrack,
    byModule,
    byLesson,
  };

  writeFileSync(join(outputDir, "knowledge-graph.json"), JSON.stringify(graph, null, 2));
  console.log(`🧠 Knowledge Graph: ${graph.totalObjects} objects, ${graph.totalEdges} edges`);

  // Write Search Index
  const searchIndex = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    totalEntries: searchEntries.length,
    entries: searchEntries,
  };

  writeFileSync(join(outputDir, "search-index.json"), JSON.stringify(searchIndex, null, 2));
  console.log(`🔍 Search Index: ${searchEntries.length} entries`);

  // Write Formula Index
  const formulaIndex = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    totalFormulas: formulaEntries.length,
    formulas: formulaEntries,
    byTrack: formulaEntries.reduce<Record<string, string[]>>((acc, f) => {
      (acc[f.track] ??= []).push(f.id);
      return acc;
    }, {}),
  };

  writeFileSync(join(outputDir, "formula-index.json"), JSON.stringify(formulaIndex, null, 2));
  console.log(`📐 Formula Index: ${formulaEntries.length} formulas`);

  console.log(`\n✅ All knowledge artifacts written to ${outputDir}`);
}

/**
 * Fallback: Generate search entries from curriculum JSON manifests
 * when Velite output isn't available.
 */
function generateFromCurriculum(projectRoot: string, outputDir: string) {
  const curriculumDir = join(projectRoot, "content", "learning", "curriculum");
  const tracksIndexPath = join(curriculumDir, "tracks.json");

  if (!existsSync(tracksIndexPath)) {
    console.error("❌ tracks.json not found at", tracksIndexPath);
    process.exit(1);
  }

  const tracksIndex = JSON.parse(readFileSync(tracksIndexPath, "utf-8"));
  const searchEntries: SearchEntry[] = [];

  for (const trackEntry of tracksIndex.tracks) {
    const manifestPath = join(curriculumDir, trackEntry.manifestFile);
    if (!existsSync(manifestPath)) continue;

    const track = JSON.parse(readFileSync(manifestPath, "utf-8"));

    // Add track-level search entry
    searchEntries.push({
      id: track.id,
      type: "lesson",
      title: track.title,
      snippet: track.description,
      track: track.slug,
      module: "",
      lesson: "",
      url: `/learning/${track.slug}`,
      tags: track.tags ?? [],
      difficulty: track.difficulty,
    });

    for (const mod of track.modules) {
      for (const lesson of mod.lessons) {
        searchEntries.push({
          id: lesson.id,
          type: "lesson",
          title: lesson.title,
          snippet: `${mod.title} › ${lesson.title}`,
          track: track.slug,
          module: mod.slug,
          lesson: lesson.slug,
          url: `/learning/${track.slug}/${mod.slug}/${lesson.slug}`,
          tags: track.tags ?? [],
          difficulty: lesson.difficulty,
        });
      }
    }
  }

  // Write minimal search index
  const searchIndex = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    totalEntries: searchEntries.length,
    entries: searchEntries,
  };

  writeFileSync(join(outputDir, "search-index.json"), JSON.stringify(searchIndex, null, 2));
  console.log(`🔍 Search Index (from curriculum): ${searchEntries.length} entries`);

  // Write empty knowledge graph and formula index
  const emptyGraph: KnowledgeGraph = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    totalObjects: 0,
    totalEdges: 0,
    objects: {},
    edges: [],
    byType: {},
    byTrack: {},
    byModule: {},
    byLesson: {},
  };

  writeFileSync(join(outputDir, "knowledge-graph.json"), JSON.stringify(emptyGraph, null, 2));
  writeFileSync(
    join(outputDir, "formula-index.json"),
    JSON.stringify({ version: "1.0.0", generatedAt: new Date().toISOString(), totalFormulas: 0, formulas: [], byTrack: {} }, null, 2)
  );

  console.log(`\n✅ Baseline knowledge artifacts written to ${outputDir}`);
}

main();
