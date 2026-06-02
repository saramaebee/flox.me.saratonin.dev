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
      "What you wrote down is never what you ship. The gap between the two is the supply chain.",
  },
  {
    key: "resolve",
    command: "$ npm install  # resolving…",
    title: "npm resolves the dependency graph",
    caption:
      "Each dependency has its own dependencies. The resolver walks the registry, picking versions that satisfy every range.",
    takeaway:
      "Version ranges (^, ~) mean the exact code you get is decided at install time — not by you.",
  },
  {
    key: "explode",
    command: "$ ls node_modules | wc -l",
    title: "Transitive dependencies explode",
    caption: `Those six declarations pulled in ${stats.total - 1} packages across ${stats.maxDepth} levels of depth. Almost none of them were chosen by a human.`,
    takeaway:
      "Your real attack surface is the whole tree — not the names in package.json.",
  },
  {
    key: "vulnerability",
    command: "$ npm audit",
    title: "A vulnerability enters the tree",
    caption:
      "event-stream@3.3.6 — a compromised transitive dependency buried several levels deep. You never installed it directly; something you depend on did.",
    takeaway:
      "The 2018 event-stream attack worked exactly this way. Depth hides risk.",
  },
  {
    key: "sbom",
    command: "$ syft . -o cyclonedx-json",
    title: "Generate an SBOM",
    caption:
      "A Software Bill of Materials catalogs every component, version, and relationship — in a standard format like CycloneDX or SPDX.",
    takeaway:
      "You can't secure what you can't enumerate. The SBOM is the inventory.",
  },
  {
    key: "provenance",
    command: "$ cosign verify-attestation …",
    title: "Verify provenance",
    caption: `Provenance asks: where did each artifact actually come from, and can we prove it? ${stats.unsigned} packages here ship no verifiable signature.`,
    takeaway:
      "An SBOM tells you what's there. Provenance tells you whether to trust it.",
  },
  {
    key: "reproducible",
    command: "$ flox activate",
    title: "The reproducible alternative",
    caption:
      "Pin every package to an exact, content-addressed version. The same locked graph builds bit-for-bit on every machine — drift, and the gap between declared and installed, simply close.",
    takeaway:
      "Secure software by construction: reproducibility isn't a report you run after — it's a property you build in.",
  },
];

export const LAST_STEP = steps.length - 1;
