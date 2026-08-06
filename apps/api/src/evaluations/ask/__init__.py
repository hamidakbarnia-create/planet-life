"""Ask quality evaluation baseline framework (P1-T05-02).

Separates deterministic structural checks from human / model-assisted
subjective scoring. Does not modify production prompts or public APIs.
"""

from __future__ import annotations

__all__ = [
    "DATASET_VERSION",
    "RUBRIC_VERSION",
]

DATASET_VERSION = "v1"
RUBRIC_VERSION = "v1"
