from __future__ import annotations

import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[3]
SRC = API_ROOT / "src"


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for candidate in (here, *here.parents):
        if (candidate / "packages" / "decision_engine").is_dir():
            return candidate
    raise RuntimeError("Could not locate monorepo root")


REPO_ROOT = _repo_root()
for path in (str(REPO_ROOT), str(SRC)):
    if path not in sys.path:
        sys.path.insert(0, path)
