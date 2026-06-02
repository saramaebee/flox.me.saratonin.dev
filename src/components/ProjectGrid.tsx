import { navigate } from "../router.tsx";
import { projects, type Project } from "../data/content.ts";

function Card({ project }: { project: Project }) {
  const live = project.status === "live";
  const onActivate = () => {
    if (live) navigate(project.route);
  };
  return (
    <button
      className="card"
      aria-disabled={!live}
      onClick={onActivate}
      type="button"
    >
      <span className={`card-tag ${live ? "live" : "soon"}`}>
        {live ? "Live" : "Coming soon"}
      </span>
      <span className="card-icon" aria-hidden>
        {project.icon}
      </span>
      <h3>{project.title}</h3>
      <p>{project.blurb}</p>
      <span className="card-jd">↳ {project.jd}</span>
    </button>
  );
}

export function ProjectGrid() {
  return (
    <div className="grid">
      {projects.map((p) => (
        <Card key={p.slug} project={p} />
      ))}
    </div>
  );
}
