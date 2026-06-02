import { depNodes, stats } from "./graphData.ts";
import { STEP } from "./steps.ts";

// A condensed CycloneDX-style component listing. Sorted so the vulnerable and
// unsigned entries surface near the top once the SBOM step reveals the panel.
const components = depNodes
  .filter((n) => n.id !== "root")
  .slice()
  .sort((a, b) => {
    const rank = (x: typeof a) => (x.vulnerable ? 0 : x.signed ? 2 : 1);
    return rank(a) - rank(b);
  });

export function SbomPanel({ step }: { step: number }) {
  const provenance = step >= STEP.provenance;
  // Open for the SBOM and provenance steps, then slide away so the
  // boundary arc that follows gets the full graph width.
  const open = step >= STEP.sbom && step <= STEP.provenance;
  return (
    <aside className={`sbom ${open ? "open" : ""}`} aria-hidden={!open}>
      <header className="sbom-head">
        <span className="mono sbom-file">sbom.cdx.json</span>
        <span className="sbom-count mono">{stats.total - 1} components</span>
      </header>
      <ul className="sbom-list">
        {components.map((c) => (
          <li
            key={c.id}
            className={
              c.vulnerable
                ? "vuln"
                : provenance && !c.signed
                  ? "unsigned"
                  : ""
            }
          >
            <span className="sbom-name mono">
              {c.name}
              <span className="sbom-ver">@{c.version}</span>
            </span>
            <span className="sbom-badge mono">
              {c.vulnerable
                ? "CVE"
                : provenance
                  ? c.signed
                    ? "✓ signed"
                    : "unverified"
                  : `L${c.depth}`}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
