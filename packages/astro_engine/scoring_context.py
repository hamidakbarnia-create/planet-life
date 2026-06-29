"""Location-aware scoring context — which techniques use which location role."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

LocationMode = Literal[
    "birthOnly",
    "currentLiving",
    "eventLocation",
    "targetSubject",
    "birthAndTarget",
]

DEFAULT_TRANSIT_NOON = "12:00"


@dataclass(frozen=True)
class ScoringContext:
    location_mode: LocationMode
    include_natal_house_bonus: bool
    include_transit_house_score: bool
    include_transit_angular_score: bool
    default_transit_time: str | None = DEFAULT_TRANSIT_NOON


# Module presets (Phase 1 routing)
CONTEXT_NATAL = ScoringContext(
    location_mode="birthOnly",
    include_natal_house_bonus=True,
    include_transit_house_score=False,
    include_transit_angular_score=False,
    default_transit_time=None,
)

CONTEXT_SYNASTRY = CONTEXT_NATAL
CONTEXT_PROGRESSIONS = CONTEXT_NATAL

CONTEXT_CALENDAR_DAY = ScoringContext(
    location_mode="currentLiving",
    include_natal_house_bonus=False,
    include_transit_house_score=True,
    include_transit_angular_score=True,
    default_transit_time=DEFAULT_TRANSIT_NOON,
)

CONTEXT_CALENDAR_HOURLY = ScoringContext(
    location_mode="currentLiving",
    include_natal_house_bonus=False,
    include_transit_house_score=True,
    include_transit_angular_score=True,
    default_transit_time=None,
)

CONTEXT_ASK_ELECTIONAL = ScoringContext(
    location_mode="eventLocation",
    include_natal_house_bonus=False,
    include_transit_house_score=True,
    include_transit_angular_score=True,
    default_transit_time=DEFAULT_TRANSIT_NOON,
)

CONTEXT_PROPERTY = ScoringContext(
    location_mode="targetSubject",
    include_natal_house_bonus=False,
    include_transit_house_score=True,
    include_transit_angular_score=True,
    default_transit_time=DEFAULT_TRANSIT_NOON,
)

CONTEXT_PATHFINDER = ScoringContext(
    location_mode="birthAndTarget",
    include_natal_house_bonus=False,
    include_transit_house_score=True,
    include_transit_angular_score=True,
    default_transit_time=DEFAULT_TRANSIT_NOON,
)


def resolve_transit_time(
    context: ScoringContext,
    target_time: str | None,
) -> str:
    """Resolve local transit clock time at evaluation location."""
    if target_time:
        return target_time
    if context.default_transit_time:
        return context.default_transit_time
    raise ValueError(
        "target_time is required for this scoring context "
        f"({context.location_mode})."
    )
