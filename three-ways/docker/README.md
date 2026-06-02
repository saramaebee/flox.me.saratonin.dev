# Docker: packaging, with a second source of truth

```bash
cd three-ways
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up --build
# then:
curl -F file=@app/sample.jpg localhost:8000/thumbnail
curl localhost:8000/thumbnails
```

Docker genuinely fixes the worst of the native problems: the base image pins
the OS and (if you pin the digest) the system packages, and `db` is a service
instead of a manual install. For *shipping* the app, this is great.

## The friction it leaves on the table

- **Two sources of truth.** The `Dockerfile`'s `apt-get install libpq-dev …`
  and the [native README](../native/README.md)'s `brew install libpq …` are the
  same knowledge written twice, and they drift apart. The container is not the
  environment engineers actually develop in.
- **Dev ≠ prod shell.** Your editor, LSP, `psql`, and debugger run on the host
  against a *different* Python and libpq than the container. "It works in the
  container" and "it works in my editor" are two different claims.
- **Cache invalidation.** Editing `app/` busts layers; a cold cache (fresh CI
  runner) or a `--no-binary` build pays the full compile cost every time.
- **Tag drift.** `python:3.12-slim` and `postgres:16` move under you unless
  pinned by `@sha256`. The Dockerfile here pins the patch version as a
  compromise; the compose `postgres:16` deliberately does not, to show the gap.
- **Secrets.** `.env` is plaintext that both compose and the app read.
- **Apple Silicon.** Pulling an `amd64`-only image runs under QEMU emulation;
  `buildx --platform linux/amd64` on an M-series Mac is slow for the same reason.
- **Bind-mount UID/GID.** Mount host code into the container for live-reload and
  you hit ownership mismatches (host user vs. container user) on Linux hosts.
