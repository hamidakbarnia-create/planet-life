"""Ensure the monorepo root is on sys.path for packages.astro_engine imports."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT: Path | None = None


def repo_root() -> Path:
    global _REPO_ROOT
    if _REPO_ROOT is not None:
        return _REPO_ROOT

    here = Path(__file__).resolve().parent
    for candidate in (here, *here.parents):
        if (candidate / "packages" / "astro_engine").is_dir():
            _REPO_ROOT = candidate
            root = str(candidate)
            if root not in sys.path:
                sys.path.insert(0, root)
            return candidate

    raise RuntimeError(
        "Could not locate monorepo root (expected packages/astro_engine directory)"
    )


def ensure_repo_on_path() -> Path:
    return repo_root()
