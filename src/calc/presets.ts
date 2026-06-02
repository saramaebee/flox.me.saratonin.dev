// Scenario presets. Each one reframes the same model for a different buyer and
// rewrites the inputs + the narrative lead-in. The ML preset is the sharpest fit
// for Flox's posting (CUDA builds, GPU drivers), so it carries the most specific copy.

import type { DriftInputs } from "./model.ts";

export interface Preset {
  key: string;
  label: string;
  /** One line under the pill row describing who this models. */
  blurb: string;
  /** Narrative lead-in shown above the calculator when this preset is active. */
  narrative: string;
  inputs: DriftInputs;
}

export const presets: Preset[] = [
  {
    key: "enterprise",
    label: "Enterprise platform team",
    blurb: "A 50-engineer org standardizing environments across many services.",
    narrative:
      "Environment drift is not just developer annoyance. Across a platform org it compounds — broken local setup, “works on my machine” debugging, CI mismatches, deployment rollbacks, and onboarding delay all draw from the same engineering budget.",
    inputs: {
      engineers: 50,
      fullyLoadedCost: 200_000,
      newHiresPerQuarter: 5,
      deploysPerWeek: 20,
      incidentsPerMonth: 3,
      hrsPerIncident: 12,
      localSetupHrsPerEngPerMonth: 3,
      ciFailuresPerWeek: 5,
      hrsPerCiFailure: 1.5,
      onboardingHrsPerHire: 40,
      reductionRate: 0.7,
    },
  },
  {
    key: "startup",
    label: "Startup scaling fast",
    blurb: "A small team hiring quickly, where every onboarding day counts.",
    narrative:
      "When you’re scaling fast, drift shows up as onboarding drag and context-switching. Every engineer-week lost to broken local setup is a week not spent shipping the thing investors are watching.",
    inputs: {
      engineers: 15,
      fullyLoadedCost: 180_000,
      newHiresPerQuarter: 6,
      deploysPerWeek: 35,
      incidentsPerMonth: 2,
      hrsPerIncident: 8,
      localSetupHrsPerEngPerMonth: 5,
      ciFailuresPerWeek: 4,
      hrsPerCiFailure: 1.5,
      onboardingHrsPerHire: 60,
      reductionRate: 0.65,
    },
  },
  {
    key: "ml",
    label: "ML infrastructure team",
    blurb: "GPU-bound builds where CUDA and driver mismatches dominate the tax.",
    narrative:
      "Environment drift in ML infrastructure is not just dependency mismatch. It is GPU driver versions, CUDA compatibility, Python packaging, model-serving dependencies, and local-to-production inconsistency — each a failure mode that can burn hours per build and block a researcher cold.",
    inputs: {
      engineers: 30,
      fullyLoadedCost: 240_000,
      newHiresPerQuarter: 5,
      deploysPerWeek: 12,
      incidentsPerMonth: 4,
      hrsPerIncident: 14,
      localSetupHrsPerEngPerMonth: 4,
      ciFailuresPerWeek: 10,
      hrsPerCiFailure: 4,
      onboardingHrsPerHire: 80,
      reductionRate: 0.75,
    },
  },
  {
    key: "regulated",
    label: "Regulated software team",
    blurb: "Where reproducibility is also an audit, provenance, and control story.",
    narrative:
      "In regulated software, reproducibility is more than productivity — it underwrites provenance, dependency control, and auditability. Drift here carries compliance risk on top of the engineering hours it quietly consumes.",
    inputs: {
      engineers: 80,
      fullyLoadedCost: 210_000,
      newHiresPerQuarter: 4,
      deploysPerWeek: 8,
      incidentsPerMonth: 5,
      hrsPerIncident: 16,
      localSetupHrsPerEngPerMonth: 3,
      ciFailuresPerWeek: 6,
      hrsPerCiFailure: 2,
      onboardingHrsPerHire: 50,
      reductionRate: 0.7,
    },
  },
];

/** The preset a visitor lands on. */
export const defaultPreset = presets[0];
