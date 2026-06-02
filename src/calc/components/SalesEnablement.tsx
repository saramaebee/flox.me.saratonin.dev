// The portfolio payload: this is where the calculator stops being a widget and
// becomes a GTM asset. Four buyer-relevant frames + a talking-points table an AE
// could lift directly.

const FRAMES = [
  {
    title: "Engineering productivity",
    body: "Recover hours quietly lost to setup, debugging, and broken builds, and put them back into shipped work.",
  },
  {
    title: "Incident reduction",
    body: "Fewer config/env mismatches reaching staging and production means fewer cross-functional fire drills.",
  },
  {
    title: "Developer onboarding",
    body: "New hires reach a working environment in minutes, not days. Onboarding stops pulling time from the rest of the team.",
  },
  {
    title: "Platform standardization",
    body: "One reproducible definition of the environment, used identically on laptops, in CI, and in production.",
  },
];

const TALKING_POINTS = [
  ["CTO", "Recover engineering capacity and reduce delivery variance."],
  ["VP Engineering", "Fewer onboarding failures, fewer broken builds, faster team execution."],
  ["Platform Engineering", "Standardize environments without slowing developers down."],
  ["Security", "Improve provenance, dependency control, and auditability."],
];

export function SalesEnablement() {
  return (
    <div className="gtm">
      <div className="gtm-frames">
        {FRAMES.map((f) => (
          <div className="gtm-frame" key={f.title}>
            <h3>{f.title}</h3>
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
