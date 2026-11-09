// Local stand-in for https://media.fayazlabs.com: builds SYNTHETIC fixtures in the real layout and
// serves them cross-origin (CORS) like the CDN. Also: L0-03 is "not published" (404) and
// L0-04/lesson.html answers 503 twice before succeeding (retry path).
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { makeLessonFixture } from "../../tests/fixtures/make-lesson";

const root = path.resolve(__dirname, "../../.tmp-fixture");
const demoKey = createHash("sha256").update("synthetic-demo-key").digest();
const paid = makeLessonFixture({ outDir: root, itemId: "L2-05", paid: true, slides: 10, cueSeconds: 1.875, quizSlide: 2, fixedKey: demoKey });
makeLessonFixture({ outDir: root, itemId: "L0-02", paid: false, slides: 4, cueSeconds: 1.5, quizSlide: 2 });
makeLessonFixture({ outDir: root, itemId: "L0-04", paid: false, slides: 3, cueSeconds: 1, fixedKey: demoKey });
const port = Number(process.env.FIXTURE_PORT ?? 4100);
let l004Hits = 0;

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "*");
    if (url.pathname === "/__key") return void res.end(paid.keyB64);
    if (url.pathname === "/L0-04/lesson.html" && l004Hits++ < 2) {
      res.statusCode = 503;
      return void res.end("busy");
    }
    const file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      return void res.end("not found");
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.end(readFileSync(file));
  })
  .listen(port, () => console.log(`fixture server on ${port}`));
