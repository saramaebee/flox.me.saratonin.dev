# Flox: one declarative contract

The entire environment is [`​.flox/env/manifest.toml`](.flox/env/manifest.toml):
the CPython runtime, the Postgres server, and every system library the app
links against, pinned together in one lockfile, for all four
`aarch64/x86_64 × darwin/linux` systems.

## Run it

```bash
cd three-ways/flox
flox activate --start-services        # python 3.12 + Postgres, both up
# in the activated shell:
curl -F file=@../app/sample.jpg localhost:8000/thumbnail
curl localhost:8000/thumbnails
```

First activation runs the `[hook]`: it `initdb`s a local Postgres cluster under
the env cache and builds a venv from the **pinned** `app/requirements.txt`.
Because python, libpq, OpenSSL and libjpeg all come from the env, `pip install`
finds everything with **zero extra environment variables**, unlike the
`PKG_CONFIG_PATH` / `LDFLAGS` / `pg_config`-on-PATH dance the
[native path](../native/README.md) needs.

Two services are declared, so `--start-services` brings up the whole stack with
no separate database install and no compose file:

- `postgres`: the database, from the same pinned `postgresql_16`
- `api`: `uvicorn` served from the venv the hook built

## Dev and prod from the same source

```bash
flox containerize -f thumbprint.tar       # OCI image from the SAME manifest
docker load -i thumbprint.tar             # or: flox containerize --runtime docker
```

The container's toolchain is byte-for-byte the dev shell's. There is no
"works in dev, breaks in the image" gap, because dev and the image resolve from
one lockfile.

> **Honest scope.** `flox containerize` packages the *environment closure*
> (python + postgres + libs, measured here at ~432 MB). The application code
> and venv live in the project directory, so a production image adds the app on
> top via a [`[build]`](https://flox.dev/docs/concepts/manifest-builds/) stage
> or a `COPY`. What Flox eliminates is the hard, drift-prone part: the runtime
> and system-library contract. It leaves the trivial "copy my code in" step to you.

## What stays pinned vs. what doesn't

| Concern | Native | Docker | Flox |
| --- | --- | --- | --- |
| Python version | host default (drifts) | base image (pin the digest) | manifest (pinned) |
| System libs (libpq/OpenSSL/jpeg) | host, unpinned | base image + apt | manifest (pinned) |
| Postgres | install + start yourself | `db` service | `postgres` service |
| Dev shell == prod image | n/a | **no** (shell ≠ container) | **yes** (one lock) |
