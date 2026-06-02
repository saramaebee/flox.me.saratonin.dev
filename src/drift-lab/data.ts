// Static data for the Local-to-CI Drift Lab.
//
// The model is deliberately simple and deterministic: a green baseline where all
// three environments agree on every field, plus a set of drift scenarios that
// layer field-level overrides onto specific environments. Toggling scenarios
// recomputes the columns; "Reproducible Environment Mode" pins the touched
// fields back into alignment (see model.ts).
//
// Honesty rules (matching the rest of this site): scenarios describe real,
// recognizable failure modes, and we distinguish drift that reproducibility
// *fully resolves* from assumptions it only makes *explicit* (a missing secret
// still needs a value — pinning the contract doesn't invent the secret).

export type EnvKey = "local" | "ci" | "prod";

export type FieldKey =
  | "node"
  | "python"
  | "os"
  | "arch"
  | "openssl"
  | "syspkgs"
  | "lockfile"
  | "envvars"
  | "cuda";

/** A single environment assumption. `implicit` = inherited from the host / not
 *  declared anywhere; `false` = pinned in a shared, versioned definition. */
export interface FieldValue {
  value: string;
  implicit: boolean;
}

export interface Environment {
  key: EnvKey;
  name: string;
  role: string;
  /** A theme.css token name driving the column accent. */
  accent: string;
  fields: Record<FieldKey, FieldValue>;
}

export type Severity = "warning" | "failing";
export type Category = "runtime" | "syslib" | "platform" | "deps" | "config" | "gpu";

export interface Scenario {
  id: string;
  title: string;
  category: Category;
  /** One-line framing shown on the toggle. */
  description: string;
  severity: Severity;
  /** Columns that go warning/failing when this scenario is active. */
  affected: EnvKey[];
  /** Rows to flag as the drift surface (drives row highlighting). */
  conflictFields: FieldKey[];
  symptom: string;
  rootCause: string;
  teamImpact: string;
  reproducibleFix: string;
  /** Field overrides layered onto the baseline when active. */
  overrides: Partial<Record<EnvKey, Partial<Record<FieldKey, FieldValue>>>>;
  /** Does repro mode fully resolve the drift, or only make the assumption
   *  explicit (still requiring a supplied value)? */
  reproResolves: "full" | "explicit";
  /** The single pinned value repro mode normalizes the conflict fields to. */
  pinned: Partial<Record<FieldKey, string>>;
}

export const FIELD_LABELS: Record<FieldKey, string> = {
  node: "Node",
  python: "Python",
  os: "OS",
  arch: "Architecture",
  openssl: "OpenSSL",
  syspkgs: "System packages",
  lockfile: "Lockfile",
  envvars: "Environment vars",
  cuda: "CUDA toolkit",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  runtime: "Runtime versions",
  syslib: "System libraries",
  platform: "OS / architecture",
  deps: "Dependencies & lockfile",
  config: "Config & secrets",
  gpu: "GPU toolchain",
};

/** The order fields render in each column. `cuda` is shown only when a gpu
 *  scenario is active (handled in the page). */
export const FIELD_ORDER: FieldKey[] = [
  "node",
  "python",
  "os",
  "arch",
  "openssl",
  "syspkgs",
  "lockfile",
  "envvars",
  "cuda",
];

const f = (value: string, implicit = true): FieldValue => ({ value, implicit });

// ---- baseline: all three environments agree, everything green --------------

export const baseline: Environment[] = [
  {
    key: "local",
    name: "Local Laptop",
    role: "Where the code is written",
    accent: "--color-blue",
    fields: {
      node: f("20.11.1"),
      python: f("3.12.2"),
      os: f("macOS 14"),
      arch: f("arm64"),
      openssl: f("3.0.13"),
      syspkgs: f("libpq, libjpeg present"),
      lockfile: f("in sync"),
      envvars: f("DATABASE_URL set"),
      cuda: f("none"),
    },
  },
  {
    key: "ci",
    name: "CI Runner",
    role: "Where it's verified",
    accent: "--color-orange",
    fields: {
      node: f("20.11.1"),
      python: f("3.12.2"),
      os: f("Ubuntu 22.04"),
      arch: f("x86_64"),
      openssl: f("3.0.13"),
      syspkgs: f("libpq, libjpeg present"),
      lockfile: f("in sync"),
      envvars: f("DATABASE_URL set"),
      cuda: f("none"),
    },
  },
  {
    key: "prod",
    name: "Production-like Build",
    role: "Where it ships from",
    accent: "--node-repro",
    fields: {
      node: f("20.11.1"),
      python: f("3.12.2"),
      os: f("Ubuntu 22.04"),
      arch: f("x86_64"),
      openssl: f("3.0.13"),
      syspkgs: f("libpq, libjpeg present"),
      lockfile: f("in sync"),
      envvars: f("DATABASE_URL set"),
      cuda: f("none"),
    },
  },
];

// ---- drift scenarios -------------------------------------------------------

export const scenarios: Scenario[] = [
  {
    id: "node-mismatch",
    title: "Node 18 local, Node 20 in CI",
    category: "runtime",
    description: "The laptop is a major version behind the runner.",
    severity: "failing",
    affected: ["ci"],
    conflictFields: ["node"],
    symptom:
      "Code passes locally, then CI fails on a syntax or API the older local Node accepted but the newer one rejects, or the reverse.",
    rootCause:
      "Node isn't pinned. The laptop runs whatever nvm last selected; CI runs whatever the runner image ships. Two implicit defaults, two behaviors.",
    teamImpact:
      "Red CI on a green local branch. The author re-runs, bisects, and eventually upgrades Node by hand. An hour gone, and the next teammate hits it too.",
    reproducibleFix:
      "Pin the Node version as a declared input so the laptop and the runner resolve the identical interpreter.",
    overrides: {
      local: { node: f("18.19.0") },
    },
    reproResolves: "full",
    pinned: { node: "20.11.1" },
  },
  {
    id: "python-mismatch",
    title: "Python 3.10 local, 3.12 in CI",
    category: "runtime",
    description: "Different interpreters resolve different wheels.",
    severity: "failing",
    affected: ["ci"],
    conflictFields: ["python"],
    symptom:
      "A dependency that ships a 3.12 wheel builds from source on 3.10 (or pulls a different resolved version), and the test suite diverges between machines.",
    rootCause:
      "The Python on PATH is the host default, not a pinned interpreter. Wheel selection, ABI tags, and even stdlib behavior shift with the minor version.",
    teamImpact:
      "\"Works on my machine\" in its purest form. Diagnosis is slow because the code is identical; only the interpreter underneath it isn't.",
    reproducibleFix:
      "Pin the exact CPython version as a shared input; the resolver picks the same wheels everywhere.",
    overrides: {
      local: { python: f("3.10.13") },
    },
    reproResolves: "full",
    pinned: { python: "3.12.2" },
  },
  {
    id: "openssl-mismatch",
    title: "OpenSSL 1.1 vs OpenSSL 3",
    category: "syslib",
    description: "A system library the lockfile never mentions.",
    severity: "failing",
    affected: ["local"],
    conflictFields: ["openssl"],
    symptom:
      "TLS handshakes, signing, or hashing behave differently: legacy ciphers are unavailable, or a library linked against 1.1 won't load against 3.",
    rootCause:
      "OpenSSL is a system library below the package manager. Your lockfile pins the Python/Node bindings but not the C library they link against.",
    teamImpact:
      "A whole class of \"it's not in the lockfile so it must be the same\" bugs. Hard to spot, easy to blame on application code.",
    reproducibleFix:
      "Bring system libraries like OpenSSL into the same pinned definition as the language packages: one lock for both layers.",
    overrides: {
      local: { openssl: f("1.1.1w") },
    },
    reproResolves: "full",
    pinned: { openssl: "3.0.13" },
  },
  {
    id: "arch-mismatch",
    title: "Apple Silicon local, x86 CI",
    category: "platform",
    description: "arm64 laptop, x86_64 runner.",
    severity: "warning",
    affected: ["local", "ci"],
    conflictFields: ["arch"],
    symptom:
      "An arm64-only wheel installs locally but is missing on x86 (or vice versa); native extensions get rebuilt, and timing-sensitive or float-sensitive output differs.",
    rootCause:
      "The architecture is whatever each machine happens to be. Wheels, prebuilt binaries, and emulation paths all branch on it implicitly.",
    teamImpact:
      "Drift that only appears in CI or only in prod. Reproducing it locally requires emulation nobody has set up, so it lingers.",
    reproducibleFix:
      "Make the target architecture(s) an explicit, declared dimension so each environment resolves the right artifacts on purpose.",
    overrides: {
      ci: { arch: f("x86_64 (no arm64 wheel)") },
    },
    reproResolves: "full",
    pinned: { arch: "declared per target" },
  },
  {
    id: "missing-native-pkg",
    title: "Missing native package (libpq)",
    category: "syslib",
    description: "The Postgres client headers aren't installed.",
    severity: "failing",
    affected: ["ci"],
    conflictFields: ["syspkgs"],
    symptom:
      "`pg_config executable not found`: psycopg fails to build from source because libpq and its headers aren't present on the runner.",
    rootCause:
      "Native system packages are assumed to be there. They are on the laptop (installed long ago, forgotten) but not on a clean CI image.",
    teamImpact:
      "Onboarding and CI both stall on a dependency nobody documented because it was already on the machine that wrote the README.",
    reproducibleFix:
      "Declare native packages (libpq, libjpeg, imagemagick…) as inputs alongside the language deps, so a clean machine has them by construction.",
    overrides: {
      ci: { syspkgs: f("libpq MISSING") },
    },
    reproResolves: "full",
    pinned: { syspkgs: "libpq, libjpeg declared" },
  },
  {
    id: "stale-lockfile",
    title: "Stale package lockfile",
    category: "deps",
    description: "The lockfile drifted from the manifest.",
    severity: "warning",
    affected: ["local"],
    conflictFields: ["lockfile"],
    symptom:
      "Local has packages the lockfile doesn't record; a fresh install in CI resolves different transitive versions, and a bug appears that no one can reproduce locally.",
    rootCause:
      "Someone installed a package without committing the updated lock, or installed outside the locked set. The local tree no longer matches the declared one.",
    teamImpact:
      "The dependency graph silently differs across machines, exactly the condition that makes SBOMs and audits untrustworthy.",
    reproducibleFix:
      "Treat the lock as authoritative and reject out-of-band installs; every environment materializes the same recorded graph.",
    overrides: {
      local: { lockfile: f("ahead of manifest") },
    },
    reproResolves: "full",
    pinned: { lockfile: "frozen, authoritative" },
  },
  {
    id: "missing-secret",
    title: "Missing DATABASE_URL / API key",
    category: "config",
    description: "A required env var isn't set in CI.",
    severity: "failing",
    affected: ["ci"],
    conflictFields: ["envvars"],
    symptom:
      "The app boots locally and crashes in CI at startup: a connection string or API key is undefined, so the first call that needs it throws.",
    rootCause:
      "Required configuration lives only in the developer's shell. It was never declared as something the environment must provide, so CI has no idea it's missing.",
    teamImpact:
      "A failure that looks like a code bug but is a configuration gap. Time is lost looking in the wrong place entirely.",
    reproducibleFix:
      "Declare the required variables as part of the environment contract: names, where they come from, and that they're mandatory. Reproducibility makes the requirement explicit; it does not (and should not) supply the secret value itself.",
    overrides: {
      ci: { envvars: f("DATABASE_URL UNSET") },
    },
    reproResolves: "explicit",
    pinned: { envvars: "DATABASE_URL declared (required)" },
  },
  {
    id: "cuda-mismatch",
    title: "CUDA toolkit mismatch",
    category: "gpu",
    description: "CUDA 11.8 local, 12.x in prod.",
    severity: "failing",
    affected: ["local", "prod"],
    conflictFields: ["cuda"],
    symptom:
      "A model that trains locally fails to load in the production-like build: the framework was built against one CUDA version and the driver/runtime present is another.",
    rootCause:
      "The GPU toolchain is sourced from whatever the machine or base image carries. CUDA, cuDNN, and the framework build must agree. Nothing pins them together.",
    teamImpact:
      "The most expensive class of drift: GPU time wasted on environment debugging instead of training, and a deploy that can't run the artifact it was handed.",
    reproducibleFix:
      "Pin the CUDA toolchain version alongside the framework so the build target and the runtime agree by construction.",
    overrides: {
      local: { cuda: f("11.8") },
      ci: { cuda: f("12.2") },
      prod: { cuda: f("12.2") },
    },
    reproResolves: "full",
    pinned: { cuda: "12.2 (pinned)" },
  },
  {
    id: "build-vs-runtime",
    title: "Build-time ≠ runtime dependency",
    category: "deps",
    description: "Compiled against one version, run against another.",
    severity: "warning",
    affected: ["prod"],
    conflictFields: ["syspkgs"],
    symptom:
      "A native module links against the libjpeg present at build time, but the production-like image ships a different soname: it loads, then segfaults or returns subtly different bytes.",
    rootCause:
      "The build environment and the runtime environment are assembled separately. The version present when compiling isn't guaranteed to be the version present when running.",
    teamImpact:
      "Drift you can't see in a diff and can barely see in a log: the same input can produce a different output, which quietly undermines provenance.",
    reproducibleFix:
      "Use one pinned definition for both build and run so the library compiled against is the library executed against.",
    overrides: {
      prod: { syspkgs: f("libjpeg soname differs") },
    },
    reproResolves: "full",
    pinned: { syspkgs: "libpq, libjpeg declared" },
  },
];

export const scenarioById = (id: string): Scenario | undefined =>
  scenarios.find((s) => s.id === id);

/** Scenarios grouped by category, preserving declaration order. */
export function scenariosByCategory(): Array<{ category: Category; items: Scenario[] }> {
  const order: Category[] = ["runtime", "syslib", "platform", "deps", "config", "gpu"];
  return order
    .map((category) => ({
      category,
      items: scenarios.filter((s) => s.category === category),
    }))
    .filter((g) => g.items.length > 0);
}
