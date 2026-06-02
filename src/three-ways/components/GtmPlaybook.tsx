// "How to use this as a GTM asset" — the move that turns a technical comparison
// into a reusable narrative spine. Mirrors SalesEnablement's frames + table.

const REUSE = [
  { surface: "Blog / landing module", use: "The before/after that makes reproducibility concrete without leading with Nix." },
  { surface: "Sales deck", use: "One slide: same app, three setups, the drift surface shrinking to near-zero." },
  { surface: "DevRel artifact", use: "A repo engineers can clone, run, and check the claims against." },
  { surface: "Webinar / talk", use: "Live demo: post the same image to two environments, get two different hashes." },
  { surface: "ROI follow-up", use: "Hand the drift cost to the calculator to size it in dollars for a buyer." },
];

const BRIDGE = [
  ["Environment management", "inconsistent setups across machines and CI"],
  ["Reproducibility", "the same contract on laptop, CI, and prod"],
  ["Supply-chain trust", "you can enumerate and verify what you ship"],
  ["Enterprise velocity", "faster onboarding and fewer incidents, with builds you can audit"],
];

export function GtmPlaybook() {
  return (
    <div className="gtm">
      <div className="gtm-frames tw-bridge">
        {BRIDGE.map(([head, body], i) => (
          <div className="gtm-frame" key={head}>
            <span className="tw-bridge-step mono">0{i + 1}</span>
            <h3>{head}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>

      <div className="gtm-enablement">
        <span className="eyebrow">One comparison, many surfaces</span>
        <table className="gtm-table">
          <thead>
            <tr>
              <th>Where it ships</th>
              <th>How the same story gets used</th>
            </tr>
          </thead>
          <tbody>
            {REUSE.map(({ surface, use }) => (
              <tr key={surface}>
                <td className="mono">{surface}</td>
                <td>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
