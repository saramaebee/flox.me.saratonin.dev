import { site } from "../data/content.ts";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <a
            className="flox-badge"
            href="https://flox.dev"
            target="_blank"
            rel="noopener noreferrer"
            title="This site is built and deployed inside a Flox environment and a Nix flake."
          >
            <span className="dot" aria-hidden />
            Built with Flox, reproducible by construction
          </a>
          <div className="footer-links">
            <a href={site.mainSite} target="_blank" rel="noopener noreferrer">
              me.saratonin.dev
            </a>
            <a href={site.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={site.repo} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
        <p className="disclaimer">
          An independent portfolio project by {site.name}. Not affiliated with
          or endorsed by Flox. Brand styling references flox.dev to demonstrate
          product-marketing fit.
        </p>
      </div>
    </footer>
  );
}
