# thumbprint — the Docker procurement strategy.
#
# Multi-stage: a fat builder that compiles wheels (and would build psycopg /
# cryptography from source if no wheel were available), and a slim runtime that
# carries only what the app needs at run time. This is the honest cost of the
# container approach: you pin the *base image* and the *system packages*, which
# is a real improvement over native — but it is a SECOND source of truth that
# has to be kept in sync with how engineers set up their machines, and the
# image is not the shell you actually develop in.

# ---- builder ---------------------------------------------------------------
# Pin by digest, not just tag — `python:3.12-slim` drifts over time.
FROM python:3.12.8-slim-bookworm AS builder

# System libraries needed to BUILD the native extensions. If wheels are
# available these go unused; with --no-binary or on an odd arch they are load-
# bearing. libpq-dev -> pg_config; libjpeg/zlib -> Pillow; build-essential +
# the rust toolchain -> cryptography from source.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libjpeg-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
# Copy the SHARED app from the repo (build context is three-ways/, see compose).
COPY app/requirements.txt ./requirements.txt
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ---- runtime ---------------------------------------------------------------
FROM python:3.12.8-slim-bookworm AS runtime

# Only the RUNTIME shared libraries (no -dev headers, no compiler).
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        libjpeg62-turbo \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /srv
COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
