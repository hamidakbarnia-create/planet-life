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
            "Canonical activity profile: wedding_date (union/ceremony timing).",
            "Score reflects ceremony-day union timing signals, not wedding outcome.",
            "ceremony_type, partner_name, and venue did not enter the scoring function.",
            "Astrological timing does not determine wedding success.",
        ]

    def scored_timing_notes(self, *, rating: str) -> str:
        return (
            f"Date-level score from decision-engine facade "
            f"(action=wedding_date ceremony profile, rating={rating}). "
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
            "Canonical wedding_date activity profile was used for scoring.",
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
            "This is ceremony-day union timing evidence, not full wedding intelligence.",
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


@dataclass(frozen=True, slots=True)
class ProductLaunchTimingOptSemantics:
    def insufficient_summary(self, answers: Any, target_date: str) -> str:
        launch_object = getattr(answers, "launch_object", None) or "launch"
        return (
            f"Cannot evaluate the {launch_object} launch date on {target_date} "
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
        launch_object = getattr(answers, "launch_object", None) or "project/product"
        summary = (
            f"{rating or 'Scored'} launch-timing conditions on {target_date} "
            f"for this {launch_object}."
        ).strip()
        return summary or outcome.recommendation.summary or "Timing evaluated."

    def scored_conditions(self, answers: Any) -> list[str]:
        conditions: list[str] = []
        if not getattr(answers, "launch_channel", None):
            conditions.append(
                "Launch channel was not used in scoring (missing on Case; label-only)"
            )
        if not getattr(answers, "brand_or_company", None):
            conditions.append(
                "Brand/company was not used in scoring (missing on Case; label-only)"
            )
        return conditions

    def scored_evidence_limits(self) -> list[str]:
        return [
            "Canonical activity profile: business_launch (launch-day timing).",
            "Score reflects launch-day timing signals only, not market fit or demand.",
            "launch_object, launch_channel, and brand_or_company did not enter the scoring function.",
            "Astrological timing does not determine launch success, revenue, or viability.",
        ]

    def scored_timing_notes(self, *, rating: str) -> str:
        return (
            f"Date-level score from decision-engine facade "
            f"(action=business_launch profile, rating={rating}). "
            "No clock-time window was computed. "
            "launch_object/launch_channel/brand_or_company are Case labels only."
        )

    def scored_action_step(self, target_date: str) -> str:
        return (
            f"Decide whether to keep the launch date on {target_date} "
            "given the timing evidence above."
        )

    def scored_assumptions(self, *, event_location_supplied: bool) -> list[str]:
        return [
            "Evaluation used Case-persisted launch date from decision_frame.date.",
            "Transit timing used noon local default when no launch clock time was supplied.",
            "Canonical business_launch activity profile was used for scoring.",
            (
                "Launch/event location was supplied separately from birth place."
                if event_location_supplied
                else (
                    "Launch/event location was not supplied on the Case; "
                    "scoring pipeline may default transit location to birth place."
                )
            ),
        ]

    def scored_limits(self) -> list[str]:
        return [
            "This is launch-day timing evidence only, not business or market intelligence.",
            "It does not assess market fit, revenue, demand, fundraising, or viability.",
            "launch_object, launch_channel, and brand_or_company did not affect the numeric score.",
            "Birth location and launch location are distinct concepts.",
            "Best clock-time window was not computed (date-level evidence only).",
            "Avoid windows were not computed.",
            "Alternative dates were not searched.",
            "COMPARE mode is not implemented for this Decision Type in this release.",
        ]

    def scored_improve_accuracy(self) -> list[str]:
        return [
            "Provide launch clock time to enable hourly window analysis (future).",
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
