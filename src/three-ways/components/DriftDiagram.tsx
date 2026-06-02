// The drift surface as an annotated stack — app at the top, hardware at the
// bottom, eight places drift creeps in between. Plain inline SVG (no D3 — this
// is a fixed labeled set, like DriftChart). Each band recolors to the selected
// approach's exposure, so picking Flox visibly collapses the red surface.

import { driftPoints, type ApproachKey, type Exposure } from "../data.ts";

interface Props {
  highlight: ApproachKey | null;
}

const EXPOSURE_COLOR: Record<Exposure, string> = {
  exposed: "var(--node-vuln)",
  partial: "var(--color-yellow)",
  controlled: "var(--node-repro)",
};

const EXPOSURE_LABEL: Record<Exposure, string> = {
  exposed: "exposed",
  partial: "partial",
  controlled: "pinned",
};

// Worst case across all approaches, used when nothing is selected.
function worst(p: (typeof driftPoints)[number]): Exposure {
  const vals = Object.values(p.exposure);
  if (vals.includes("exposed")) return "exposed";
  if (vals.includes("partial")) return "partial";
  return "controlled";
}

const ROW_H = 38;
const PAD = 8;
const W = 460;

export function DriftDiagram({ highlight }: Props) {
  const rows = [...driftPoints].sort((a, b) => a.layer - b.layer);
  const H = rows.length * ROW_H + PAD * 2;

  return (
    <figure className="tw-diagram">
      <figcaption className="tw-diagram-cap">
        <span>↑ application</span>
        <span>
          {highlight
            ? `coloured for: ${highlight}`
            : "worst case — select an approach above"}
        </span>
        <span>↓ hardware</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Stack of eight drift points, coloured by how well each approach controls them"
      >
        {rows.map((p, i) => {
          const exp = highlight ? p.exposure[highlight] : worst(p);
          const y = PAD + i * ROW_H;
          const color = EXPOSURE_COLOR[exp];
          return (
            <g key={p.key} className="tw-layer">
              <rect
                x={0}
                y={y}
                width={W}
                height={ROW_H - 4}
                rx={6}
                fill={color}
                fillOpacity={exp === "controlled" ? 0.16 : exp === "partial" ? 0.22 : 0.28}
                stroke={color}
                strokeOpacity={0.55}
              />
              <rect x={0} y={y} width={6} height={ROW_H - 4} rx={3} fill={color} />
              <text x={18} y={y + (ROW_H - 4) / 2} className="tw-layer-label" dominantBaseline="central">
                {p.label}
              </text>
              <text
                x={W - 14}
                y={y + (ROW_H - 4) / 2}
                className="tw-layer-state"
                dominantBaseline="central"
                textAnchor="end"
                fill={color}
              >
                {EXPOSURE_LABEL[exp]}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="tw-legend">
        <li><span className="dot" style={{ background: EXPOSURE_COLOR.exposed }} /> exposed</li>
        <li><span className="dot" style={{ background: EXPOSURE_COLOR.partial }} /> partial</li>
        <li><span className="dot" style={{ background: EXPOSURE_COLOR.controlled }} /> pinned</li>
      </ul>
    </figure>
  );
}
