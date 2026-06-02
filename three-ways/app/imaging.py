"""Thumbnailing via Pillow.

Pillow pulls in libjpeg and zlib. On Apple Silicon and in `--no-binary` /
air-gapped installs this is a classic source-build pain point ("The headers or
library files could not be found for jpeg"). Here it is just two function calls.
"""

from __future__ import annotations

import io

from PIL import Image

THUMBNAIL_SIZE = (128, 128)


def make_thumbnail(raw: bytes) -> tuple[bytes, int, int]:
    """Decode an image and return (png_bytes, width, height) of the thumbnail."""
    with Image.open(io.BytesIO(raw)) as img:
        img = img.convert("RGB")
        img.thumbnail(THUMBNAIL_SIZE)
        out = io.BytesIO()
        img.save(out, format="PNG")
        return out.getvalue(), img.width, img.height
