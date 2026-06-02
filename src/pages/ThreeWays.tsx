import { useMemo, useState } from "react";

import { navigate } from "../router.tsx";
import { provenance, timings, drift, type ApproachKey } from "../three-ways/data.ts";
import { buildComparisonSummary } from "../three-ways/summary.ts";
import { ComparisonTable } from "../three-ways/components/ComparisonTable.tsx";
import { DriftDiagram } from "../three-ways/components/DriftDiagram.tsx";
import { GtmPlaybook } from "../three-ways/components/GtmPlaybook.tsx";

const REPO = "https://github.com/saramaebee";

export function ThreeWays() {
  // Shared across the comparison table and the drift diagram, so selecting an
  // approach in one re-colours the other (cf. StepController → graph + SBOM).
  const [highlight, setHighlight] = useState<ApproachKey | null>(null);
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => buildComparisonSummary(), []);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="threeways-page">
      <section className="viz-intro">
        <div className="container">
          <span className="eyebrow">Product comparison</span>
          <h1>Same app, three environments</h1>
          <p className="lede">
            One small service, set up natively, with Docker, and with Flox. The
            application code is <em>identical</em> across all three; only how the
            runtime, system libraries, and database get procured changes. That
            difference is the whole ballgame.
          </p>
        </div>
      </section>

      {/* 1 — the familiar pain */}
      <section className="section">
        <div className="container tw-prose">
          <div className="section-head">
            <span className="eyebrow">The pain everyone knows</span>
            <h2>“It works on my machine”</h2>
          </div>
          <p>
            A new engineer joins. The README says setup takes twenty minutes.
            Three hours later they’re debugging Python versions, OpenSSL, a
            missing Postgres client, and a transitive dependency that behaves
            differently on Apple Silicon. None of that is the product. All of it
            is environment drift, and it’s wasted capacity that compounds across
            every laptop, every CI run, and every incident.
          </p>
        </div>
      </section>

      {/* 2 — the experiment */}
      <section className="section">
        <div className="container tw-prose">
          <div className="section-head">
            <span className="eyebrow">The experiment</span>
            <h2>One app, three ways to procure an environment</h2>
          </div>
          <p>
            The app thumbnails an image (Pillow → libjpeg), signs it
            (cryptography → OpenSSL), and stores it in Postgres (psycopg →
            libpq), pinned to CPython 3.12, deliberately chosen because this is
            where native dependencies actually hurt. We didn’t pick an ecosystem
            that makes the point easy; we picked the one where it’s honest. The
            numbers below are measured on a {provenance.os}/{provenance.arch}{" "}
            machine (whose default <code>python3</code> is {provenance.host_python},
            not the pinned 3.12, drift before we even begin).
          </p>
          <p className="tw-aside">
            Containers package the <em>application</em>. Reproducible
            environments package the <em>developer contract</em>: the runtime,
            the system libraries, and the services, as one shareable, versioned
            artifact.
          </p>
        </div>
      </section>

      {/* 3 — comparison table */}
      <section className="container">
        <ComparisonTable highlight={highlight} onHighlight={setHighlight} />
      </section>

      {/* 4 — where drift enters */}
      <section className="section">
        <div className="container tw-prose">
          <div className="section-head">
            <span className="eyebrow">The drift surface</span>
            <h2>Where drift actually enters</h2>
          </div>
          <p>
            Pinning your <em>packages</em> (a lockfile) doesn’t pin your{" "}
            <em>environment</em>. Below the application sit eight layers each
            approach controls, or doesn’t. Select an approach to recolour the
            stack and watch the exposed surface shrink.
          </p>
        </div>
      </section>

      {/* 5 — drift diagram */}
      <section className="container tw-diagram-section">
        <DriftDiagram highlight={highlight} />
      </section>

      {/* 6 + 7 — implementation differences → business consequences */}
      <section className="section">
        <div className="container tw-prose">
          <div className="section-head">
            <span className="eyebrow">From mechanism to consequence</span>
            <h2>The headline isn’t the step count</h2>
          </div>
          <p>
            It’s tempting to compare step counts: native has fourteen, Docker
            seven, Flox two. What actually matters is what those differences
            cost. More implicit dependencies mean more CI breakage. More
            local/CI mismatch means slower incident diagnosis. Less repeatability
            means weaker auditability and worse supply-chain governance.
          </p>
          <p>
            We can make it concrete with a single number. Post the{" "}
            <strong>same</strong> image to the <strong>same</strong> app, once
            under Docker and once under Flox, and compare the returned SHA-256:
          </p>
          <div className="tw-hashes">
            <div>
              <span className="tw-hash-tag" style={{ color: "var(--color-orange)" }}>docker</span>
              <code className="mono">{drift.docker_sha256.slice(0, 24)}…</code>
            </div>
            <div>
              <span className="tw-hash-tag" style={{ color: "var(--node-repro)" }}>flox</span>
              <code className="mono">{drift.flox_sha256.slice(0, 24)}…</code>
            </div>
          </div>
          <p>
            Different hashes, identical source: the <code>libjpeg</code>{" "}
            that decodes the image isn’t the same library in the two
            environments. That’s drift you can measure. To size it in dollars,{" "}
            <button className="tw-link" type="button" onClick={() => navigate("#/drift-calculator")}>
              run it through the drift calculator →
            </button>
          </p>
        </div>
      </section>

      {/* 8 — GTM asset */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How to use this as a GTM asset</span>
            <h2>A positioning asset disguised as a technical comparison</h2>
          </div>
          <GtmPlaybook />
          <div className="exec-summary tw-summary">
            <div className="exec-summary-head">
              <span className="eyebrow">Buyer-ready summary</span>
              <button type="button" className="btn btn-ghost" onClick={copySummary}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p>{summary}</p>
          </div>
        </div>
      </section>

      {/* thesis */}
      <section className="container viz-outro">
        <p>
          A README can’t pin a developer environment. A reproducible contract
          can: one shared between the developer, CI, production, and the
          software supply chain. The runnable code for all three setups
          (including the benchmark that produced these numbers) is on{" "}
          <a href={REPO}>GitHub</a>; this site is itself built inside a pinned
          Flox environment, so the medium agrees with the message.
        </p>
        <button className="btn btn-ghost" type="button" onClick={() => navigate("#/")}>
          ← Back to projects
        </button>
      </section>
    </main>
  );
}
