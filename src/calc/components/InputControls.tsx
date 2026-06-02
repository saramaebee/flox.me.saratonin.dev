// Hybrid input controls: sliders for bounded ranges, numeric fields with
// steppers for counts and the salary. Each row carries the "why it matters"
// microcopy from the spec table so the model never feels like a black box.

import type { DriftInputs } from "../model.ts";

type Field = keyof DriftInputs;

interface BaseControl {
  field: Field;
  label: string;
  why: string;
}

interface SliderControl extends BaseControl {
  kind: "slider";
  min: number;
  max: number;
  step: number;
  /** Format the live value readout. */
  format: (v: number) => string;
}

interface NumberControl extends BaseControl {
  kind: "number";
  min: number;
  step: number;
  prefix?: string;
  suffix?: string;
}

type Control = SliderControl | NumberControl;

const controls: Control[] = [
  { kind: "number", field: "engineers", label: "Engineers", why: "Scope of recurring productivity loss.", min: 1, step: 1, suffix: "eng" },
  { kind: "number", field: "fullyLoadedCost", label: "Avg. fully-loaded cost", why: "Converts hours to dollars.", min: 0, step: 10_000, prefix: "$", suffix: "/yr" },
  { kind: "number", field: "newHiresPerQuarter", label: "New hires per quarter", why: "Onboarding drag.", min: 0, step: 1, suffix: "/qtr" },
  { kind: "number", field: "deploysPerWeek", label: "Deployments per week", why: "More deploys → more environment-mismatch exposure. (Context only — not in the core math.)", min: 0, step: 1, suffix: "/wk" },
  { kind: "number", field: "incidentsPerMonth", label: "Drift incidents per month", why: "Prod/staging failures from config or env mismatch.", min: 0, step: 1, suffix: "/mo" },
  { kind: "slider", field: "hrsPerIncident", label: "Hours lost per incident", why: "Cross-functional debugging cost.", min: 1, max: 40, step: 0.5, format: (v) => `${v} hrs` },
  { kind: "slider", field: "localSetupHrsPerEngPerMonth", label: "Local setup/debug hrs", why: "The everyday “works on my machine” tax, per engineer per month.", min: 0, max: 20, step: 0.5, format: (v) => `${v} hrs/eng·mo` },
  { kind: "number", field: "ciFailuresPerWeek", label: "CI/build failures per week", why: "Hidden platform/infra cost from environment mismatch.", min: 0, step: 1, suffix: "/wk" },
  { kind: "slider", field: "hrsPerCiFailure", label: "Hours per CI/build failure", why: "Time to diagnose and retry.", min: 0.25, max: 8, step: 0.25, format: (v) => `${v} hrs` },
  { kind: "slider", field: "onboardingHrsPerHire", label: "Onboarding drift per hire", why: "Hours a new hire loses to broken/inconsistent setup.", min: 0, max: 160, step: 5, format: (v) => `${v} hrs` },
];

interface Props {
  inputs: DriftInputs;
  onChange: (next: DriftInputs) => void;
}

export function InputControls({ inputs, onChange }: Props) {
  const set = (field: Field, value: number) =>
    onChange({ ...inputs, [field]: value });

  return (
    <div className="calc-controls">
      {controls.map((c) => (
        <div className="calc-control" key={c.field}>
          <div className="calc-control-head">
            <label htmlFor={c.field}>{c.label}</label>
            {c.kind === "slider" && (
              <span className="calc-control-value mono">{c.format(inputs[c.field])}</span>
            )}
          </div>

          {c.kind === "slider" ? (
            <input
              id={c.field}
              type="range"
              min={c.min}
              max={c.max}
              step={c.step}
              value={inputs[c.field]}
              onChange={(e) => set(c.field, Number(e.target.value))}
            />
          ) : (
            <div className="calc-stepper">
              <button
                type="button"
                aria-label={`Decrease ${c.label}`}
                onClick={() => set(c.field, Math.max(c.min, inputs[c.field] - c.step))}
              >
                −
              </button>
              <div className="calc-stepper-field">
                {c.prefix && <span className="affix">{c.prefix}</span>}
                <input
                  id={c.field}
                  type="number"
                  min={c.min}
                  step={c.step}
                  value={inputs[c.field]}
                  onChange={(e) => set(c.field, Math.max(c.min, Number(e.target.value) || 0))}
                />
                {c.suffix && <span className="affix">{c.suffix}</span>}
              </div>
              <button
                type="button"
                aria-label={`Increase ${c.label}`}
                onClick={() => set(c.field, inputs[c.field] + c.step)}
              >
                +
              </button>
            </div>
          )}

          <p className="calc-control-why">{c.why}</p>
        </div>
      ))}

      <div className="calc-control calc-control-reduction">
        <div className="calc-control-head">
          <label htmlFor="reductionRate">Expected reduction from reproducibility</label>
          <span className="calc-control-value mono">
            {Math.round(inputs.reductionRate * 100)}%
          </span>
        </div>
        <input
          id="reductionRate"
          type="range"
          min={0}
          max={0.9}
          step={0.05}
          value={inputs.reductionRate}
          onChange={(e) => set("reductionRate", Number(e.target.value))}
        />
        <p className="calc-control-why">
          Modeled savings from standardized, reproducible environments. Typically 50–80%.
        </p>
      </div>
    </div>
  );
}
