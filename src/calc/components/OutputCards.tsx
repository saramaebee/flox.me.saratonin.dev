// The opinionated output: not just arithmetic, but the framing that turns
// hours into an enterprise buying argument.

import type { DriftInputs, DriftOutputs } from "../model.ts";

const hours = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const dollars = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  inputs: DriftInputs;
  outputs: DriftOutputs;
}

export function OutputCards({ inputs, outputs: o }: Props) {
  return (
    <div className="calc-outputs">
      <div className="calc-output-grid">
        <Stat label="Annual hours lost to drift" value={`${hours(o.annualDriftHours)} hrs`} />
        <Stat label="Annual cost of drift" value={dollars(o.annualDriftCost)} tone="cost" />
        <Stat label="Hours recoverable" value={`${hours(o.recoverableHours)} hrs`} />
        <Stat label="Estimated annual savings" value={dollars(o.recoverableSavings)} tone="save" />
        <Stat label="Engineering capacity recovered" value={`${o.fteRecovered.toFixed(2)} FTE`} tone="save" />
        <Stat label="Fully-loaded hourly cost" value={dollars(o.hourlyCost)} />
      </div>

      <p className="calc-payback">
        If reproducibility saves even one senior engineer-month per quarter, the
        business case is already material: this model puts that at{" "}
        <strong>{dollars(o.recoverableSavings)}</strong> and{" "}
        <strong>{o.fteRecovered.toFixed(2)} FTE</strong> for a{" "}
        {inputs.engineers}-engineer team.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "cost" | "save";
}) {
  return (
    <div className={`calc-output-card ${tone ? `tone-${tone}` : ""}`}>
      <span className="calc-output-value">{value}</span>
      <span className="calc-output-label">{label}</span>
    </div>
  );
}
