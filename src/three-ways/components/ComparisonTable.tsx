// Data-driven product-comparison matrix: approaches are columns, dimensions are
// rows. Pure presentational — everything comes from ../data.ts. A row of pills
// lets you focus one approach (shared with the drift diagram), and each cell
// flips between its headline value and the "why it matters" detail.

import { useState } from "react";

import {
  approaches,
  comparisonRows,
  driftPoints,
  driftSurface,
  type ApproachKey,
} from "../data.ts";

interface Props {
  highlight: ApproachKey | null;
  onHighlight: (k: ApproachKey | null) => void;
}

export function ComparisonTable({ highlight, onHighlight }: Props) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="tw-table-wrap">
      <div className="tw-controls">
        <div className="preset-pills" role="group" aria-label="Highlight an approach">
          {approaches.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`preset-pill ${highlight === a.key ? "active" : ""}`}
              aria-pressed={highlight === a.key}
              style={highlight === a.key ? { borderColor: `var(${a.accent})` } : undefined}
              onClick={() => onHighlight(highlight === a.key ? null : a.key)}
            >
              {a.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-ghost tw-why-toggle"
          aria-pressed={showWhy}
          onClick={() => setShowWhy((v) => !v)}
        >
          {showWhy ? "Show values" : "Show detail"}
        </button>
      </div>

      <table className="tw-table">
        <thead>
          <tr>
            <th scope="col" className="tw-corner">Dimension</th>
            {approaches.map((a) => (
              <th
                key={a.key}
                scope="col"
                className={`tw-approach ${highlight && highlight !== a.key ? "tw-dim" : ""}`}
                style={{ borderTopColor: `var(${a.accent})` }}
              >
                {a.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonRows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="tw-dimension">
                {row.dimension}
                {showWhy && <span className="tw-why">{row.why}</span>}
              </th>
              {approaches.map((a) => {
                const cell = row.cells[a.key];
                const dim = highlight && highlight !== a.key;
                return (
                  <td
                    key={a.key}
                    className={`tw-cell tw-${cell.rating} ${dim ? "tw-dim" : ""}`}
                  >
                    <span className="tw-value">{showWhy && cell.note ? cell.note : cell.value}</span>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="tw-surface-row">
            <th scope="row" className="tw-dimension">
              Drift surface
              {showWhy && <span className="tw-why">Of the 8 drift points below, how many stay un-controlled.</span>}
            </th>
            {approaches.map((a) => {
              const n = driftSurface(a.key);
              const rating = n >= 6 ? "bad" : n >= 3 ? "mixed" : "good";
              const dim = highlight && highlight !== a.key;
              return (
                <td key={a.key} className={`tw-cell tw-${rating} ${dim ? "tw-dim" : ""}`}>
                  <span className="tw-value mono">{n} / {driftPoints.length}</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
