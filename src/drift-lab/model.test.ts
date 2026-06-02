import { test, expect } from "bun:test";

import { resolveEnvironments, worstStatus } from "./model.ts";
import { baseline } from "./data.ts";

const find = (r: ReturnType<typeof resolveEnvironments>, env: string) =>
  r.envs.find((e) => e.key === env)!;
const cell = (
  r: ReturnType<typeof resolveEnvironments>,
  env: string,
  field: string,
) => find(r, env).fields.find((f) => f.key === field)!;

test("empty baseline: every column passes and nothing drifts", () => {
  const r = resolveEnvironments([], false);
  expect(r.stats.passing).toBe(3);
  expect(r.stats.warning).toBe(0);
  expect(r.stats.failing).toBe(0);
  expect(r.stats.driftingFields).toBe(0);
  // every baseline cell is implicit, none pinned (3 envs × 9 fields)
  expect(r.stats.pinnedCells).toBe(0);
  expect(r.stats.implicitCells).toBe(baseline.length * 9);
  expect(worstStatus(r.envs)).toBe("passing");
});

test("node mismatch fails CI and marks the node row as drift", () => {
  const r = resolveEnvironments(["node-mismatch"], false);
  expect(find(r, "ci").status).toBe("failing");
  expect(find(r, "local").status).toBe("passing");
  expect(find(r, "prod").status).toBe("passing");
  expect(r.drift.node).toBe(true);
  expect(cell(r, "local", "node").value).toBe("18.19.0");
  expect(cell(r, "local", "node").state).toBe("drift");
  expect(r.stats.driftingFields).toBe(1);
});

test("repro mode fully resolves node mismatch: pinned + passing", () => {
  const r = resolveEnvironments(["node-mismatch"], true);
  expect(find(r, "ci").status).toBe("passing");
  expect(r.drift.node).toBe(false);
  const c = cell(r, "local", "node");
  expect(c.value).toBe("20.11.1");
  expect(c.implicit).toBe(false);
  expect(c.state).toBe("pinned");
  // node pinned across all three columns
  expect(r.stats.pinnedCells).toBe(3);
});

test("missing secret is 'explicit': repro declares it but stays a warning, not magic", () => {
  const off = resolveEnvironments(["missing-secret"], false);
  expect(find(off, "ci").status).toBe("failing");
  expect(cell(off, "ci", "envvars").state).toBe("missing");

  const on = resolveEnvironments(["missing-secret"], true);
  // does NOT silently pass — the requirement is declared, value still needed
  expect(find(on, "ci").status).toBe("warning");
  expect(cell(on, "ci", "envvars").value).toContain("required");
  expect(cell(on, "ci", "envvars").implicit).toBe(false);
});

test("scenarios compose: two active scenarios affect both columns and fields", () => {
  const r = resolveEnvironments(["node-mismatch", "openssl-mismatch"], false);
  expect(find(r, "ci").status).toBe("failing"); // node
  expect(find(r, "local").status).toBe("failing"); // openssl
  expect(find(r, "prod").status).toBe("passing");
  expect(r.drift.node).toBe(true);
  expect(r.drift.openssl).toBe(true);
  expect(r.stats.driftingFields).toBe(2);
});

test("warning severity does not escalate to failing", () => {
  const r = resolveEnvironments(["stale-lockfile"], false);
  expect(find(r, "local").status).toBe("warning");
  expect(worstStatus(r.envs)).toBe("warning");
});

test("conflict fields are flagged on the resolved cells", () => {
  const r = resolveEnvironments(["cuda-mismatch"], false);
  expect(cell(r, "local", "cuda").conflict).toBe(true);
  expect(cell(r, "local", "cuda").value).toBe("11.8");
  expect(find(r, "prod").status).toBe("failing");
});
