# flox.me.saratonin.dev

**Making software supply chains understandable.** An interactive portfolio
microsite by Sara Beaudet — the flagship is a stepped D3 walkthrough of *what
actually happens when you run `npm install`*: transitive explosion, a
vulnerability buried deep in the tree, SBOM generation, provenance verification,
and the reproducible-by-construction alternative.

The site argues for reproducibility — so it's **built reproducibly**, inside a
Flox environment and a Nix flake. The artifact embodies the message.

## Stack

- **Bun** — runtime, bundler, dev server (no Vite/webpack/Node)
- **React 19 + D3** — the interactive dependency-graph visualization
- **Hash routing** — deploys as static files to a subdomain, no server rewrites
- **Flox + Nix** — reproducible dev environment and hermetic build

## Develop

The reproducible path (recommended) — everything pinned by Flox:

```bash
flox activate          # enters the env, installs JS deps on first run
bun run dev            # hot-reloading dev server at http://localhost:5599
```

Or with plain Bun if you already have it:

```bash
bun install
bun run dev
```

## Build

Three equivalent ways to produce the static site, in increasing hermeticity:

```bash
bun run build          # → ./public           (plain Bun bundler)
flox build site        # → ./result-site      (Flox-native, pinned toolchain)
nix build              # → ./result           (hermetic; node_modules is a FOD)
```

All three emit the same static `public/`-style output (hashed JS/CSS +
`index.html` + `CNAME`), ready for any static host.

> First `nix build`: the `node_modules` fixed-output derivation will report a
> hash mismatch. Copy the `got:` value into `outputHash` in `flake.nix` (it's
> seeded with `lib.fakeHash`). It only changes when `bun.lock` changes.

## Preview the production build

```bash
bun run build && bun run serve   # serves ./public at http://localhost:5600
```

## Deploy

Static files + `CNAME` → GitHub Pages on `flox.me.saratonin.dev` (same pattern
as `me.saratonin.dev`). Publish the contents of `public/` (or the `nix build`
`result/`).

## Project layout

```
src/
  index.html            entry; loads Geist + the three stylesheets
  main.tsx              React root + hash router
  router.tsx           useHashRoute / navigate
  data/content.ts      site copy + project metadata
  components/          Nav, Footer, ProjectGrid, ComingSoon
  pages/               Home, NpmInstall, DriftCalculator, ThreeWays
  styles/              theme.css (Flox tokens), global.css, viz.css, calc.css, threeways.css
  viz/                 the flagship
    graphData.ts        deterministic dependency tree (seeded PRNG)
    steps.ts            7-step narrative + Flox takeaways
    DependencyGraph.tsx D3 force layout, animated per step
    SbomPanel.tsx       CycloneDX-style component listing
    StepController.tsx  step state machine (buttons + ← → keys)
  three-ways/          "Same App, Three Environments" data + widgets
    data.ts             single source of truth (imports the benchmark JSON)
    components/         ComparisonTable, DriftDiagram, GtmPlaybook
three-ways/             runnable companion: ONE app, built three ways
  app/                  the shared FastAPI service (identical across builds)
  native/ docker/ flox/ the three procurement strategies
  bench/                measure.sh + results.json (observed numbers)
.flox/                  Flox environment (manifest pins bun; [build.site])
flake.nix               hermetic Nix build + dev shell
```

---

*An independent portfolio project — not affiliated with or endorsed by Flox.
Brand styling references flox.dev to demonstrate product-marketing fit.*
