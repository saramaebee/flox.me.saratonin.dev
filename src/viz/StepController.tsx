import { useCallback, useEffect, useRef, useState } from "react";

import { DependencyGraph } from "./DependencyGraph.tsx";
import { SbomPanel } from "./SbomPanel.tsx";
import { steps, LAST_STEP } from "./steps.ts";

export function StepController() {
  const [step, setStep] = useState(0);
  const stepRef = useRef(step);
  stepRef.current = step;

  const go = useCallback((next: number) => {
    setStep(Math.max(0, Math.min(LAST_STEP, next)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(stepRef.current + 1);
      if (e.key === "ArrowLeft") go(stepRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const s = steps[step];
  const isRepro = step === LAST_STEP;
  const isVuln = step === 3;

  return (
    <div className={`stage ${isRepro ? "stage-repro" : ""} ${isVuln ? "stage-vuln" : ""}`}>
      <div className="stage-graph">
        <DependencyGraph step={step} />
        <SbomPanel step={step} />
      </div>

      <div className="stage-panel">
        <div className="terminal-line mono">{s.command}</div>
        <div className="step-progress" role="tablist" aria-label="Walkthrough steps">
          {steps.map((st, i) => (
            <button
              key={st.key}
              role="tab"
              aria-selected={i === step}
              aria-label={st.title}
              className={`pip ${i === step ? "current" : ""} ${i < step ? "done" : ""}`}
              onClick={() => go(i)}
              type="button"
            />
          ))}
        </div>
        <h3 className="step-title">{s.title}</h3>
        <p className="step-caption">{s.caption}</p>
        <div className="step-takeaway">
          <span className="eyebrow">Why it matters</span>
          <p>{s.takeaway}</p>
        </div>

        <div className="step-controls">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
          >
            ← Back
          </button>
          <span className="step-counter mono">
            {step + 1} / {steps.length}
          </span>
          {step < LAST_STEP ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => go(step + 1)}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => go(0)}
            >
              ↻ Restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
