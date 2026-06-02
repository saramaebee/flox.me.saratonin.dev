import { stats } from "./graphData.ts";

export interface Step {
  key: string;
  command: string; // terminal-style command shown for the step
  title: string;
  caption: string;
  takeaway: string; // the Flox-relevant payoff
}

export const steps: Step[] = [
  {
    key: "package-json",
    command: "$ cat package.json",
    title: "You declare a handful of dependencies",
    caption:
      "Six direct dependencies. A few lines of JSON. This is the entire surface you actually chose and reviewed.",
    takeaway:
      "package.json is the part you chose and reviewed. It's necessary, but it's only the surface of what actually ships.",
  },
  {
    key: "resolve",
    command: "$ npm install  # resolving…",
    title: "npm resolves the dependency graph",
    caption:
      "Each dependency has its own dependencies. The resolver walks the registry, picking versions that satisfy every range.",
    takeaway:
      "Version ranges (^, ~) let npm resolve compatible code when the tree is first created or updated. That's convenient, and one more thing to lock before it is reproducible.",
  },
  {
    key: "explode",
    command: "$ ls node_modules | wc -l",
    title: "Transitive dependencies explode",
    caption: `Those six declarations pulled in ${stats.total - 1} packages across ${stats.maxDepth} levels of depth. Almost none of them were chosen by a human.`,
    takeaway:
      "The tree npm builds is real and necessary, and far larger than the handful of names you reviewed.",
  },
  {
    key: "vulnerability",
    command: "$ npm audit",
    title: "A vulnerability enters the tree",
    caption:
      "event-stream@3.3.6: a compromised transitive dependency buried several levels deep. You never installed it directly; something you depend on did.",
    takeaway:
      "The 2018 event-stream attack worked exactly this way. Dependencies buried this deep are easy to miss, whatever their quality.",
  },
  {
    key: "sbom",
    command: "$ syft . -o cyclonedx-json",
    title: "Generate an SBOM",
    caption:
      "A Software Bill of Materials catalogs every component, version, and relationship, in a standard format like CycloneDX or SPDX.",
    takeaway:
      "You can't secure what you can't enumerate. The SBOM is the inventory.",
  },
  {
    key: "provenance",
    command: "$ cosign verify-attestation …",
    title: "Verify provenance",
    caption: `Provenance asks: where did each artifact actually come from, and can we prove it? In this graph, ${stats.unsigned} packages have no verifiable signature or attestation available to this workflow.`,
    takeaway:
      "An SBOM tells you what's there. Provenance tells you whether to trust it.",
  },
  {
    key: "lockfile",
    command: "$ npm ci  # from package-lock.json",
    title: "The lockfile pins the tree, as far as npm reaches",
    caption:
      "package-lock.json records the exact resolved tree, and npm ci installs from it without re-resolving versions. That largely solves reproducibility for the JavaScript package graph.",
    takeaway:
      "npm already locks its own world well. The open question is everything that world runs inside.",
  },
  {
    key: "environment",
    command: "$ node -v && openssl version && cc --version",
    title: "The environment is bigger than node_modules",
    caption:
      "The lockfile says nothing about the Node runtime, OpenSSL, Python, the C/C++ toolchain, system libraries, the CI image, or the OS and architecture. Change any of them and the same locked tree can build, or break, differently.",
    takeaway:
      "node_modules is the inner circle. The things that install, build, and run it sit outside the lockfile's reach.",
  },
  {
    key: "reproducible",
    command: "$ flox activate",
    title: "The reproducible environment around npm",
    caption:
      "npm resolves your JavaScript dependency graph. Flox makes the entire environment that installs, builds, tests, and runs it reproducible: Node, system packages, toolchains, CI, and runtime included.",
    takeaway:
      "package-lock.json locks the dependency tree. Flox locks the environment it runs in.",
  },
];

export const STEP = Object.fromEntries(
  steps.map((s, i) => [s.key, i]),
) as Record<(typeof steps)[number]["key"], number>;
export const LAST_STEP = steps.length - 1;
