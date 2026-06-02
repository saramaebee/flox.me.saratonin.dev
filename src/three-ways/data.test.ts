import { test, expect } from "bun:test";

import {
  approaches,
  comparisonRows,
  driftPoints,
  failureMatrix,
  driftSurface,
  drift,
  type ApproachKey,
} from "./data.ts";

const KEYS: ApproachKey[] = ["native", "docker", "flox"];

test("every comparison row has a cell for each approach", () => {
  for (const row of comparisonRows) {
    for (const k of KEYS) {
      expect(row.cells[k]).toBeDefined();
      expect(row.cells[k].value.length).toBeGreaterThan(0);
    }
  }
});

test("every drift point declares exposure for each approach", () => {
  for (const p of driftPoints) {
    for (const k of KEYS) {
      expect(["exposed", "partial", "controlled"]).toContain(p.exposure[k]);
    }
  }
});

test("drift surface increases native > docker >= flox", () => {
  expect(driftSurface("native")).toBeGreaterThan(driftSurface("docker"));
  expect(driftSurface("docker")).toBeGreaterThanOrEqual(driftSurface("flox"));
  expect(driftSurface("flox")).toBeLessThanOrEqual(2);
});

test("the headline finding holds: docker and flox hashes differ", () => {
  expect(drift.same).toBe(false);
  expect(drift.docker_sha256).not.toBe(drift.flox_sha256);
});

test("failure matrix: flox is exposed to no more failures than docker", () => {
  const count = (k: ApproachKey) => failureMatrix.filter((f) => f.affects[k]).length;
  expect(count("native")).toBeGreaterThanOrEqual(count("docker"));
  expect(count("docker")).toBeGreaterThanOrEqual(count("flox"));
});

test("approaches cover exactly the three keys", () => {
  expect(approaches.map((a) => a.key).sort()).toEqual([...KEYS].sort());
});
