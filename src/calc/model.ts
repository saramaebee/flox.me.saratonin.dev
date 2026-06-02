// The environment-drift cost model — pure functions, no React.
// This is the single source of truth for the math, kept transparent on purpose:
// every output traces back to an input the visitor can see and change.
//
// The constants are pinned by the canonical example in the spec (a 50-engineer
// team): it reconciles to exactly 3,420 drift hours and $328,846, which fixes
// both WORK_HOURS_PER_YEAR and the per-category coefficients. See model.test.ts.

/** Standard fully-loaded engineering year: 52 weeks × 40 hours. */
export const WORK_HOURS_PER_YEAR = 2080;

export interface DriftInputs {
  /** Engineers on the team — scope of the recurring productivity loss. */
  engineers: number;
  /** Average fully-loaded engineering cost per year, in dollars. */
  fullyLoadedCost: number;
  /** New hires per quarter — onboarding drag. */
  newHiresPerQuarter: number;
  /** Deployments per week — contextual exposure, surfaced in prose, not the math. */
  deploysPerWeek: number;
  /** Drift-related incidents per month (config/env mismatch in prod or staging). */
  incidentsPerMonth: number;
  /** Average hours lost per incident (cross-functional debugging). */
  hrsPerIncident: number;
  /** Local setup/debug hours per engineer per month — the everyday tax. */
  localSetupHrsPerEngPerMonth: number;
  /** CI/build failures caused by environment mismatch, per week. */
  ciFailuresPerWeek: number;
  /** Average hours per CI/build failure (diagnose + retry). */
  hrsPerCiFailure: number;
  /** Onboarding drift hours lost per hire (the formula's hidden constant, ≈40). */
  onboardingHrsPerHire: number;
  /** Expected reduction from reproducibility, as a fraction 0–1. */
  reductionRate: number;
}

/** One row of the drift breakdown — used by the chart and the detail view. */
export interface DriftCategory {
  key: "local" | "incidents" | "ci" | "onboarding";
  label: string;
  hours: number;
}

export interface DriftOutputs {
  hourlyCost: number;
  annualDriftHours: number;
  annualDriftCost: number;
  recoverableHours: number;
  recoverableSavings: number;
  /** Cost that remains after reproducibility — the "projected" bar. */
  residualCost: number;
  fteRecovered: number;
  breakdown: DriftCategory[];
}

export function computeDrift(i: DriftInputs): DriftOutputs {
  const localHours = i.localSetupHrsPerEngPerMonth * i.engineers * 12;
  const incidentHours = i.incidentsPerMonth * i.hrsPerIncident * 12;
  const ciHours = i.ciFailuresPerWeek * i.hrsPerCiFailure * 52;
  const onboardingHours = i.newHiresPerQuarter * i.onboardingHrsPerHire * 4;

  const annualDriftHours = localHours + incidentHours + ciHours + onboardingHours;
  const hourlyCost = i.fullyLoadedCost / WORK_HOURS_PER_YEAR;
  const annualDriftCost = annualDriftHours * hourlyCost;

  const recoverableHours = annualDriftHours * i.reductionRate;
  const recoverableSavings = annualDriftCost * i.reductionRate;

  return {
    hourlyCost,
    annualDriftHours,
    annualDriftCost,
    recoverableHours,
    recoverableSavings,
    residualCost: annualDriftCost - recoverableSavings,
    fteRecovered: recoverableHours / WORK_HOURS_PER_YEAR,
    breakdown: [
      { key: "local", label: "Local setup & “works on my machine”", hours: localHours },
      { key: "incidents", label: "Drift-related incidents", hours: incidentHours },
      { key: "ci", label: "CI / build failures", hours: ciHours },
      { key: "onboarding", label: "Onboarding drag", hours: onboardingHours },
    ],
  };
}
