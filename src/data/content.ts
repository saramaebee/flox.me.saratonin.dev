// Site copy + project metadata. Kept in one place so the narrative stays
// consistent across the home grid, nav, and individual pages.

export type ProjectStatus = "live" | "soon";

export interface Project {
  slug: string;
  route: string;
  icon: string;
  title: string;
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
    blurb:
      "A calculator that turns engineers, deployments, and incidents into estimated hours lost — and the reproducibility savings on the other side.",
    status: "soon",
    jd: "Develop ROI frameworks and enablement tools.",
  },
  {
    slug: "three-ways",
    route: "#/three-ways",
    icon: "🧪",
    title: "I Rebuilt the Same Environment Three Ways",
    blurb:
      "Native vs. Docker vs. Nix/Flox — setup time, reproducibility, failure modes, and team onboarding, with terminal recordings and benchmarks. (This very site is the Flox case study.)",
    status: "soon",
    jd: "Construct product comparisons and technical narratives.",
  },
  {
    slug: "translator",
    route: "#/translator",
    icon: "🤖",
    title: "Infrastructure Translator",
    blurb:
      "Describe a build problem in plain language; get back root-cause analysis, environment risks, and reproducibility recommendations. A small demonstration of AI as leverage.",
    status: "soon",
    jd: "Operate agentically. Use AI as leverage.",
  },
];

export const projectBySlug = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);
