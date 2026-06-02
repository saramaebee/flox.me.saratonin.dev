// The enterprise translation: one developer-felt problem, four buyer frames.
// Reuses the .gtm card/table primitives from calc.css.

const FRAMES = [
  {
    title: "Developer pain",
    line: "“CI is red but local is green.”",
    body: "Hours lost re-running builds and bisecting differences that aren't in the code — they're in the environment underneath it.",
  },
  {
    title: "Platform engineering pain",
    line: "“Environment assumptions are undocumented.”",
    body: "Every laptop, runner, and image is its own implicit contract. There's no single declared definition to standardize on or roll forward.",
  },
  {
    title: "Security pain",
    line: "“Build inputs and dependency visibility are inconsistent.”",
    body: "When the dependency graph differs across local, CI, and production, SBOMs and scans describe an environment no one actually shipped.",
  },
  {
    title: "Executive pain",
    line: "“Delivery variance burns engineering capacity.”",
    body: "Drift is a recurring tax on throughput: slower onboarding, more incidents, and unpredictable delivery — paid in headcount, not line items.",
  },
];

const TALKING_POINTS: Array<[string, string]> = [
  ["CTO", "Reduce delivery variance and recover engineering capacity lost to environment debugging."],
  ["VP Engineering", "Fewer red builds and onboarding stalls; the laptop, CI, and prod agree by construction."],
  ["Platform Engineering", "One declared environment definition to standardize on — versioned, inspectable, rolled forward centrally."],
  ["Security / Compliance", "Stable build inputs make SBOMs and provenance describe what actually shipped."],
];

export function EnterpriseFrames() {
  return (
    <div className="gtm">
      <div className="gtm-frames">
        {FRAMES.map((f) => (
          <div className="gtm-frame" key={f.title}>
            <h3>{f.title}</h3>
            <p className="dl-frame-line">{f.line}</p>
            <p>{f.body}</p>
          </div>
        ))}
      </div>

      <div className="gtm-enablement">
        <span className="eyebrow">Sales enablement view</span>
        <table className="gtm-table">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {TALKING_POINTS.map(([buyer, message]) => (
              <tr key={buyer}>
                <td className="mono">{buyer}</td>
                <td>{message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
