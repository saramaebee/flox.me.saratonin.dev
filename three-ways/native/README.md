# Native: fast, familiar, and implicit

Set the app up directly on your machine. This is the baseline everyone knows —
and the one that quietly diverges between any two laptops, because nothing here
pins the *system*: not the Python interpreter, not libpq, not OpenSSL, not the
Postgres you run.

> The pin in [`.python-version`](.python-version) is `3.12.8`. If your machine's
> default `python3` is something else (this repo was built on a host whose
> `python3` is **3.14.2**), you already have drift before installing anything.

## macOS (Apple Silicon)

```bash
# 1. A version manager, because the system python is the wrong version
brew install pyenv
pyenv install 3.12.8
pyenv local 3.12.8                      # honors .python-version

# 2. System libraries the native extensions link against
brew install postgresql@16 libpq jpeg openssl@3

# 3. The env-var dance: keg-only formulae aren't on PATH / pkg-config by default
export PATH="$(brew --prefix libpq)/bin:$PATH"          # so pg_config is found
export LDFLAGS="-L$(brew --prefix openssl@3)/lib -L$(brew --prefix libpq)/lib"
export CPPFLAGS="-I$(brew --prefix openssl@3)/include"
export PKG_CONFIG_PATH="$(brew --prefix openssl@3)/lib/pkgconfig"

# 4. Bring up Postgres yourself
brew services start postgresql@16
createuser -s postgres || true
export DATABASE_URL="postgresql://postgres@127.0.0.1:5432/postgres"

# 5. App deps
python -m venv .venv && source .venv/bin/activate
pip install -r ../app/requirements.txt

# 6. Run
./run.sh
```

## Debian / Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y \
    python3.12 python3.12-venv \
    libpq-dev libjpeg-dev zlib1g-dev build-essential \
    postgresql-16
# cryptography from source also needs: rustc cargo
sudo systemctl start postgresql
sudo -u postgres createuser -s "$USER" || true
export DATABASE_URL="postgresql://postgres@127.0.0.1:5432/postgres"
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r ../app/requirements.txt
./run.sh
```

## Failure modes this path leaves open

Modern wheels mean steps 5 often *just works* — until it doesn't. The failures
below are what teams actually hit; which ones bite depends on the machine, which
is exactly the problem.

| Symptom | Root cause | When it bites |
| --- | --- | --- |
| `Error: pg_config executable not found` | libpq keg-only / not on PATH | building psycopg from source (`--no-binary`, air-gapped, odd arch) |
| `Can not find Rust compiler` | `cryptography` builds from source | no wheel for your platform/pip |
| `The headers or library files could not be found for jpeg` | libjpeg/zlib headers missing | building Pillow from source |
| subtle ABI / wheel mismatch | `python3` is 3.11 / 3.13 / 3.14, not the pinned 3.12 | any machine whose default differs |
| `libpq.so.5: version not found` at runtime | built against one libpq, host has another | upgrade/downgrade Postgres later |
| "works on my machine" | nothing pins the system layer | a second engineer, or CI |

Compare with the [Docker](../docker/README.md) and [Flox](../flox/README.md)
paths, which move these from "hope it matches" to "pinned."
