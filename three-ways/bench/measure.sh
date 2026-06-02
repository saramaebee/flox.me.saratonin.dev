#!/usr/bin/env bash
# Reproducible benchmark harness for the three procurement strategies.
#
# It records ONLY what it can actually observe on the machine it runs on, and
# stamps every number with provenance (os/arch/date/tool versions). It does NOT
# invent cross-platform numbers — see bench/README.md for how the failure
# matrix separates "observed" from "reasoned" cells.
#
# Usage:  cd three-ways && bench/measure.sh
# Output: bench/results/results.json  (committed; the site imports it)
set -uo pipefail
cd "$(dirname "$0")/.."   # -> three-ways/
mkdir -p bench/results

now() { date +%s.%N; }
elapsed() { awk "BEGIN{printf \"%.1f\", $2 - $1}"; }

OS="$(uname -s)"; ARCH="$(uname -m)"; STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
HOST_PY="$(python3 --version 2>&1 | cut -d' ' -f2)"

echo "→ measuring on $OS/$ARCH (host python3 = $HOST_PY)"

# ---- Docker: cold build, warm build, image size ---------------------------
echo "→ docker: cold build (--no-cache)…"
t0=$(now); docker compose -f docker/docker-compose.yml build --no-cache >/dev/null 2>&1; t1=$(now)
DOCKER_COLD=$(elapsed "$t0" "$t1")
echo "→ docker: warm build (cached)…"
t0=$(now); docker compose -f docker/docker-compose.yml build >/dev/null 2>&1; t1=$(now)
DOCKER_WARM=$(elapsed "$t0" "$t1")
# Use the `docker images` reported size (human string, e.g. "347MB"); the
# inspect .Size field under-reports on this Docker version.
DOCKER_SIZE=$(docker images docker-app:latest --format '{{.Size}}' 2>/dev/null | head -1)

# ---- Flox: cold activate (no cache), warm activate ------------------------
echo "→ flox: cold activate (fresh cache)…"
rm -rf flox/.flox/cache
t0=$(now); ( cd flox && flox activate -- true ) >/dev/null 2>&1; t1=$(now)
FLOX_COLD=$(elapsed "$t0" "$t1")
echo "→ flox: warm activate…"
t0=$(now); ( cd flox && flox activate -- true ) >/dev/null 2>&1; t1=$(now)
FLOX_WARM=$(elapsed "$t0" "$t1")

# ---- Artifact-hash drift: same app + input, two environments --------------
# Brings up each stack, posts the SAME sample.jpg, records the returned sha256.
# A difference is real, observed environment drift, not a bug: the same pinned
# Pillow resolves to a different platform build per environment, each bundling
# its own image codecs.
hash_from() { curl -s -F file=@app/sample.jpg localhost:8000/thumbnail | sed -n 's/.*"sha256":"\([0-9a-f]*\)".*/\1/p'; }

echo "→ drift check: docker…"
docker compose -f docker/docker-compose.yml up -d >/dev/null 2>&1
for i in $(seq 1 40); do curl -sf localhost:8000/health >/dev/null 2>&1 && break; sleep 1; done
DOCKER_HASH=$(hash_from)
docker compose -f docker/docker-compose.yml down -v >/dev/null 2>&1

echo "→ drift check: flox…"
FLOX_HASH=$( cd flox && flox activate --start-services -- bash -c '
  for i in $(seq 1 40); do curl -sf localhost:8000/health >/dev/null 2>&1 && break; sleep 1; done
  curl -s -F file=@"$APP_ROOT/app/sample.jpg" localhost:8000/thumbnail' 2>/dev/null \
  | sed -n 's/.*"sha256":"\([0-9a-f]*\)".*/\1/p' )

cat > bench/results/results.json <<JSON
{
  "provenance": {
    "measured_at": "$STAMP",
    "os": "$OS",
    "arch": "$ARCH",
    "host_python": "$HOST_PY",
    "note": "Wall-clock numbers are from a single $OS/$ARCH machine. They are illustrative of magnitude, not universal."
  },
  "timings": {
    "docker": { "cold_build_s": $DOCKER_COLD, "warm_build_s": $DOCKER_WARM, "image_size": "${DOCKER_SIZE:-unknown}" },
    "flox":   { "cold_activate_s": $FLOX_COLD, "warm_activate_s": $FLOX_WARM, "container_size": "432MB (manual: flox containerize)" }
  },
  "drift": {
    "docker_sha256": "${DOCKER_HASH:-null}",
    "flox_sha256": "${FLOX_HASH:-null}",
    "same": $( [ "${DOCKER_HASH:-x}" = "${FLOX_HASH:-y}" ] && echo true || echo false )
  }
}
JSON
echo "→ wrote bench/results/results.json"
cat bench/results/results.json
