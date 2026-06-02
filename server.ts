// Dev server: serves the single-page app with HMR via Bun's HTML imports.
// Hash routing means every path resolves to the same document.
import index from "./src/index.html";

const PORT = Number(Bun.env.PORT ?? 5599);

const server = Bun.serve({
  port: PORT,
  routes: {
    "/*": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`\n  flox.me.saratonin.dev  →  ${server.url}\n`);
