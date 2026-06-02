import { useMemo, useState } from "react";

import { navigate } from "../router.tsx";
import { computeDrift, type DriftInputs } from "../calc/model.ts";
import { presets, defaultPreset, type Preset } from "../calc/presets.ts";
import { buildExecutiveSummary } from "../calc/summary.ts";
import { InputControls } from "../calc/components/InputControls.tsx";
import { OutputCards } from "../calc/components/OutputCards.tsx";
import { DriftChart } from "../calc/components/DriftChart.tsx";
import { SalesEnablement } from "../calc/components/SalesEnablement.tsx";

export function DriftCalculator() {
  const [activePreset, setActivePreset] = useState<Preset>(defaultPreset);
  const [inputs, setInputs] = useState<DriftInputs>(defaultPreset.inputs);
  const [copied, setCopied] = useState(false);

  const outputs = useMemo(() => computeDrift(inputs), [inputs]);
  const summary = useMemo(
    () => buildExecutiveSummary(inputs, outputs),
    [inputs, outputs],
  );

  const applyPreset = (p: Preset) => {
    setActivePreset(p);
    setInputs(p.inputs);
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="calc-page">
      <section className="viz-intro">
        <div className="container">
          <span className="eyebrow">ROI model</span>
          <h1>The hidden tax of non-reproducible environments</h1>
          <p className="lede">
            Turn “works on my machine” into an enterprise business case: lost
            engineering hours, incident drag, onboarding delay, and the
            recoverable capacity of reproducible infrastructure. Every team pays
            an environment-drift tax. This estimates yours.
          </p>
        </div>
      </section>

      <section className="container">
        <div className="preset-pills" role="tablist" aria-label="Scenario presets">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={p.key === activePreset.key}
              className={`preset-pill ${p.key === activePreset.key ? "active" : ""}`}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="preset-narrative">{activePreset.narrative}</p>

        <div className="calc-grid">
          <div className="calc-panel">
            <span className="eyebrow">Inputs</span>
            <InputControls inputs={inputs} onChange={setInputs} />
          </div>
          <div className="calc-panel">
            <span className="eyebrow">Estimated drift tax</span>
            <OutputCards inputs={inputs} outputs={outputs} />
            <DriftChart outputs={outputs} />
          </div>
        </div>

        <details className="assumptions">
          <summary>Assumptions &amp; method</summary>
          <p>
            This is a directional model. It multiplies a few recognizable
            recurring costs (local setup/debug time, drift-related incidents,
            CI/build failures, and onboarding drag) by a fully-loaded hourly
            rate, then applies an expected reduction from reproducible
            environments. Deployments per week is shown for context but is not in
            the core math.
          </p>
          <p>
            It intentionally <strong>excludes</strong> harder-to-quantify effects
            such as delayed releases, security exposure, customer escalations,
            opportunity cost, and morale impact. The real number is almost
            certainly higher; this estimate is meant to be conservative and
            defensible, not exact.
          </p>
        </details>

        <div className="exec-summary">
          <div className="exec-summary-head">
            <span className="eyebrow">Generated executive summary</span>
            <button type="button" className="btn btn-ghost" onClick={copySummary}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p>{summary}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Why this matters for GTM</span>
            <h2>One technical pain, four buyer-relevant frames</h2>
          </div>
          <SalesEnablement />
        </div>
      </section>

      <section className="container viz-outro">
        <p>
          The same thesis behind this microsite: reproducibility lowers
          operational costs that compound across teams, well beyond developer
          convenience. This page is built inside a pinned Flox environment, so
          the model and the medium agree.
        </p>
        <button className="btn btn-ghost" type="button" onClick={() => navigate("#/")}>
          ← Back to projects
        </button>
      </section>
    </main>
  );
}
