# Same App, Three Environments

One small app — a FastAPI "thumbprint" service that thumbnails an image
(**Pillow** → libjpeg/zlib), signs it (**cryptography** → OpenSSL), and records
it in **Postgres** (**psycopg** → libpq), pinned to **CPython 3.12** — set up
three different ways. The application source in [`app/`](app/) is **identical**
across all three; only how the runtime, system libraries, and database are
*procured* changes.

> This is the runnable companion to the article at
> [flox.me.saratonin.dev/#/three-ways](https://flox.me.saratonin.dev/#/three-ways).
> Clone it, run it, argue with the numbers.

| | how to run | what it pins | the gap it leaves |
| --- | --- | --- | --- |
| [native/](native/) | `./run.sh` (after a host setup) | nothing system-level | every machine drifts |
| [docker/](docker/) | `docker compose … up --build` | base image + apt | dev shell ≠ prod image; second source of truth |
| [flox/](flox/) | `flox activate --start-services` | runtime + libs + db, one lock | — (dev shell *is* the contract) |

## The app, exercised

```bash
curl -F file=@app/sample.jpg localhost:8000/thumbnail   # Pillow + cryptography + psycopg
curl localhost:8000/thumbnails                          # reads it back from Postgres
```

## The punchline, as one number

Post the *same* `sample.jpg` to the *same* app under Docker and under Flox and
compare the returned `sha256`. They differ — because the `libjpeg` that decodes
the image is not the same library in the two environments. Same code, same
input, different artifact. That is environment drift, made measurable. See
[`bench/`](bench/) for the harness and [`results.json`](bench/results/results.json).

## Layout

```
app/      the shared application (identical across all three)
native/   host setup (README + run.sh) — the implicit baseline
docker/   Dockerfile + compose — packaging, with a second source of truth
flox/     manifest.toml — one declarative contract for dev AND prod
bench/    measure.sh + results.json — observed numbers, honestly labeled
```
