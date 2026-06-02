import { FIELD_LABELS, type EnvKey, type Scenario } from "../data.ts";

interface Props {
  active: Scenario[];
  reproMode: boolean;
}

const ENV_NAME: Record<EnvKey, string> = {
  local: "Local",
  ci: "CI",
  prod: "Production-like",
};

function affectedLabel(envs: EnvKey[]): string {
  const names = envs.map((e) => ENV_NAME[e]);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export function ExplanationPanel({ active, reproMode }: Props) {
  if (active.length === 0) {
    return (
      <div className="dl-explain dl-explain-empty">
        <span className="eyebrow">Explanation</span>
        <p>
          All three environments agree on every assumption: the green state every
          team wants and few can prove. Toggle a scenario above to introduce a
          single implicit difference and see which environment breaks, why, and
          what it costs.
        </p>
      </div>
    );
  }

  return (
    <div className="dl-explain">
      <span className="eyebrow">
        {reproMode ? "What reproducible mode actually did" : "Why it breaks"}
      </span>
      <div className="dl-explain-list">
        {active.map((s) => {
          const explicitOnly = reproMode && s.reproResolves === "explicit";
          return (
            <article className="dl-explain-card" key={s.id}>
              <header>
                <h3>{s.title}</h3>
                <span
                  className={`dl-pill ${
                    reproMode
                      ? explicitOnly
                        ? "dl-pill-warning"
                        : "dl-pill-resolved"
                      : `dl-pill-${s.severity}`
                  }`}
                >
                  {reproMode
                    ? explicitOnly
                      ? "made explicit"
                      : "resolved"
                    : `${affectedLabel(s.affected)} ${s.severity === "failing" ? "breaks" : "at risk"}`}
                </span>
              </header>

              {reproMode ? (
                <div className="dl-explain-repro">
                  <p>
                    <strong>Pinned:</strong>{" "}
                    {s.conflictFields.map((c) => FIELD_LABELS[c]).join(", ")} is now
                    one declared value shared across all three environments.
                  </p>
                  {explicitOnly ? (
                    <p className="dl-explain-honest">
                      Reproducibility makes this explicit, not automatic: {s.reproducibleFix}
                    </p>
                  ) : (
                    <p>{s.reproducibleFix}</p>
                  )}
                </div>
              ) : (
                <dl className="dl-explain-rows">
                  <div>
                    <dt>Symptom</dt>
                    <dd>{s.symptom}</dd>
                  </div>
                  <div>
                    <dt>Root cause</dt>
                    <dd>{s.rootCause}</dd>
                  </div>
                  <div>
                    <dt>Team impact</dt>
                    <dd>{s.teamImpact}</dd>
                  </div>
                  <div>
                    <dt>Reproducible fix</dt>
                    <dd>{s.reproducibleFix}</dd>
                  </div>
                </dl>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
