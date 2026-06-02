// Lightweight inline-SVG chart — no D3 needed for a two-bar comparison plus a
// stacked category breakdown. Colors come from the site's design tokens so the
// calculator reads as part of the same visual system as the npm-install viz.

import type { DriftOutputs } from "../model.ts";

const dollars = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

const CATEGORY_COLOR: Record<string, string> = {
  local: "var(--color-orange)",
  incidents: "var(--node-vuln)",
  ci: "var(--color-yellow)",
  onboarding: "var(--color-violet)",
};

interface Props {
  outputs: DriftOutputs;
}

export function DriftChart({ outputs: o }: Props) {
  const max = o.annualDriftCost || 1;
  const projectedPct = (o.residualCost / max) * 100;
  const savedPct = (o.recoverableSavings / max) * 100;

  // Stacked segments for the "today" bar, proportional to each category's hours.
  const totalHours = o.annualDriftHours || 1;

  return (
    <div className="drift-chart">
      <div className="drift-bars">
        <div className="drift-bar-row">
          <span className="drift-bar-label">Drift cost today</span>
          <div className="drift-bar-track">
            <div className="drift-bar-stack" style={{ width: "100%" }}>
              {o.breakdown.map((c) => (
                <span
                  key={c.key}
                  className="drift-seg"
                  title={`${c.label}: ${Math.round((c.hours / totalHours) * 100)}%`}
                  style={{
                    width: `${(c.hours / totalHours) * 100}%`,
                    background: CATEGORY_COLOR[c.key],
                  }}
                />
              ))}
            </div>
            <span className="drift-bar-amount mono">{dollars(o.annualDriftCost)}</span>
          </div>
        </div>

        <div className="drift-bar-row">
          <span className="drift-bar-label">With reproducibility</span>
          <div className="drift-bar-track">
            <div
              className="drift-bar-stack drift-bar-residual"
              style={{ width: `${projectedPct}%` }}
            >
              <span className="drift-seg" style={{ width: "100%", background: "var(--color-gray-400)" }} />
            </div>
            <div
              className="drift-bar-saved"
              style={{ width: `${savedPct}%`, left: `${projectedPct}%` }}
              title="Recovered"
            />
            <span className="drift-bar-amount mono">{dollars(o.residualCost)} remaining</span>
          </div>
        </div>
      </div>

      <ul className="drift-legend">
        {o.breakdown.map((c) => (
          <li key={c.key}>
            <span className="dot" style={{ background: CATEGORY_COLOR[c.key] }} />
            {c.label}
            <span className="mono"> · {Math.round(c.hours).toLocaleString()} hrs</span>
          </li>
        ))}
        <li>
          <span className="dot" style={{ background: "var(--color-gray-400)" }} />
          Residual after reproducibility
        </li>
      </ul>
    </div>
  );
}
