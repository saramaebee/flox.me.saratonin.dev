// Closing argument: why drift is a supply-chain-trust problem, not just a DX one.

const POINTS = [
  {
    head: "SBOMs are only as stable as their build inputs",
    body: "A bill of materials generated against a drifting environment describes one machine at one moment. Stabilize the inputs and the SBOM starts describing every build, not a snapshot.",
  },
  {
    head: "Provenance is stronger when environments are reproducible",
    body: "An attestation that says “built here, from this” is far more meaningful when “here” is a declared, versioned definition than when it's whatever the runner happened to be that day.",
  },
  {
    head: "Security controls weaken when graphs differ",
    body: "Scan local, scan CI, scan prod — and if the dependency graphs differ, you've scanned three things and shipped a fourth. Consistent environments make controls actually apply to what runs.",
  },
  {
    head: "Reproducibility turns trust from a claim into evidence",
    body: "“It's secure” is a claim. “Here is the exact, pinned set of inputs anyone can rebuild and verify” is closer to evidence. Reproducible environments are what move you from the first to the second.",
  },
];

export function SupplyChainNote() {
  return (
    <div className="dl-supply">
      {POINTS.map((p) => (
        <div className="dl-supply-point" key={p.head}>
          <h3>{p.head}</h3>
          <p>{p.body}</p>
        </div>
      ))}
    </div>
  );
}
