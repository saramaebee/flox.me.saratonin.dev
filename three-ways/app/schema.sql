CREATE TABLE IF NOT EXISTS thumbnails (
    id         SERIAL PRIMARY KEY,
    filename   TEXT        NOT NULL,
    width      INTEGER     NOT NULL,
    height     INTEGER     NOT NULL,
    sha256     TEXT        NOT NULL,
    signature  TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
