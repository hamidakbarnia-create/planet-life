"""Versioned DecisionEvidence → DecisionDimensions mapping (dimensions.v1).

This is a Decision Intelligence semantic table — not astronomical fact and
not a second scoring engine. It only routes existing scored evidence fields
(kind, polarity, contribution, bodies, retrograde, angle) onto named
dimensions.

Grounding in ``astro_engine.scoring`` (not new astrology):
- BENEFICS / BENEFIC_TRANSIT → opportunity / cooperation
- MALEFICS / PRESSURE_TRANSIT → pressure
- Angular contacts already score visibility/timing → momentum overlay
- Retrograde already scores review/delay → reversibility_safety overlay

Weights are in ``(0, 1]``. They scale how much of an evidence item's existing
signed contribution is copied into a dimension. They do not invent new
contributions.
"""

from __future__ import annotations

from typing import Final

from packages.astro_engine.scoring import (
    BENEFICS,
    BENEFIC_TRANSIT,
    MALEFICS,
    PLANETS,
    PRESSURE_TRANSIT,
)

MAPPING_VERSION: Final[str] = "dimensions.v1"

DIMENSION_KEYS: Final[tuple[str, ...]] = (
    "opportunity",
    "momentum",
    "clarity",
    "stability",
    "cooperation",
    "pressure",
    "reversibility_safety",
)

# Neutral baseline for each dimension. Not probability. Not executive.score.
DIMENSION_BASELINE: Final[int] = 50

# Existing engine scale: a primary exact trine contributes 18.0 score points.
CONTRIBUTION_UNIT: Final[float] = 18.0

# Caution evidence raises pressure; supportive evidence lowers it.
INVERTED_DIMENSIONS: Final[frozenset[str]] = frozenset({"pressure"})

# Body → (dimension, weight). Reviewable product mapping of scored bodies.
BODY_DIMENSION_WEIGHTS: Final[dict[str, tuple[tuple[str, float], ...]]] = {
    "sun": (("opportunity", 1.0), ("momentum", 0.8)),
    "moon": (("stability", 1.0), ("cooperation", 0.6)),
    "mercury": (("clarity", 1.0), ("reversibility_safety", 0.5)),
    "venus": (("cooperation", 1.0), ("opportunity", 0.6)),
    "mars": (("momentum", 1.0), ("opportunity", 0.5), ("pressure", 0.8)),
    "jupiter": (("opportunity", 1.0), ("momentum", 0.8), ("cooperation", 0.4)),
    "saturn": (
        ("stability", 1.0),
        ("pressure", 0.8),
        ("reversibility_safety", 0.5),
        ("clarity", 0.4),
    ),
    "uranus": (("pressure", 0.8), ("stability", 0.7), ("momentum", 0.4)),
    "neptune": (("clarity", 1.0), ("reversibility_safety", 1.0)),
    "pluto": (("pressure", 1.0), ("reversibility_safety", 0.8), ("stability", 0.5)),
    "north_node": (("opportunity", 1.0),),
    "chiron": (("stability", 0.5), ("reversibility_safety", 0.4)),
}

# Kind overlays on top of body mapping (existing engine semantics).
KIND_DIMENSION_WEIGHTS: Final[dict[str, tuple[tuple[str, float], ...]]] = {
    "retrograde": (("reversibility_safety", 1.0), ("clarity", 0.4)),
    "angular": (("momentum", 0.8),),
}

assert frozenset(BODY_DIMENSION_WEIGHTS) == frozenset(PLANETS)
assert BENEFICS <= frozenset(BODY_DIMENSION_WEIGHTS)
assert MALEFICS <= frozenset(BODY_DIMENSION_WEIGHTS)
assert BENEFIC_TRANSIT <= frozenset(BODY_DIMENSION_WEIGHTS)
assert PRESSURE_TRANSIT <= frozenset(BODY_DIMENSION_WEIGHTS)
for _body, _rows in BODY_DIMENSION_WEIGHTS.items():
    for _dim, _weight in _rows:
        assert _dim in DIMENSION_KEYS
        assert 0.0 < _weight <= 1.0
for _kind, _rows in KIND_DIMENSION_WEIGHTS.items():
    for _dim, _weight in _rows:
        assert _dim in DIMENSION_KEYS
        assert 0.0 < _weight <= 1.0

# Unsupported DecisionEvidence fields that MUST NOT enter this mapping.
IGNORED_TEMPORAL_FIELDS: Final[tuple[str, ...]] = (
    "applying_or_separating",
    "station_state",
    "speed_class",
    "duration_class",
    "orb_strength",
)


def merge_dimension_weights(*groups: tuple[tuple[str, float], ...]) -> dict[str, float]:
    """Union of mapping rows; keep the max weight per dimension."""
    merged: dict[str, float] = {}
    for group in groups:
        for dimension, weight in group:
            merged[dimension] = max(merged.get(dimension, 0.0), weight)
    return merged


__all__ = [
    "BODY_DIMENSION_WEIGHTS",
    "CONTRIBUTION_UNIT",
    "DIMENSION_BASELINE",
    "DIMENSION_KEYS",
    "IGNORED_TEMPORAL_FIELDS",
    "INVERTED_DIMENSIONS",
    "KIND_DIMENSION_WEIGHTS",
    "MAPPING_VERSION",
    "merge_dimension_weights",
]
