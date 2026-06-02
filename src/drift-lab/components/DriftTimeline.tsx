import { type EnvStatus } from "../model.ts";

interface Props {
  worst: EnvStatus;
  reproMode: boolean;
  hasActive: boolean;
}

// The flow a hidden assumption travels: it's introduced quietly on a laptop,
// surfaces as a red build in CI, and — if it slips past — becomes a provenance
// risk in production. The stages light up by how far the worst active scenario
// has been allowed to travel.
const STAGES = [
  {
    key: "local",
    label: "Local setup",
    plain: "An assumption is made implicitly: a version, a library, a variable.",
  },
  {
    key: "ci",
    label: "CI run",
    plain: "The assumption no longer holds. The build goes red on a green branch.",
  },
  {
    key: "prod",
    label: "Production risk",
    plain: "If it slips through, build inputs differ, and provenance and SBOMs weaken.",
  },
] as const;

export function DriftTimeline({ worst, reproMode, hasActive }: Props) {
  // How far drift has traveled: nothing < warning (reaches CI) < failing (reaches prod risk).
  const reach = reproMode || !hasActive ? -1 : worst === "failing" ? 2 : worst === "warning" ? 1 : 0;

  return (
    <div className={`dl-timeline ${reproMode ? "dl-timeline-repro" : ""}`}>
      {STAGES.map((stage, i) => {
        const lit = i <= reach;
        return (
          <div
            className={`dl-timeline-stage ${lit ? "lit" : ""}`}
            key={stage.key}
          >
            <div className="dl-timeline-node" aria-hidden>
              <span>{i + 1}</span>
            </div>
            <div className="dl-timeline-body">
              <h4>{stage.label}</h4>
              <p>{stage.plain}</p>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`dl-timeline-arrow ${i < reach ? "lit" : ""}`} aria-hidden />
            )}
          </div>
        );
      })}
      <p className="dl-timeline-caption">
        {reproMode
          ? "Reproducible mode stops the chain at the source: the assumption is declared once, so it never travels."
          : hasActive
            ? "The same hidden assumption travels left to right until something explicit stops it."
            : "Toggle a scenario to watch an assumption travel from a laptop to a production risk."}
      </p>
    </div>
  );
}
