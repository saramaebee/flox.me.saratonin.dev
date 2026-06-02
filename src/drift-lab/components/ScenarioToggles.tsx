import {
  CATEGORY_LABELS,
  scenariosByCategory,
  type Scenario,
} from "../data.ts";

interface Props {
  activeIds: string[];
  reproMode: boolean;
  onToggle: (id: string) => void;
  onRepro: (on: boolean) => void;
  onReset: () => void;
}

const SEVERITY_DOT: Record<Scenario["severity"], string> = {
  failing: "var(--node-vuln)",
  warning: "var(--color-orange)",
};

export function ScenarioToggles({
  activeIds,
  reproMode,
  onToggle,
  onRepro,
  onReset,
}: Props) {
  const groups = scenariosByCategory();
  const activeCount = activeIds.length;

  return (
    <div className="dl-toggles">
      <div className="dl-toggles-head">
        <div>
          <span className="eyebrow">Drift scenarios</span>
          <p className="dl-toggles-hint">
            Toggle the implicit assumptions that differ between environments. They
            compound — turn on several at once.
          </p>
        </div>
        <div className="dl-toggles-actions">
          <span className="dl-count" aria-live="polite">
            {activeCount} active
          </span>
          <button
            type="button"
            className="btn btn-ghost dl-reset"
            onClick={onReset}
            disabled={activeCount === 0 && !reproMode}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="dl-groups">
        {groups.map((g) => (
          <fieldset className="dl-group" key={g.category}>
            <legend>{CATEGORY_LABELS[g.category]}</legend>
            <div className="dl-chips">
              {g.items.map((s) => {
                const on = activeIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`dl-chip ${on ? "on" : ""}`}
                    aria-pressed={on}
                    onClick={() => onToggle(s.id)}
                    title={s.description}
                  >
                    <span
                      className="dl-chip-dot"
                      style={{ background: on ? SEVERITY_DOT[s.severity] : "var(--border)" }}
                      aria-hidden
                    />
                    {s.title}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <label className={`dl-repro ${reproMode ? "on" : ""}`}>
        <span className="dl-repro-switch" aria-hidden>
          <span className="dl-repro-knob" />
        </span>
        <input
          type="checkbox"
          checked={reproMode}
          onChange={(e) => onRepro(e.target.checked)}
          className="dl-repro-input"
        />
        <span className="dl-repro-text">
          <strong>Reproducible Environment Mode</strong>
          <span>
            Pin every assumption these scenarios touch into one shared, versioned
            definition — and watch what actually resolves.
          </span>
        </span>
      </label>
    </div>
  );
}
