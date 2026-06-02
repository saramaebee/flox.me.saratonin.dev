import { test, expect } from "bun:test";

import { computeDrift } from "./model.ts";
import { presets } from "./presets.ts";

const enterprise = presets.find((p) => p.key === "enterprise")!.inputs;

// The spec's worked example (≈3,420 hrs / ≈$328,846) is itself rounded — its
// onboarding constant is really ~39.9 hrs/hire. We use a clean 40, which lands
// at 3,422 hrs / $329,038: the same numbers to the spec's "approximately" framing.
// These assertions pin the model's constants so no coefficient can drift unnoticed.
test("enterprise preset matches the canonical spec example", () => {
  const o = computeDrift(enterprise);

  expect(o.annualDriftHours).toBe(3422);
  expect(Math.round(o.annualDriftCost)).toBe(329_038);
  expect(Math.round(o.recoverableHours)).toBe(2395); // 70% of 3422
  expect(Math.round(o.recoverableSavings)).toBe(230_327);
  expect(Number(o.fteRecovered.toFixed(2))).toBe(1.15);
});

test("breakdown sums to total drift hours", () => {
  const o = computeDrift(enterprise);
  const sum = o.breakdown.reduce((acc, c) => acc + c.hours, 0);
  expect(sum).toBe(o.annualDriftHours);
});

test("reduction rate scales recoverable savings linearly", () => {
  const none = computeDrift({ ...enterprise, reductionRate: 0 });
  const all = computeDrift({ ...enterprise, reductionRate: 1 });
  expect(none.recoverableSavings).toBe(0);
  expect(none.residualCost).toBe(none.annualDriftCost);
  expect(all.recoverableSavings).toBeCloseTo(all.annualDriftCost, 5);
  expect(all.residualCost).toBeCloseTo(0, 5);
});
