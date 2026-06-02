#!/usr/bin/env bash
# Start the app against a Postgres you installed and started yourself.
# This script is the *end* of the native setup — everything in README.md has to
# already be true for it to work. It does not manage the database for you.
set -euo pipefail

cd "$(dirname "$0")/.."   # -> three-ways/

: "${DATABASE_URL:?set DATABASE_URL, e.g. postgresql://postgres@127.0.0.1:5432/postgres}"
export SIGNING_KEY="${SIGNING_KEY:-dev-demo-key}"

if [ ! -d .venv ]; then
  echo "→ creating venv (expects the pinned python — see .python-version)"
  python -m venv .venv
  ./.venv/bin/pip install --upgrade pip
  ./.venv/bin/pip install -r app/requirements.txt
fi

exec ./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
