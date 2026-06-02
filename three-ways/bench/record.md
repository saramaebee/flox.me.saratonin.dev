# Observed notes

Hand-recorded observations from running the three paths on the build machine.
The machine-readable numbers live in [`results/results.json`](results/results.json);
this file holds what doesn't reduce to a single number.

## Machine

- macOS (Darwin 25.1.0), Apple Silicon (`arm64`).
- Host `python3` is **3.14.2**, i.e. *not* the `3.12.8` the app pins. Version
  drift exists before any dependency is installed. (observed)

## Flox path (observed)

- `flox activate` resolved **python 3.12.13** and `postgresql_16` from the
  manifest; `pip install` of the pinned deps needed **no** `LDFLAGS` /
  `PKG_CONFIG_PATH` / `pg_config`-on-PATH env vars.
- `flox activate --start-services` brought up Postgres + the API together; all
  three endpoints returned 200 (`/health`, `/thumbnail`, `/thumbnails`).
- `flox containerize` produced a loadable OCI image of **~432 MB** (the
  environment closure: python + postgres + libs; the app is added on top).

## Docker path (observed)

- Multi-stage build succeeded; final `docker-app:latest` image was **~347 MB**.
- Warm (cached) rebuild was sub-second; the cold `--no-cache` build pays the
  apt + pip cost in full (see `results.json`).
- Stack came up via compose with the `db` healthcheck gating the `app` start;
  all endpoints returned 200.

## The drift finding (observed, the headline)

Posting the identical `app/sample.jpg` to the identical app:

- under **Flox**, `/thumbnail` returned `sha256` starting `7c002f79…`
  (thumbnail = 92 bytes)
- under **Docker**, it returned `sha256` starting `c7f0b7c9…`
  (thumbnail = 82 bytes)

Same source, same input, **different output hash**, because the `libjpeg` that
decodes the JPEG differs between nixpkgs (Flox) and Debian (Docker). This is the
clearest possible demonstration that pinning your *Python packages* does not pin
your *system libraries*. `results.json` records the exact hashes from the latest
run.

## Native path (reasoned, not run in-harness)

The native setup mutates the host (brew/pyenv/apt), so it is documented rather
than executed by `measure.sh`. Failure modes are enumerated in
[`native/README.md`](../native/README.md); on the site they are marked
`reasoned` with the mechanism cited, never given a fabricated timing.
