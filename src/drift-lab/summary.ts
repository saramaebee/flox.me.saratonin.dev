// Generated executive summary for the Drift Lab — the paragraph a PMM or AE could
// paste into a follow-up. Built from the active scenarios and resolved state, so
// it always matches what's on screen. Honest about the "explicit-not-magic" path.

import { type Scenario } from "./data.ts";
import { type ResolveResult } from "./model.ts";

export function buildLabSummary(
  active: Scenario[],
  reproMode: boolean,
  result: ResolveResult,
): string {
  if (active.length === 0) {
    return (
      "With no drift introduced, Local, CI, and Production-like agree on every " +
      "assumption. That alignment is the goal. Toggle a scenario to see how a " +
      "single implicit assumption breaks it, then enable Reproducible Environment " +
      "Mode to collapse the differences back into one declared, versioned contract."
    );
  }

  const titles = active.map((s) => s.title.toLowerCase());
  const list =
    titles.length === 1
      ? titles[0]
      : `${titles.slice(0, -1).join(", ")} and ${titles[titles.length - 1]}`;
  const { failing, warning } = result.stats;

  if (!reproMode) {
    const brokenPhrase =
      failing > 0
        ? `${failing} of 3 environments now fail and ${warning} sit in warning`
        : `${warning} of 3 environments now sit in warning`;
    return (
      `Introducing ${active.length} drift ${active.length === 1 ? "scenario" : "scenarios"} ` +
      `(${list}) leaves ${brokenPhrase}. None of these is random: each is an implicit ` +
      `assumption (a runtime version, a system library, an architecture, a lockfile, or a ` +
      `required variable) that no environment agreed to in writing. The code is identical ` +
      `across all three columns; only the inputs underneath it differ, which is exactly the ` +
      `drift that burns engineering hours and weakens build provenance.`
    );
  }

  const explicitOnly = active.filter((s) => s.reproResolves === "explicit");
  const explicitNote =
    explicitOnly.length > 0
      ? ` The exception is the required configuration (e.g. ${explicitOnly[0].title.toLowerCase()}): ` +
        `reproducibility makes the requirement explicit and visible, but a value must still be ` +
        `supplied: the contract is declared, not the secret invented.`
      : "";

  return (
    `With Reproducible Environment Mode on, the same ${active.length} ` +
    `${active.length === 1 ? "scenario" : "scenarios"} (${list}) collapse into one declared ` +
    `definition: ${result.stats.pinnedCells} assumption cells are now pinned and shared across ` +
    `Local, CI, and Production-like instead of inherited from each host. ` +
    `${result.stats.passing} of 3 environments pass.` +
    explicitNote +
    ` The point is that every input is now a versioned, inspectable artifact you ` +
    `declare upfront, instead of an assumption baked into each host.`
  );
}
