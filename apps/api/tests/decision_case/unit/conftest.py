from __future__ import annotations

import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[3]
REPO_ROOT = Path(__file__).resolve().parents[4]
SRC = API_ROOT / "src"
for path in (str(REPO_ROOT), str(SRC)):
    if path not in sys.path:
        sys.path.insert(0, path)
