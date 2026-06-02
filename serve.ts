// Static preview server for the production build in ./public.
// Verifies the GitHub-Pages-style static deploy works end to end.
import { join, normalize } from "node:path";

const ROOT = join(import.meta.dir, "public");
const PORT = Number(Bun.env.PORT ?? 5600);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/" || pathname === "") pathname = "/index.html";

    // Resolve within ROOT; fall back to index.html for client-side routes.
    const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    let file = Bun.file(join(ROOT, safe));
    if (!(await file.exists())) {
      file = Bun.file(join(ROOT, "index.html"));
    }
    return new Response(file);
  },
});

console.log(`\n  serving ./public  →  http://localhost:${PORT}\n`);
