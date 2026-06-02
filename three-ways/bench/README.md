# Benchmarks: measured numbers, clearly labeled

`measure.sh` records only what it can observe on the machine it runs on, and
stamps every number with provenance (`os`/`arch`/date/versions) into
[`results/results.json`](results/results.json). The site imports that file as
the single source of truth, so the page and the runnable demo can't drift apart.

## What is measured (observed)

- **Docker** cold build (`--no-cache`), warm build (cached), final image size.
- **Flox** cold activate (fresh cache: `initdb` + venv + pinned install), warm
  activate.
- **Artifact-hash drift**: the same `app/sample.jpg` posted to the identical app
  running under Docker vs. Flox, comparing the returned `sha256`. A difference is
  real environment drift, not a bug: the identical pinned `Pillow` resolves to a
  different platform build in each environment (Docker runs the Linux wheel, the
  Flox path the native macOS wheel), each bundling its own image codecs. Pinning
  the packages doesn't pin the environment — that's the whole thesis in one number.

## What is NOT measured here (reasoned)

We run on one machine (see `provenance` in the JSON). We do **not** fabricate:

- **Cross-arch / cross-OS numbers.** The native failure matrix on the site marks
  each cell `observed` or `reasoned`; reasoned cells cite the mechanism
  (e.g. Homebrew keg-only `libpq` → `pg_config` off PATH) rather than a timing.
- **Native cold-setup wall-clock.** The native path deliberately mutates the host
  (brew/apt/pyenv), so we don't run it inside the harness; its cost is described
  qualitatively in `record.md` and [`native/README.md`](../native/README.md).
- **QEMU-emulated timings.** If you fill Linux/x86 cells from an Apple-Silicon
  Mac via emulation, label them emulated; they don't reflect native silicon.

See [`record.md`](record.md) for the human-observed notes that don't reduce to a
single number.
