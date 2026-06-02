import { StepController } from "../viz/StepController.tsx";
import { navigate } from "../router.tsx";
import { stats } from "../viz/graphData.ts";

export function NpmInstall() {
  return (
    <main className="viz-page">
      <section className="viz-intro">
        <div className="container">
          <span className="eyebrow">Interactive walkthrough</span>
          <h1>
            What actually happens when you run <code>npm install</code>?
          </h1>
          <p className="lede">
            Step through it. Six declared dependencies become{" "}
            <strong>{stats.total - 1} packages</strong>, a vulnerability hides{" "}
            {stats.maxDepth} levels deep, an SBOM catalogs the lot, provenance
            asks who to trust — and reproducibility closes the gap. Use the
            buttons or your ← → arrow keys.
          </p>
        </div>
      </section>

      <section className="container">
        <StepController />
      </section>

      <section className="container viz-outro">
        <p>
          This is the story Flox tells as <em>secure software by
          construction</em> — and the reason this very site is built inside a
          Flox environment and a Nix flake.
        </p>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => navigate("#/")}
        >
          ← Back to projects
        </button>
      </section>
    </main>
  );
}
