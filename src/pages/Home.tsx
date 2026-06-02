import { navigate } from "../router.tsx";
import { ProjectGrid } from "../components/ProjectGrid.tsx";
import { site } from "../data/content.ts";

export function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">{site.theme}</span>
          <h1>What's actually inside your software?</h1>
          <p className="lede">{site.tagline}</p>
          <div className="hero-cta">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate("#/npm-install")}
            >
              ▶ Run the npm install walkthrough
            </button>
            <a
              className="btn btn-ghost"
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("projects")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See all projects
            </a>
          </div>
          <p className="signature">
            Built by <strong>{site.name}</strong>: software supply chain,
            SBOMs &amp; provenance, reproducible environments.
          </p>
        </div>
      </section>

      <section className="section" id="projects">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">The work</span>
            <h2>Technical narratives, tools &amp; comparisons</h2>
          </div>
          <ProjectGrid />
        </div>
      </section>
    </main>
  );
}
