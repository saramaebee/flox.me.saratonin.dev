// Generated executive summary — the paragraph an AE could paste into a follow-up
// email. Deliberately conservative in tone and rounded to readable numbers.

import type { DriftInputs, DriftOutputs } from "./model.ts";

const round = (n: number) => Math.round(n);
const dollars = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const hours = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export function buildExecutiveSummary(i: DriftInputs, o: DriftOutputs): string {
  const pct = round(i.reductionRate * 100);
  return (
    `Based on a ${i.engineers}-engineer team deploying ${i.deploysPerWeek} times per week, ` +
    `environment drift may be costing approximately ${hours(o.annualDriftHours)} engineering hours per year, ` +
    `or ${dollars(o.annualDriftCost)} in fully loaded engineering time. ` +
    `If reproducible environments reduce drift-related waste by ${pct}%, the team could recover approximately ` +
    `${hours(o.recoverableHours)} hours annually — equivalent to ${o.fteRecovered.toFixed(2)} full-time engineers, ` +
    `or about ${dollars(o.recoverableSavings)} in recovered capacity. ` +
    `This is a directional estimate; it intentionally excludes harder-to-quantify effects such as delayed releases, ` +
    `security exposure, customer escalations, and morale.`
  );
}
