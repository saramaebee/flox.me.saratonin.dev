"""thumbprint — a deliberately native-dependency-heavy demo service.

One small FastAPI app, used as the *identical* subject for three different
environment-procurement strategies (native, Docker, Flox). The app source never
changes between them; only how the runtime, system libraries, and Postgres are
provisioned does. That is the whole point of the experiment.

It is intentionally written to exercise the dependencies that cause real
environment drift:

  - Pillow      -> libjpeg / zlib            (image decode + thumbnail)
  - cryptography -> OpenSSL (+ Rust to build) (HMAC signature)
  - psycopg      -> libpq / pg_config        (Postgres persistence)
  - pinned CPython 3.12                       (runtime-version drift)

See three-ways/README.md for the comparison.
"""

from __future__ import annotations

import io

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from . import db
from .imaging import make_thumbnail
from .signing import sign

app = FastAPI(title="thumbprint", version="1.0.0")


@app.on_event("startup")
def _startup() -> None:
    db.init_schema()


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness + a Postgres round-trip, so 'healthy' means the whole stack works."""
    db.ping()
    return {"status": "ok"}


@app.post("/thumbnail")
async def thumbnail(file: UploadFile) -> JSONResponse:
    """Accept an image, thumbnail it (Pillow), sign it (cryptography),
    record it (psycopg). Exercises every native dependency in one request."""
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty upload")

    try:
        thumb, width, height = make_thumbnail(raw)
    except Exception as exc:  # noqa: BLE001 - surface decode failures to the client
        raise HTTPException(status_code=415, detail=f"could not decode image: {exc}")

    digest, signature = sign(thumb)
    record = db.record_thumbnail(
        filename=file.filename or "upload",
        width=width,
        height=height,
        sha256=digest,
        signature=signature,
    )
    return JSONResponse(
        {
            "id": record["id"],
            "filename": record["filename"],
            "width": width,
            "height": height,
            "sha256": digest,
            "signature": signature,
            "thumbnail_bytes": len(thumb),
        }
    )


@app.get("/thumbnails")
def thumbnails(limit: int = 20) -> dict[str, list[dict]]:
    """List recent rows — proves the DB connection round-trips."""
    return {"thumbnails": db.recent(limit=limit)}
