import { navigate } from "../router.tsx";
import { projects } from "../data/content.ts";

export function Nav({ route }: { route: string }) {
  const go = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    navigate(to);
  };
  const active = route.replace(/^\//, "").split("/")[0];

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#/" className="nav-brand" onClick={(e) => go(e, "#/")}>
          <span className="nav-dot" aria-hidden />
          supply&nbsp;chains, understood
        </a>
        <div className="nav-links">
          {projects.map((p) => {
            const classes = [
              p.status === "soon" ? "nav-hide-sm" : "",
              active === p.slug ? "active" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <a
                key={p.slug}
                href={p.route}
                className={classes}
                onClick={(e) => go(e, p.route)}
              >
                {p.navLabel}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
