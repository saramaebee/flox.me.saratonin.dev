// A deterministic, hand-seeded npm dependency tree. We grow a realistic-looking
// graph from a handful of direct dependencies out to a few hundred transitive
// nodes — the same "five lines of package.json, hundreds of packages" story
// every Node developer has lived. Determinism matters: the build is reproducible
// by construction, so the picture should be too.

export interface DepNode {
  id: string;
  name: string;
  version: string;
  depth: number;
  parentId: string | null;
  /** Step index at which this node first appears. */
  revealStep: number;
  /** The famous event-stream-style compromised transitive dep. */
  vulnerable: boolean;
  /** Whether this package ships verifiable provenance/signatures. */
  signed: boolean;
}

export interface DepLink {
  source: string;
  target: string;
}

// Small deterministic PRNG (mulberry32) so the tree is identical on every build.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x5ca1ab1e);

const DIRECT = [
  "react",
  "express",
  "webpack",
  "eslint",
  "jest",
  "typescript",
];

// Pool of plausible transitive package names.
const POOL = [
  "lodash", "chalk", "debug", "ms", "qs", "semver", "minimatch", "glob",
  "readable-stream", "inherits", "safe-buffer", "string_decoder", "util-deprecate",
  "ansi-styles", "color-convert", "color-name", "supports-color", "has-flag",
  "tslib", "regenerator-runtime", "object-assign", "loose-envify", "scheduler",
  "source-map", "acorn", "estraverse", "esutils", "esrecurse", "ajv",
  "json-schema-traverse", "fast-deep-equal", "uri-js", "punycode", "side-channel",
  "get-intrinsic", "call-bind", "function-bind", "has-symbols", "object-inspect",
  "braces", "fill-range", "to-regex-range", "is-number", "picomatch",
  "anymatch", "normalize-path", "is-glob", "is-extglob", "merge2",
  "fastq", "reusify", "run-parallel", "queue-microtask", "graceful-fs",
  "p-limit", "p-locate", "yocto-queue", "path-exists", "locate-path",
  "find-up", "pkg-dir", "resolve-from", "import-fresh", "parent-module",
  "cross-spawn", "shebang-command", "shebang-regex", "which", "isexe",
  "node-fetch", "whatwg-url", "tr46", "webidl-conversions", "data-urls",
  "yargs", "yargs-parser", "cliui", "wrap-ansi", "string-width",
  "strip-ansi", "ansi-regex", "emoji-regex", "is-fullwidth-code-point",
  "chokidar", "fsevents", "is-binary-path", "binary-extensions", "readdirp",
];

const nodes: DepNode[] = [];
const links: DepLink[] = [];

function ver() {
  return `${1 + Math.floor(rand() * 19)}.${Math.floor(rand() * 20)}.${Math.floor(rand() * 30)}`;
}

const root: DepNode = {
  id: "root",
  name: "your-app",
  version: "1.0.0",
  depth: 0,
  parentId: null,
  revealStep: 0,
  vulnerable: false,
  signed: true,
};
nodes.push(root);

let counter = 0;
const TARGET = 190;
const usedNames = new Set<string>();

function pick(): string {
  // Allow duplicates across branches (real trees dedupe by version, but the
  // visual point is volume), but vary the id.
  return POOL[Math.floor(rand() * POOL.length)];
}

function addChildren(parent: DepNode, count: number) {
  for (let i = 0; i < count; i++) {
    if (nodes.length >= TARGET) return;
    const name = parent.depth === 0 ? DIRECT[i] ?? pick() : pick();
    const id = `${name}@${++counter}`;
    const depth = parent.depth + 1;
    const node: DepNode = {
      id,
      name,
      version: ver(),
      depth,
      parentId: parent.id,
      // direct deps + root reveal at step 0, depth-2 at step 1, deeper at step 2
      revealStep: depth <= 1 ? 0 : depth === 2 ? 1 : 2,
      vulnerable: false,
      signed: true,
    };
    nodes.push(node);
    links.push({ source: parent.id, target: id });
    usedNames.add(name);

    // Fan-out shrinks with depth; some leaves.
    if (depth < 5) {
      const fan =
        depth === 1
          ? 3 + Math.floor(rand() * 4) // directs pull in 3-6
          : depth === 2
            ? 1 + Math.floor(rand() * 4)
            : Math.floor(rand() * 3);
      addChildren(node, fan);
    }
  }
}

addChildren(root, DIRECT.length);

// Assign provenance: deterministically mark ~22% of transitive deps as unsigned.
nodes.forEach((n, i) => {
  if (n.depth >= 1) n.signed = (i * 7) % 9 > 1;
});

// Plant the compromised dependency deep in the tree (the event-stream pattern):
// a transitive node nobody chose directly, buried several levels down.
const deep = nodes.filter((n) => n.depth >= 3 && n.parentId);
if (deep.length) {
  const victim = deep[Math.floor(rand() * deep.length)];
  victim.name = "event-stream";
  victim.version = "3.3.6";
  victim.vulnerable = true;
  victim.signed = false;
}

// Path from the vulnerable node back to the root — highlighted on the
// "a vulnerability enters" step to show how deep the blast radius reaches.
function pathToRoot(id: string): string[] {
  const path: string[] = [];
  let cur: DepNode | undefined = nodes.find((n) => n.id === id);
  while (cur) {
    path.push(cur.id);
    cur = cur.parentId ? nodes.find((n) => n.id === cur!.parentId) : undefined;
  }
  return path;
}

const vuln = nodes.find((n) => n.vulnerable);
export const vulnId = vuln?.id ?? null;
export const vulnPath: string[] = vuln ? pathToRoot(vuln.id) : [];

export const depNodes = nodes;
export const depLinks = links;

// The execution environment that lives *outside* node_modules — what the
// lockfile never describes. Rendered as fixed nodes on a ring around the JS
// tree, so the "environment is bigger than node_modules" step can show them
// sitting beyond npm's boundary.
export interface EnvNode {
  id: string;
  label: string;
  /** Position on the perimeter ring, in radians. */
  angle: number;
}

export const envNodes: EnvNode[] = [
  { id: "node", label: "Node runtime" },
  { id: "openssl", label: "OpenSSL" },
  { id: "python", label: "Python" },
  { id: "gcc", label: "C/C++ toolchain" },
  { id: "ci", label: "CI image" },
  { id: "os", label: "OS / arch" },
  { id: "runtime", label: "runtime" },
].map((e, i, a) => ({ ...e, angle: (i / a.length) * Math.PI * 2 - Math.PI / 2 }));

export const stats = {
  total: nodes.length,
  direct: DIRECT.length,
  maxDepth: nodes.reduce((m, n) => Math.max(m, n.depth), 0),
  unsigned: nodes.filter((n) => !n.signed).length,
};
