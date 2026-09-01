"""Decision Intelligence Engine facade — delegates to the existing scoring pipeline."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from packages.decision_engine.mapper import map_activity_response_to_decision_outcome
from packages.decision_engine.models import DecisionOutcome, DecisionRequest


ScoreWithContextFn = Callable[..., tuple[dict[str, Any], dict[str, Any], dict[str, Any]]]
BuildScoringResponseFn = Callable[..., dict[str, Any]]


class DecisionEngineFacade:
    """Public entry point for decision generation.

    Phase 1 implementation: thin wrapper over score_with_context and
    build_scoring_response with no changes to scoring or reasoning logic.
    """

    def __init__(
        self,
        *,
        score_with_context: ScoreWithContextFn,
        build_scoring_response: BuildScoringResponseFn,
    ) -> None:
        self._score_with_context = score_with_context
        self._build_scoring_response = build_scoring_response

    @classmethod
    def for_api(cls) -> DecisionEngineFacade:
        """Construct a facade wired to the existing FastAPI scoring services."""
        from services.scoring_pipeline import score_with_context
        from schemas.score_breakdown import build_scoring_response

        return cls(
            score_with_context=score_with_context,
            build_scoring_response=build_scoring_response,
        )

    def generate(self, request: DecisionRequest) -> DecisionOutcome:
        """Run the existing pipeline and map the result to a DecisionOutcome."""
        action = request.action_type.lower().strip()
        result, natal, transit = self._score_with_context(
            birth_date=request.birth_date,
            birth_time=request.birth_time,
            location=request.location,
            target_date=request.target_date,
            target_time=request.target_time,
            action_type=action,
            context=request.context,
            latitude=request.latitude,
            longitude=request.longitude,
            evaluation_location=request.evaluation_location,
            evaluation_latitude=request.evaluation_latitude,
            evaluation_longitude=request.evaluation_longitude,
            house_system=request.house_system,
            zodiac=request.zodiac,
        )
        location_context = (
            transit.get("evaluation", {}) if request.include_location_context else None
        )
        payload = self._build_scoring_response(
            result,
            location_context=location_context,
            natal=natal,
            transit=transit,
            activity_type=action,
            context=request.context,
        )
        outcome = map_activity_response_to_decision_outcome(payload, request=request)
        return outcome.model_copy(
            update={"source_natal": natal, "source_transit": transit}
        )
