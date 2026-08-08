"""Type-specific Package semantics for Visibility Family EVALUATE."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from packages.decision_engine.models import DecisionOutcome


@dataclass(frozen=True, slots=True)
class CarInterviewVisibilitySemantics:
    def insufficient_summary(self, answers: Any, target_date: str) -> str:
        role = getattr(answers, "role", None) or "the role"
        return f"Cannot evaluate the {role} interview date without natal evidence."

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
        role_label = getattr(answers, "role", None) or "interview"
        company = getattr(answers, "company", None)
        summary = (
            f"{rating or 'Scored'} negotiation-timing conditions on {target_date} "
            f"for this {role_label}"
            + (f" ({company})" if company else "")
            + "."
        ).strip()
        return summary or outcome.recommendation.summary or "Timing evaluated."

    def scored_conditions(self, answers: Any) -> list[str]:
        conditions: list[str] = []
        if not getattr(answers, "company", None):
            conditions.append(
                "Company was not used in scoring (missing on Case; label-only context)"
            )
        if not getattr(answers, "interview_type", None):
            conditions.append(
                "Interview type was not used in scoring (missing on Case; label-only context)"
            )
        return conditions

    def scored_evidence_limits(self) -> list[str]:
        return [
            "Canonical activity mapping: job_interview → negotiation profile.",
            "Score reflects negotiation/communication timing signals, not employer fit.",
            "role, company, and interview_type did not enter the scoring function.",
            "Astrological timing does not determine interview outcome.",
        ]

    def scored_timing_notes(self, *, rating: str) -> str:
        return (
            f"Date-level score from decision-engine facade "
            f"(action=job_interview → negotiation profile, rating={rating}). "
            "No clock-time window was computed. "
            "role/company/interview_type are Case labels only."
        )

    def scored_action_step(self, target_date: str) -> str:
        return (
            f"Decide whether to keep the interview on {target_date} "
            "given the negotiation-timing evidence above."
        )

    def scored_assumptions(self, *, event_location_supplied: bool) -> list[str]:
        return [
            "Evaluation used Case-persisted interview date from decision_frame.date.",
            "Transit timing used noon local default when no interview clock time was supplied.",
            "Canonical pre-existing alias job_interview→negotiation was used for scoring.",
            (
                "Interview/event location was supplied separately from birth place."
                if event_location_supplied
                else (
                    "Interview/event location was not supplied on the Case; "
                    "scoring pipeline may default transit location to birth place."
                )
            ),
        ]

    def scored_limits(self) -> list[str]:
        return [
            "This is negotiation/communication timing evidence, not full interview intelligence.",
            "role, company, and interview_type did not affect the numeric score.",
            "Birth location and interview/event location are distinct; birth was not treated as interview city in Case evidence.",
            "Best clock-time window was not computed (date-level evidence only).",
            "Avoid windows were not computed.",
            "Alternative dates were not searched.",
        ]

    def scored_improve_accuracy(self) -> list[str]:
        return [
            "Provide interview clock time to enable hourly window analysis (future).",
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
class InvestorMeetingVisibilitySemantics:
    def insufficient_summary(self, answers: Any, target_date: str) -> str:
        return "Cannot evaluate the investor meeting date without natal evidence."

    def insufficient_action(self) -> str:
        return (
            "Provide natal evidence, then re-evaluate "
            "the investor meeting date."
        )

    def insufficient_counter_reason(self) -> str:
        return (
            "No alternative date was evaluated. "
            "EVALUATE assesses only the requested date."
        )

    def insufficient_limits(self) -> list[str]:
        return [
            "No clock-time window was computed.",
            "No alternative dates were searched.",
        ]

    def insufficient_timing_notes(self) -> str:
        return (
            "Timing not evaluated: natal evidence unavailable. "
            "Candidate score/band are Package v1 placeholders."
        )

    def insufficient_confidence_message(self) -> str:
        return (
            "Birth date/time/location evidence is required "
            "for timing evaluation."
        )

    def scored_summary(
        self,
        answers: Any,
        *,
        target_date: str,
        rating: str,
        outcome: DecisionOutcome,
    ) -> str:
        return (
            f"{rating or 'Scored'} investor-meeting timing conditions "
            f"on {target_date}."
        )

    def scored_conditions(self, answers: Any) -> list[str]:
        conditions: list[str] = []
        if not getattr(answers, "investor_name", None):
            conditions.append("Investor identity was not used in scoring.")
        if not getattr(answers, "meeting_type", None):
            conditions.append("Meeting type was not used in scoring.")
        return conditions

    def scored_evidence_limits(self) -> list[str]:
        return [
            "Canonical activity mapping: investor_meeting → negotiation profile.",
            (
                "Score reflects negotiation/communication timing, "
                "not probability of receiving funding."
            ),
            (
                "Investor identity, meeting goal, and meeting type "
                "do not determine the numeric timing score."
            ),
        ]

    def scored_timing_notes(self, *, rating: str) -> str:
        return (
            f"Date-level score from decision-engine facade "
            f"(action=investor_meeting → negotiation profile, rating={rating}). "
            "No clock-time window was computed."
        )

    def scored_action_step(self, target_date: str) -> str:
        return (
            f"Decide whether to keep the investor meeting on "
            f"{target_date} given the timing evidence above."
        )

    def scored_assumptions(self, *, event_location_supplied: bool) -> list[str]:
        return [
            (
                "Canonical pre-existing alias "
                "investor_meeting→negotiation was used for scoring."
            ),
            (
                "Event location was supplied separately from birth place."
                if event_location_supplied
                else "Event location was not supplied on the Case."
            ),
        ]

    def scored_limits(self) -> list[str]:
        return [
            (
                "This is negotiation/communication timing evidence, "
                "not investment-outcome prediction."
            ),
            "No best clock-time window was computed.",
            "Alternative dates were not searched.",
        ]

    def scored_improve_accuracy(self) -> list[str]:
        return [
            "Provide meeting clock time for future hourly-window analysis."
        ]

    def scored_counter_reason(self) -> str:
        return (
            "No alternative date was evaluated. "
            "EVALUATE assesses only the requested date; FIND is not implemented."
        )

    def scored_confidence_unavailable_message(self) -> str:
        return "Upstream scoring did not supply a reasoning confidence value."
