// The copy-paste GTM payload — a paragraph an AE or PMM can lift directly,
// grounded in the page's own measured numbers. Mirrors calc/summary.ts.

import { timings, drift, driftPoints, driftSurface } from "./data.ts";

export function buildComparisonSummary(): string {
  const dockerHash = drift.docker_sha256.slice(0, 8);
  const floxHash = drift.flox_sha256.slice(0, 8);
  return [
    `We built one identical app three ways: native, Docker, and Flox.`,
    `Native pins nothing below the application: the runtime, system libraries,`,
    `and database all drift per machine (${driftSurface("native")} of ${driftPoints.length} drift points left open).`,
    `Docker packages the app well (${timings.docker.cold_build_s}s cold build,`,
    `${timings.docker.image_size} image) but the container isn't the shell engineers`,
    `develop in, so it leaves ${driftSurface("docker")} drift points open.`,
    `Flox pins the runtime and database in one declarative manifest`,
    `(${timings.flox.cold_activate_s}s to a running stack) and renders that same`,
    `environment as a production image, closing the dev/prod gap by construction`,
    `(${driftSurface("flox")} drift points open).`,
    `The proof: the same image posted to the same app returned different SHA-256`,
    `hashes under Docker (${dockerHash}…) and Flox (${floxHash}…) — identical pinned`,
    `packages still resolve to different platform builds, each bundling its own image codecs.`,
    `Pinning your packages doesn't pin your environment. Reproducibility does.`,
  ].join(" ");
}
