// Writes src/lib/course/fixtures/catalog.json: the REAL published catalog structure
// (keys, 34 lessons L0 4 / L1 10 / L2 12 / L3 8, labs) with SYNTHETIC titles and text.
import { writeFileSync } from "node:fs";

const levels = [
  { id: "L0", title: "Sample level zero", weeks: "Weeks 1-2", folder: "L0-sample", n: 4 },
  { id: "L1", title: "Sample level one", weeks: "Weeks 3-8", folder: "L1-sample", n: 10 },
  { id: "L2", title: "Sample level two", weeks: "Weeks 9-15", folder: "L2-sample", n: 12 },
  { id: "L3", title: "Sample level three", weeks: "Weeks 16-20", folder: "L3-sample", n: 8 },
];
const pad = (n: number) => String(n).padStart(2, "0");
const lessons = levels.flatMap((l) =>
  Array.from({ length: l.n }, (_, i) => {
    const id = `${l.id}-${pad(i + 1)}`;
    const free = l.id === "L0";
    return {
      id, level: l.id, number: i + 1, slug: `sample-lesson-${id.toLowerCase()}`,
      title: `Sample lesson ${i + 1} of ${l.title.toLowerCase()}`, minutes: 20 + i, summary: `Invented summary for sample lesson ${i + 1}.`,
      objectives: ["Sample objective one", "Sample objective two"],
      feature: free ? "free" : "lessons.paid", audio_feature: free ? "free" : "audio.paid",
      decks: {
        lecture: { id, slides: 20, clips: 24, duration_seconds: 600.5 },
        conversation: { id: `${id}-talk`, slides: 20, clips: 90, duration_seconds: 640.2 },
      },
    };
  }),
);
const labs = [
  ["L0-sample-lab", "L0", ["L0-04"], ["L0/sample.py", "L0/sample.csv"]],
  ["L1-sample-lab", "L1", ["L1-01", "L1-06"], ["common/sample_client.py"]],
  ["L2-sample-lab", "L2", ["L2-03"], ["L2/sample/__init__.py", "L2/sample/graders.py"]],
  ["L3-sample-lab", "L3", ["L3-03"], ["L3/sample/__init__.py"]],
].map(([id, level, ls, paths]) => ({
  id, level, title: `Sample lab ${id}`, lessons: ls, files: (paths as string[]).length, size_bytes: 4096, paths, feature: "practice.labs",
}));
const catalog = {
  schema_version: 1,
  course: { id: "ai-product-testing", title: "AI Product Testing" },
  features: [
    { id: "free", description: "Open to everyone" },
    { id: "lessons.paid", description: "Sample paid lessons" },
    { id: "audio.paid", description: "Sample paid audio" },
    { id: "practice.labs", description: "Sample labs" },
  ],
  tiers_example: { free: ["free"], base: ["free", "lessons.paid", "audio.paid"], higher: ["free", "lessons.paid", "audio.paid", "practice.labs"] },
  levels: levels.map((l) => ({ id: l.id, title: l.title, weeks: l.weeks, folder: l.folder, lessons: lessons.filter((x) => x.level === l.id).map((x) => x.id) })),
  lessons,
  labs,
};
writeFileSync("src/lib/course/fixtures/catalog.json", JSON.stringify(catalog, null, 1) + "\n");
console.log(`lessons ${lessons.length}, labs ${labs.length}`);
