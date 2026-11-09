// Local stand-in for the content CDN: builds the synthetic fixture, then serves it with CORS.
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { makeLessonFixture } from "../../tests/fixtures/make-lesson";

const root = path.resolve(__dirname, "../../.tmp-fixture");
const fx = makeLessonFixture({ outDir: root, itemId: "L2-05", slides: 10, slideSeconds: 4, withQuiz: true });
const port = Number(process.env.FIXTURE_PORT ?? 4100);

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (url.pathname === "/__key") return void res.end(fx.keyB64);
    const file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      return void res.end("not found");
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.end(readFileSync(file));
  })
  .listen(port, () => console.log(`fixture server on ${port}`));
