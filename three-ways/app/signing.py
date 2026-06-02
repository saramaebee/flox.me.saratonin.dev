"""Content hashing + HMAC signing via `cryptography`.

`cryptography` links against OpenSSL and, when no wheel is available, needs a
Rust toolchain to build — the canonical "why does pip want a Rust compiler?"
surprise. The signing key comes from $SIGNING_KEY so it is part of the
environment contract, not the source.
"""

from __future__ import annotations

import hashlib
import os

from cryptography.hazmat.primitives import hashes, hmac


def _key() -> bytes:
    # A real service would load this from a secret manager; here it is just an
    # env var so the point ("config lives in the environment") stays visible.
    return os.environ.get("SIGNING_KEY", "dev-insecure-key").encode()


def sign(data: bytes) -> tuple[str, str]:
    """Return (sha256_hex, hmac_sha256_hex) for the given bytes."""
    digest = hashlib.sha256(data).hexdigest()

    h = hmac.HMAC(_key(), hashes.SHA256())
    h.update(data)
    signature = h.finalize().hex()
    return digest, signature
