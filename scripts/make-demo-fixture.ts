// Writes a SYNTHETIC encrypted lesson into public/course-media for local demos.
import { createHash } from "node:crypto";
import { makeLessonFixture } from "../tests/fixtures/make-lesson";
makeLessonFixture({ outDir: "public/course-media", itemId: "L2-05", slides: 10, slideSeconds: 4, withQuiz: true, fixedKey: createHash("sha256").update("synthetic-demo-key").digest() });
console.log("demo fixture written");
