"""Postgres persistence via psycopg (v3).

psycopg is the load-bearing native dependency here: it links against libpq, and
building it from source needs `pg_config` on PATH. The connection string comes
from $DATABASE_URL so each procurement strategy can wire it differently:

  - native: a Postgres you installed and started yourself
  - docker: the `db` service on the compose network
  - flox:   the `postgres` service started by `flox activate --start-services`
"""

from __future__ import annotations

import os
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

_SCHEMA = (Path(__file__).parent / "schema.sql").read_text()


def _dsn() -> str:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError(
            "DATABASE_URL is not set. Each environment is responsible for "
            "providing a reachable Postgres — see three-ways/README.md."
        )
    return dsn


def _connect() -> psycopg.Connection:
    return psycopg.connect(_dsn(), row_factory=dict_row)


def init_schema() -> None:
    with _connect() as conn:
        conn.execute(_SCHEMA)
        conn.commit()


def ping() -> None:
    with _connect() as conn:
        conn.execute("SELECT 1")


def record_thumbnail(
    *, filename: str, width: int, height: int, sha256: str, signature: str
) -> dict:
    with _connect() as conn:
        row = conn.execute(
            """
            INSERT INTO thumbnails (filename, width, height, sha256, signature)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, filename, created_at
            """,
            (filename, width, height, sha256, signature),
        ).fetchone()
        conn.commit()
        return row


def recent(*, limit: int = 20) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, filename, width, height, sha256, created_at
            FROM thumbnails
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()
        # created_at is a datetime; make it JSON-serialisable.
        for r in rows:
            r["created_at"] = r["created_at"].isoformat()
        return rows
