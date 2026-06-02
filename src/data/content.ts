// Site copy + project metadata. Kept in one place so the narrative stays
// consistent across the home grid, nav, and individual pages.

export type ProjectStatus = "live" | "soon";

export interface Project {
  slug: string;
  route: string;
  icon: string;
  title: string;
  /** Short label used in the header nav. */
  navLabel: string;
  blurb: string;
  status: ProjectStatus;
  /** The Flox Technical Product Marketing Lead JD line this project speaks to. */
  jd: string;
}

export const site = {
  name: "Sara Beaudet",
  theme: "Making software supply chains understandable",
  tagline:
    "Interactive technical narratives about what's really inside your software — dependencies, SBOMs, provenance, and reproducible-by-construction environments.",
  repo: "https://github.com/saramaebee",
  linkedin: "https://www.linkedin.com/in/sara-mae-beaudet/",
  mainSite: "https://me.saratonin.dev",
};

export const projects: Project[] = [
  {
    slug: "npm-install",
    route: "#/npm-install",
    icon: "📦",
    title: "What Actually Happens When You Run npm install?",
    navLabel: "npm install",
    blurb:
      "An interactive walkthrough: from a five-line package.json to hundreds of transitive dependencies, a vulnerability buried deep in the tree, the SBOM that captures it, provenance verification, and the reproducible alternative.",
    status: "live",
    jd: "Translate technical depth into a narrative a CTO understands in two minutes.",
  },
  {
    slug: "drift-calculator",
    route: "#/drift-calculator",
    icon: "📉",
    title: "The Cost of Environment Drift",
    navLabel: "drift cost",
    blurb:
      "An ROI model for the hidden tax of non-reproducible developer environments: lost engineering hours, incident drag, onboarding delay — and the recoverable capacity on the other side. Includes presets and a generated executive summary.",
    status: "live",
    jd: "Develop ROI frameworks and enablement tools.",
  },
  {
    slug: "three-ways",
    route: "#/three-ways",
    icon: "🧪",
    title: "Same App, Three Environments",
    navLabel: "three ways",
    blurb:
      "One identical app, set up native vs. Docker vs. Flox — with real benchmarks and the drift surface each leaves open. The punchline: the same image posted to the same app returns different hashes under Docker and Flox. (This very site is the Flox case study.)",
    status: "live",
    jd: "Construct product comparisons and technical narratives.",
  },
  {
    slug: "drift-lab",
    route: "#/drift-lab",
    icon: "🔬",
    title: "Local-to-CI Drift Lab",
    navLabel: "drift lab",
    blurb:
      "An interactive lab: three columns — Local, CI, Production-like — that break in real time as you toggle drift scenarios (runtime versions, system libraries, architecture, lockfiles, secrets, CUDA). Then a Reproducible Environment Mode collapses the implicit assumptions into one declared, versioned contract.",
    status: "live",
    jd: "Turn a developer-felt problem into a visual narrative a platform buyer acts on.",
  },
];

export const projectBySlug = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);
