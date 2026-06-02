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
          <a
            href="#/npm-install"
            className={active === "npm-install" ? "active" : ""}
            onClick={(e) => go(e, "#/npm-install")}
          >
            npm install
          </a>
          {projects
            .filter((p) => p.status === "soon")
            .map((p) => (
              <a
                key={p.slug}
                href={p.route}
                className={
                  "nav-hide-sm" + (active === p.slug ? " active" : "")
                }
                onClick={(e) => go(e, p.route)}
              >
                {p.slug === "drift-calculator"
                  ? "drift"
                  : p.slug === "three-ways"
                    ? "three ways"
                    : "translator"}
              </a>
            ))}
        </div>
      </div>
    </nav>
  );
}
