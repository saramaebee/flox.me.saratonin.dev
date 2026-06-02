// Deterministic simulation for the Drift Lab.
//
// Given a set of active scenario ids and the reproducible-mode flag, resolve the
// three environment columns: each field's value, whether it's implicit or pinned,
// its per-field state (aligned / drift / missing / pinned), and each column's
// overall status (passing / warning / failing). No randomness — same inputs
// always produce the same columns, so the page is a pure function of its toggles.

import {
  baseline,
  scenarioById,
  scenarios,
  type EnvKey,
  type FieldKey,
  type FieldValue,
  type Scenario,
} from "./data.ts";

export type EnvStatus = "passing" | "warning" | "failing";
export type FieldState = "aligned" | "drift" | "missing" | "pinned";

export interface ResolvedField extends FieldValue {
  key: FieldKey;
  state: FieldState;
  /** True when an active scenario flags this field as part of its drift surface. */
  conflict: boolean;
}

export interface ResolvedEnv {
  key: EnvKey;
  name: string;
  role: string;
  accent: string;
  status: EnvStatus;
  fields: ResolvedField[];
}

export interface SummaryStats {
  passing: number;
  warning: number;
  failing: number;
  /** Number of (env, field) cells that are still implicit. */
  implicitCells: number;
  /** Number of (env, field) cells that are pinned (repro mode). */
  pinnedCells: number;
  /** Distinct fields currently drifting across columns. */
  driftingFields: number;
}

const STATUS_RANK: Record<EnvStatus, number> = { passing: 0, warning: 1, failing: 2 };

/** Active scenarios, in declaration order (stable, deterministic). */
export function activeScenarios(activeIds: string[]): Scenario[] {
  const set = new Set(activeIds);
  return scenarios.filter((s) => set.has(s.id));
}

/** A field is "missing" if its value reads as absent/unset; the data encodes
 *  that in caps words (MISSING / UNSET). Kept as a small heuristic so the data
 *  stays human-readable rather than carrying a redundant state enum. */
function isMissingValue(value: string): boolean {
  return /\b(MISSING|UNSET)\b/.test(value);
}

export interface ResolveResult {
  envs: ResolvedEnv[];
  stats: SummaryStats;
  /** Fields that differ across the three columns (drives diff badges). */
  drift: Record<FieldKey, boolean>;
}

export function resolveEnvironments(
  activeIds: string[],
  reproMode: boolean,
): ResolveResult {
  const active = activeScenarios(activeIds);

  // 1. Layer field overrides onto the baseline (last-wins on field conflicts).
  //    `value` map: env -> field -> FieldValue (only for overridden fields).
  const overridden: Record<EnvKey, Partial<Record<FieldKey, FieldValue>>> = {
    local: {},
    ci: {},
    prod: {},
  };
  for (const s of active) {
    for (const env of Object.keys(s.overrides) as EnvKey[]) {
      Object.assign(overridden[env], s.overrides[env]);
    }
  }

  // 2. In repro mode, every field any active scenario touches is normalized to a
  //    single pinned value across all three columns.
  const pinnedValue: Partial<Record<FieldKey, string>> = {};
  const conflictFields = new Set<FieldKey>();
  for (const s of active) {
    for (const cf of s.conflictFields) conflictFields.add(cf);
    if (reproMode) {
      for (const [field, val] of Object.entries(s.pinned) as [FieldKey, string][]) {
        pinnedValue[field] = val;
      }
    }
  }

  // 3. Per-scenario severity contribution to each column's status.
  const severityByEnv: Record<EnvKey, EnvStatus> = {
    local: "passing",
    ci: "passing",
    prod: "passing",
  };
  for (const s of active) {
    // In repro mode, fully-resolved scenarios no longer degrade status;
    // "explicit" ones drop from failing to a declared warning (no magic).
    let effective: EnvStatus | null = s.severity;
    if (reproMode) {
      effective = s.reproResolves === "full" ? null : "warning";
    }
    if (effective === null) continue;
    for (const env of s.affected) {
      if (STATUS_RANK[effective] > STATUS_RANK[severityByEnv[env]]) {
        severityByEnv[env] = effective;
      }
    }
  }

  // 4. Build resolved columns.
  const envs: ResolvedEnv[] = baseline.map((env) => {
    const fields: ResolvedField[] = env.fields
      ? (Object.keys(env.fields) as FieldKey[]).map((key) => {
          const base = env.fields[key];
          let value = base.value;
          let implicit = base.implicit;

          if (reproMode && pinnedValue[key] !== undefined) {
            value = pinnedValue[key]!;
            implicit = false; // declared in the shared definition
          } else if (overridden[env.key][key]) {
            value = overridden[env.key][key]!.value;
            implicit = overridden[env.key][key]!.implicit;
          }

          return {
            key,
            value,
            implicit,
            state: "aligned" as FieldState,
            conflict: conflictFields.has(key),
          };
        })
      : [];
    return {
      key: env.key,
      name: env.name,
      role: env.role,
      accent: env.accent,
      status: severityByEnv[env.key],
      fields,
    };
  });

  // 5. Assign each cell its state. A field is "drift" only when an *active
  //    scenario* deliberately surfaces it as a conflict — baseline differences
  //    that no scenario flags (a Mac laptop's OS/arch vs a Linux runner's) are
  //    legitimate and render neutrally until a scenario makes them matter.
  const drift = {} as Record<FieldKey, boolean>;
  const fieldKeys = (Object.keys(baseline[0].fields) as FieldKey[]);
  for (const key of fieldKeys) {
    const isConflict = conflictFields.has(key);
    for (const e of envs) {
      const cell = e.fields.find((f) => f.key === key)!;
      if (reproMode && pinnedValue[key] !== undefined && !cell.implicit) {
        cell.state = "pinned";
      } else if (isMissingValue(cell.value)) {
        cell.state = "missing";
      } else if (isConflict) {
        cell.state = "drift";
      } else {
        cell.state = "aligned";
      }
    }
    drift[key] = envs.some((e) => e.fields.find((f) => f.key === key)!.state === "drift");
  }

  // 6. Summary stats.
  let implicitCells = 0;
  let pinnedCells = 0;
  for (const e of envs) {
    for (const cell of e.fields) {
      if (cell.state === "pinned") pinnedCells++;
      else if (cell.implicit) implicitCells++;
    }
  }
  const stats: SummaryStats = {
    passing: envs.filter((e) => e.status === "passing").length,
    warning: envs.filter((e) => e.status === "warning").length,
    failing: envs.filter((e) => e.status === "failing").length,
    implicitCells,
    pinnedCells,
    driftingFields: fieldKeys.filter((k) => drift[k]).length, // fields in active conflict
  };

  return { envs, stats, drift };
}

/** The most severe status across all columns — drives the drift timeline. */
export function worstStatus(envs: ResolvedEnv[]): EnvStatus {
  return envs.reduce<EnvStatus>(
    (worst, e) => (STATUS_RANK[e.status] > STATUS_RANK[worst] ? e.status : worst),
    "passing",
  );
}

export { scenarioById };
