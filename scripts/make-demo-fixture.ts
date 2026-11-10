// Writes SYNTHETIC lessons (real layout) into public/course-media for local demos (gitignored).
import { createHash } from "node:crypto";
import { makeLessonFixture } from "../tests/fixtures/make-lesson";
const fixedKey = createHash("sha256").update("synthetic-demo-key").digest();
makeLessonFixture({ outDir: "public/course-media", itemId: "L2-05", paid: true, slides: 10, cueSeconds: 1.875, quizSlide: 2, fixedKey });
makeLessonFixture({ outDir: "public/course-media", itemId: "L0-02", paid: false, slides: 4, cueSeconds: 1.5, quizSlide: 2 });
console.log("demo fixture written");
