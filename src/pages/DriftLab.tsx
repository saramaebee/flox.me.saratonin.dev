import { useMemo, useState } from "react";

import { navigate } from "../router.tsx";
import { scenarios } from "../drift-lab/data.ts";
import {
  activeScenarios,
  resolveEnvironments,
  worstStatus,
} from "../drift-lab/model.ts";
import { buildLabSummary } from "../drift-lab/summary.ts";
import { ScenarioToggles } from "../drift-lab/components/ScenarioToggles.tsx";
import { EnvColumn } from "../drift-lab/components/EnvColumn.tsx";
import { ExplanationPanel } from "../drift-lab/components/ExplanationPanel.tsx";
import { DriftTimeline } from "../drift-lab/components/DriftTimeline.tsx";
import { EnterpriseFrames } from "../drift-lab/components/EnterpriseFrames.tsx";
import { SupplyChainNote } from "../drift-lab/components/SupplyChainNote.tsx";

const REPO = "https://github.com/saramaebee";

export function DriftLab() {
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [reproMode, setReproMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) =>
    setActiveIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  const reset = () => {
    setActiveIds([]);
    setReproMode(false);
  };

  const result = useMemo(
    () => resolveEnvironments(activeIds, reproMode),
    [activeIds, reproMode],
  );
  const active = useMemo(() => activeScenarios(activeIds), [activeIds]);
  const summary = useMemo(
    () => buildLabSummary(active, reproMode, result),
    [active, reproMode, result],
  );

  // CUDA is a niche row; only show it once a GPU scenario is in play.
  const showCuda = active.some((s) => s.category === "gpu");
  const worst = worstStatus(result.envs);
  const { stats } = result;

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
    <main className="dl-page">
      <section className="viz-intro">
        <div className="container">
          <span className="eyebrow">Interactive lab</span>
          <h1>Local-to-CI Drift Lab</h1>
          <p className="lede">
            A visual demo of how implicit environment assumptions turn into broken
            builds, slow onboarding, and weak software supply-chain trust — and how
            a reproducible environment collapses them into one versioned contract.
          </p>
          <p className="dl-thesis">
            Environment drift isn't random. It's the result of implicit
            assumptions. Reproducible infrastructure turns those assumptions into
            explicit, versioned inputs.
          </p>
        </div>
      </section>

      {/* the lab itself */}
      <section className="container dl-lab">
        <ScenarioToggles
          activeIds={activeIds}
          reproMode={reproMode}
          onToggle={toggle}
          onRepro={setReproMode}
          onReset={reset}
        />

        <div className="dl-stat-strip" role="status">
          <span className={`dl-stat dl-stat-pass`}>
            <strong>{stats.passing}</strong> passing
          </span>
          <span className="dl-stat dl-stat-warn">
            <strong>{stats.warning}</strong> warning
          </span>
          <span className="dl-stat dl-stat-fail">
            <strong>{stats.failing}</strong> failing
          </span>
          <span className="dl-stat-sep" aria-hidden />
          <span className="dl-stat dl-stat-meta">
            <strong>{stats.pinnedCells}</strong> pinned
          </span>
          <span className="dl-stat dl-stat-meta">
            <strong>{stats.implicitCells}</strong> implicit
          </span>
        </div>

        <div className="dl-columns">
          {result.envs.map((env) => (
            <EnvColumn key={env.key} env={env} showCuda={showCuda} />
          ))}
        </div>

        <ExplanationPanel active={active} reproMode={reproMode} />
      </section>

      {/* how an assumption travels */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">The drift path</span>
            <h2>How one hidden assumption travels</h2>
          </div>
          <DriftTimeline
            worst={worst}
            reproMode={reproMode}
            hasActive={active.length > 0}
          />
        </div>
      </section>

      {/* enterprise translation */}
      <section className="section dl-section-soft">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Enterprise translation</span>
            <h2>One technical pain, four buyer-relevant frames</h2>
          </div>
          <EnterpriseFrames />

          <div className="exec-summary dl-summary">
            <div className="exec-summary-head">
              <span className="eyebrow">Copyable executive summary</span>
              <button type="button" className="btn btn-ghost" onClick={copySummary}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <p>{summary}</p>
          </div>
        </div>
      </section>

      {/* supply-chain trust */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Why this matters for supply-chain trust</span>
            <h2>Reproducibility turns trust into evidence</h2>
          </div>
          <SupplyChainNote />
        </div>
      </section>

      {/* thesis / outro */}
      <section className="container viz-outro">
        <p>
          This isn't “containers bad, Nix good.” Native setup is familiar but
          implicit; containers package the service yet leave local, CI, and build
          inputs free to drift. Reproducible environments make the assumptions
          explicit, shareable, and auditable — the future of developer environments
          isn't a better README, it's a reproducible contract between developers,
          CI, and production. See the companion{" "}
          <button className="tw-link" type="button" onClick={() => navigate("#/three-ways")}>
            Same App, Three Environments
          </button>{" "}
          comparison, or size the cost in the{" "}
          <button className="tw-link" type="button" onClick={() => navigate("#/drift-calculator")}>
            drift calculator
          </button>
          . The runnable code is on <a href={REPO}>GitHub</a>; this site is itself
          built inside a pinned Flox environment, so the medium agrees with the
          message.
        </p>
        <button className="btn btn-ghost" type="button" onClick={() => navigate("#/")}>
          ← Back to projects
        </button>
      </section>
    </main>
  );
}
