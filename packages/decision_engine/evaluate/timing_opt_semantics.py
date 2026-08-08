"""Type-specific Package semantics for Timing Opt Family EVALUATE."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from packages.decision_engine.models import DecisionOutcome


@dataclass(frozen=True, slots=True)
class WeddingDateTimingOptSemantics:
    def insufficient_summary(self, answers: Any, target_date: str) -> str:
        ceremony = getattr(answers, "ceremony_type", None) or "wedding"
        return (
            f"Cannot evaluate the {ceremony} date on {target_date} "
            "without natal evidence."
        )

    def insufficient_action(self) -> str:
        return (
            "Provide natal evidence (birth date, time, location) "
            "on the Case, then re-evaluate."
        )

    def insufficient_counter_reason(self) -> str:
        return (
            "No alternative date was evaluated. EVALUATE assesses only the "
            "requested date; FIND is not implemented."
        )

    def insufficient_limits(self) -> list[str]:
        return [
            "Package v1 requires a timing candidate even when timing is non-material.",
            "No clock-time window, avoid window, or alternative search was performed.",
        ]

    def insufficient_timing_notes(self) -> str:
        return (
            "Timing not evaluated: natal evidence unavailable. "
            "Candidate score/band are Package v1 placeholders, not ratings."
        )

    def insufficient_confidence_message(self) -> str:
        return (
            "Birth date/time/location evidence is required for "
            "timing evaluation."
        )

    def scored_summary(
        self,
        answers: Any,
        *,
        target_date: str,
        rating: str,
        outcome: DecisionOutcome,
    ) -> str:
        ceremony = getattr(answers, "ceremony_type", None) or "wedding"
        summary = (
            f"{rating or 'Scored'} wedding-date timing conditions on "
            f"{target_date} for this {ceremony}."
        ).strip()
        return summary or outcome.recommendation.summary or "Timing evaluated."

    def scored_conditions(self, answers: Any) -> list[str]:
        conditions: list[str] = []
        if not getattr(answers, "partner_name", None):
            conditions.append(
                "Partner name was not used in scoring (missing on Case; label-only)"
            )
        if not getattr(answers, "venue", None):
            conditions.append(
                "Venue was not used in scoring (missing on Case; label-only)"
            )
        return conditions

    def scored_evidence_limits(self) -> list[str]:
        return [
            "Canonical activity mapping: wedding_date → negotiation profile.",
            "Score reflects partnership/communication timing signals, not wedding outcome.",
            "ceremony_type, partner_name, and venue did not enter the scoring function.",
            "Astrological timing does not determine wedding success.",
        ]

    def scored_timing_notes(self, *, rating: str) -> str:
        return (
            f"Date-level score from decision-engine facade "
            f"(action=wedding_date → negotiation profile, rating={rating}). "
            "No clock-time window was computed. "
            "ceremony_type/partner_name/venue are Case labels only."
        )

    def scored_action_step(self, target_date: str) -> str:
        return (
            f"Decide whether to keep the wedding date on {target_date} "
            "given the timing evidence above."
        )

    def scored_assumptions(self, *, event_location_supplied: bool) -> list[str]:
        return [
            "Evaluation used Case-persisted wedding date from decision_frame.date.",
            "Transit timing used noon local default when no ceremony clock time was supplied.",
            "Canonical alias wedding_date→negotiation was used for scoring.",
            (
                "Ceremony/event location was supplied separately from birth place."
                if event_location_supplied
                else (
                    "Ceremony/event location was not supplied on the Case; "
                    "scoring pipeline may default transit location to birth place."
                )
            ),
        ]

    def scored_limits(self) -> list[str]:
        return [
            "This is partnership/communication timing evidence, not full wedding intelligence.",
            "ceremony_type, partner_name, and venue did not affect the numeric score.",
            "Birth location and ceremony location are distinct concepts.",
            "Best clock-time window was not computed (date-level evidence only).",
            "Avoid windows were not computed.",
            "Alternative dates were not searched.",
            "COMPARE mode is not implemented for this Decision Type in this release.",
        ]

    def scored_improve_accuracy(self) -> list[str]:
        return [
            "Provide ceremony clock time to enable hourly window analysis (future).",
        ]

    def scored_counter_reason(self) -> str:
        return (
            "No alternative date was evaluated. EVALUATE assesses only the "
            "requested date; FIND is not implemented."
        )

    def scored_confidence_unavailable_message(self) -> str:
        return (
            "Upstream scoring did not supply a reasoning confidence value. "
            "Package confidence.value=0 is a schema placeholder, not a measured score."
        )
