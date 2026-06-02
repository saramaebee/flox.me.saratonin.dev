// Single source of truth for the "Same App, Three Environments" page.
//
// The measured numbers are imported from the runnable demo's benchmark output
// (three-ways/bench/results/results.json) so the article and the repo can never
// disagree. The qualitative comparison data (failure modes, drift points) is
// authored here and labeled observed vs. reasoned, matching the honesty rules
// the demo itself follows.

import results from "../../three-ways/bench/results/results.json";

export type ApproachKey = "native" | "docker" | "flox";
export type Rating = "bad" | "mixed" | "good";

export interface Approach {
  key: ApproachKey;
  label: string;
  blurb: string;
  /** A theme.css token name driving the column accent. */
  accent: string;
}

export const approaches: Approach[] = [
  {
    key: "native",
    label: "Native",
    blurb: "Set up directly on the host. Fast, familiar, and entirely implicit.",
    accent: "--node-vuln",
  },
  {
    key: "docker",
    label: "Docker",
    blurb: "Package the app in an image. Fixes shipping; leaves the dev shell behind.",
    accent: "--color-orange",
  },
  {
    key: "flox",
    label: "Flox",
    blurb: "One declarative manifest for the runtime, the libs, and the database.",
    accent: "--node-repro",
  },
];

// ---- the benchmark numbers, re-exported typed -----------------------------

export interface Provenance {
  measured_at: string;
  os: string;
  arch: string;
  host_python: string;
  note: string;
}

export const provenance: Provenance = results.provenance;
export const timings = results.timings;
export const drift = results.drift;

// ---- comparison table -----------------------------------------------------

export interface Cell {
  value: string;
  rating: Rating;
  note?: string;
}

export interface ComparisonRow {
  key: string;
  dimension: string;
  why: string;
  cells: Record<ApproachKey, Cell>;
}

const t = results.timings;

export const comparisonRows: ComparisonRow[] = [
  {
    key: "setup",
    dimension: "First-run setup",
    why: "How much has to go right before the app starts on a clean machine.",
    cells: {
      native: { value: "many manual steps", rating: "bad", note: "brew/apt + pyenv + libs + DB + an env-var dance; nothing scripted end-to-end." },
      docker: { value: `${t.docker.cold_build_s}s cold`, rating: "mixed", note: `Cached rebuild ${t.docker.warm_build_s}s. One command, but a separate Dockerfile to maintain.` },
      flox: { value: `${t.flox.cold_activate_s}s cold`, rating: "good", note: `Warm activate ${t.flox.warm_activate_s}s. \`flox activate --start-services\` brings up app + DB.` },
    },
  },
  {
    key: "runtime",
    dimension: "Runtime version",
    why: "Is the Python the app runs on actually pinned?",
    cells: {
      native: { value: "host default", rating: "bad", note: `Drifts per machine — this host's python3 is ${provenance.host_python}, not the pinned 3.12.` },
      docker: { value: "base image", rating: "mixed", note: "Pinned if you pin the digest; `python:3.12-slim` moves otherwise." },
      flox: { value: "manifest-pinned", rating: "good", note: "python312 resolved from one lockfile across all four systems." },
    },
  },
  {
    key: "syslibs",
    dimension: "System libraries",
    why: "libpq, OpenSSL, libjpeg — the things package pins don't cover.",
    cells: {
      native: { value: "unpinned", rating: "bad", note: "Whatever brew/apt last installed; the source of the env-var dance." },
      docker: { value: "base + apt", rating: "mixed", note: "Pinned inside the image, but duplicated from the host setup knowledge." },
      flox: { value: "pinned", rating: "good", note: "Same lock as the runtime; pip needs no LDFLAGS/PKG_CONFIG_PATH." },
    },
  },
  {
    key: "database",
    dimension: "Database",
    why: "Where Postgres comes from and who starts it.",
    cells: {
      native: { value: "install yourself", rating: "bad", note: "brew services / systemctl, created roles, hope the version matches." },
      docker: { value: "compose service", rating: "good", note: "`db` service with a healthcheck — a real strength of the Docker path." },
      flox: { value: "declared service", rating: "good", note: "`postgres` service in the manifest; no separate install." },
    },
  },
  {
    key: "parity",
    dimension: "Dev shell = prod",
    why: "Is the environment you code in the one you ship?",
    cells: {
      native: { value: "n/a", rating: "bad", note: "No prod artifact; every laptop is its own environment." },
      docker: { value: "no", rating: "bad", note: "Your editor/LSP/psql run on the host against a different Python and libpq than the container." },
      flox: { value: "yes", rating: "good", note: `\`flox containerize\` renders the dev shell as an OCI image (${t.flox.container_size}) — same lock.` },
    },
  },
  {
    key: "artifact",
    dimension: "Same input → same output",
    why: "Does the identical app produce the identical artifact across environments?",
    cells: {
      native: { value: "no guarantee", rating: "bad", note: "Output depends on whatever system libs happen to be installed." },
      docker: { value: "differs from native", rating: "mixed", note: `Docker's libjpeg decoded sample.jpg to sha256 ${drift.docker_sha256.slice(0, 12)}…` },
      flox: { value: "pinned & shareable", rating: "good", note: `Flox's libjpeg produced sha256 ${drift.flox_sha256.slice(0, 12)}… — different bytes, same code.` },
    },
  },
];

// ---- drift diagram --------------------------------------------------------

export type Exposure = "exposed" | "partial" | "controlled";

export interface DriftPoint {
  key: string;
  label: string;
  /** 0 = closest to the app, higher = closer to the hardware. */
  layer: number;
  description: string;
  exposure: Record<ApproachKey, Exposure>;
}

export const driftPoints: DriftPoint[] = [
  {
    key: "runtime",
    label: "Language runtime",
    layer: 0,
    description: "Which Python actually runs the code.",
    exposure: { native: "exposed", docker: "partial", flox: "controlled" },
  },
  {
    key: "pkgmgr",
    label: "Package resolution",
    layer: 1,
    description: "Which exact dependency versions get installed.",
    exposure: { native: "partial", docker: "partial", flox: "controlled" },
  },
  {
    key: "syslibs",
    label: "System libraries",
    layer: 2,
    description: "libpq, OpenSSL, libjpeg the extensions link against.",
    exposure: { native: "exposed", docker: "partial", flox: "controlled" },
  },
  {
    key: "shell",
    label: "Shell & env vars",
    layer: 3,
    description: "PATH, PKG_CONFIG_PATH, LDFLAGS — the setup dance.",
    exposure: { native: "exposed", docker: "controlled", flox: "controlled" },
  },
  {
    key: "os",
    label: "Operating system",
    layer: 4,
    description: "macOS vs. Linux distro and version.",
    exposure: { native: "exposed", docker: "controlled", flox: "partial" },
  },
  {
    key: "arch",
    label: "CPU architecture",
    layer: 5,
    description: "arm64 vs. x86_64 wheels and emulation.",
    exposure: { native: "exposed", docker: "partial", flox: "controlled" },
  },
  {
    key: "ci-local",
    label: "CI vs. local",
    layer: 6,
    description: "Does the build machine match the laptop?",
    exposure: { native: "exposed", docker: "partial", flox: "controlled" },
  },
  {
    key: "security",
    label: "Security visibility",
    layer: 7,
    description: "Can tooling enumerate the real dependency graph?",
    exposure: { native: "exposed", docker: "partial", flox: "controlled" },
  },
];

/** Count of drift points each approach leaves un-controlled. Drives the table cross-check. */
export function driftSurface(approach: ApproachKey): number {
  return driftPoints.filter((p) => p.exposure[approach] !== "controlled").length;
}

// ---- failure matrix -------------------------------------------------------

export type Observed = "observed" | "reasoned";

export interface FailureMode {
  key: string;
  symptom: string;
  rootCause: string;
  /** True where the approach is exposed to this failure. */
  affects: Record<ApproachKey, boolean>;
  /** Whether we ran into this on hardware, or reasoned it from the mechanism. */
  evidence: Observed;
}

export const failureMatrix: FailureMode[] = [
  {
    key: "py-drift",
    symptom: "Wrong Python version / ABI mismatch",
    rootCause: "Host default isn't the pinned interpreter",
    affects: { native: true, docker: false, flox: false },
    evidence: "observed", // host python3 is 3.14.2, app pins 3.12
  },
  {
    key: "pg-config",
    symptom: "`pg_config executable not found`",
    rootCause: "libpq not on PATH when psycopg builds from source",
    affects: { native: true, docker: false, flox: false },
    evidence: "reasoned",
  },
  {
    key: "rust",
    symptom: "`Can not find Rust compiler`",
    rootCause: "cryptography builds from source with no wheel",
    affects: { native: true, docker: false, flox: false },
    evidence: "reasoned",
  },
  {
    key: "jpeg",
    symptom: "jpeg/zlib headers not found",
    rootCause: "Pillow builds from source without libjpeg-dev",
    affects: { native: true, docker: false, flox: false },
    evidence: "reasoned",
  },
  {
    key: "artifact-drift",
    symptom: "Same input, different output hash",
    rootCause: "Different libjpeg decodes the image differently",
    affects: { native: true, docker: true, flox: false },
    evidence: "observed", // docker vs flox sha256 differ in results.json
  },
  {
    key: "dev-prod",
    symptom: "Works in the container, breaks in the editor",
    rootCause: "Dev shell isn't the shipped environment",
    affects: { native: true, docker: true, flox: false },
    evidence: "reasoned",
  },
];
