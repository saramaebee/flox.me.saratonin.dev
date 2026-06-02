import { navigate } from "../router.tsx";
import type { Project } from "../data/content.ts";

export function ComingSoon({
  project,
  notFound,
}: {
  project?: Project;
  notFound?: boolean;
}) {
  if (notFound || !project) {
    return (
      <main className="container coming-soon">
        <span className="eyebrow">404</span>
        <h1>This page hasn't been built yet</h1>
        <p>The trail went cold. Head back to the project index.</p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate("#/")}
        >
          ← Back home
        </button>
      </main>
    );
  }

  return (
    <main className="container coming-soon">
      <span className="eyebrow">{project.icon} Coming soon</span>
      <h1>{project.title}</h1>
      <p>{project.blurb}</p>
      <p className="card-jd">↳ {project.jd}</p>
      <div style={{ marginTop: "2rem" }}>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => navigate("#/")}
        >
          ← Back to projects
        </button>
      </div>
    </main>
  );
}
