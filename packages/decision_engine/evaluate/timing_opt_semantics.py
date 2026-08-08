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
            "This EVALUATE package assesses one date only; use COMPARE to rank candidates.",
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
class WeddingDateTimingOptCompareSemantics:
    """COMPARE Package wording for mar-wedding-date."""

    def insufficient_summary(self, answers: Any, option_labels: list[str]) -> str:
        ceremony = getattr(answers, "ceremony_type", None) or "wedding"
        labels = ", ".join(option_labels) if option_labels else "the candidate dates"
        return (
            f"Cannot compare {ceremony} dates ({labels}) without natal evidence."
        )

    def insufficient_action(self) -> str:
        return (
            "Provide natal evidence (birth date, time, location) "
            "on the Case, then re-compare."
        )

    def insufficient_counter_reason(self) -> str:
        return (
            "Comparison did not run. Without natal evidence, candidate dates "
            "cannot be ranked."
        )

    def insufficient_limits(self) -> list[str]:
        return [
            "Ceremony timing comparison only — not relationship quality or wedding success.",
            "No clock-time window, avoid window, or FIND search was performed.",
        ]

    def insufficient_timing_notes(self) -> str:
        return (
            "Timing not compared: natal evidence unavailable. "
            "Candidate score/band are Package v1 placeholders, not ratings."
        )

    def insufficient_confidence_message(self) -> str:
        return (
            "Birth date/time/location evidence is required for "
            "timing comparison."
        )

    def scored_summary(
        self,
        answers: Any,
        *,
        unique_winner: bool,
        winner_label: str | None,
        tied_labels: list[str],
    ) -> str:
        ceremony = getattr(answers, "ceremony_type", None) or "wedding"
        if unique_winner and winner_label:
            return (
                f"Prefer {winner_label} for this {ceremony} based on relative "
                "ceremony-day timing scores."
            )
        tied = " and ".join(tied_labels) if tied_labels else "the top candidates"
        return (
            f"No unique winner for this {ceremony}: {tied} are effectively tied "
            "on ceremony-day timing."
        )

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
            "Scores are relative ceremony-day timing signals, not wedding outcomes.",
            "ceremony_type, partner_name, and venue did not enter the scoring function.",
            "Same natal evidence was used for every candidate date.",
        ]

    def scored_timing_notes(self, *, unique_winner: bool) -> str:
        if unique_winner:
            return (
                "Candidates ranked by wedding_date ceremony timing score "
                "(score desc, then date asc, then option_id). "
                "No clock-time window was computed."
            )
        return (
            "Candidates ranked deterministically, but the top scores are within "
            "the tie threshold — no unique preferred date is claimed."
        )

    def scored_action_step(
        self,
        *,
        unique_winner: bool,
        winner_label: str | None,
        tied_labels: list[str],
    ) -> str:
        if unique_winner and winner_label:
            return (
                f"Confirm logistics for {winner_label}, then decide whether to "
                "keep that ceremony date."
            )
        tied = " / ".join(tied_labels) if tied_labels else "the tied dates"
        return (
            f"Treat {tied} as effectively equal on timing; choose using "
            "non-timing constraints (venue, guests, travel)."
        )

    def scored_assumptions(self, *, event_location_supplied: bool) -> list[str]:
        return [
            "Comparison used Case-persisted candidate dates from decision_frame.options.",
            "Transit timing used noon local default when no ceremony clock time was supplied.",
            "Canonical wedding_date activity profile was used for each option score.",
            "Identical natal evidence bindings were applied to every option.",
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
            "Ceremony timing comparison only — not relationship quality, wedding success, "
            "legal advice, venue quality, budget success, or guaranteed outcome.",
            "ceremony_type, partner_name, and venue did not affect the numeric scores.",
            "Best clock-time windows were not computed (date-level evidence only).",
            "Avoid windows were not computed.",
            "FIND / Window / Scan are not part of this comparison.",
        ]

    def scored_improve_accuracy(self) -> list[str]:
        return [
            "Provide ceremony clock time to enable hourly window analysis (future).",
        ]

    def scored_counter_reason(self, *, unique_winner: bool) -> str:
        if unique_winner:
            return (
                "A lower-ranked date may still be preferable when logistics "
                "outweigh a modest timing gap."
            )
        return (
            "Timing does not separate the top candidates; non-timing constraints "
            "should decide."
        )

    def scored_confidence_unavailable_message(self) -> str:
        return (
            "Upstream scoring did not supply a reasoning confidence value. "
            "Package confidence.value=0 is a schema placeholder, not a measured score."
        )

    def relative_explanation(
        self,
        *,
        unique_winner: bool,
        ranked_labels: list[str],
        ranked_scores: list[float],
        tied_labels: list[str],
    ) -> tuple[str, str]:
        if unique_winner and len(ranked_labels) >= 2:
            top = ranked_labels[0]
            rest = ", ".join(
                f"{label} ({score:.1f})"
                for label, score in zip(ranked_labels[1:], ranked_scores[1:])
            )
            why = (
                f"{top} ranks first with score {ranked_scores[0]:.1f} versus {rest}."
            )
            why_not = (
                "Lower-ranked dates have weaker combined wedding_date timing scores "
                "under identical natal evidence."
            )
            return why, why_not
        tied = ", ".join(tied_labels) if tied_labels else "top candidates"
        why = (
            f"{tied} are within the compare tie threshold and share the strongest "
            "timing band under identical natal evidence."
        )
        why_not = (
            "No unique preferred date is claimed because the score gap is not material."
        )
        return why, why_not

    def option_strengths(
        self, *, score: float, band: str, rating: str
    ) -> tuple[str, ...]:
        label = rating or band
        return (f"Ceremony-day timing {label.lower()} (score {score:.1f}).",)

    def option_risks(
        self, *, score: float, band: str, rating: str
    ) -> tuple[str, ...]:
        if band == "high":
            return ("Logistics or availability may still override timing preference.",)
        if band == "moderate":
            return ("Mixed ceremony-day signals — confirm non-timing constraints.",)
        return ("Weaker ceremony-day timing relative to higher-ranked options.",)


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
            "requested date; use FIND for a date-range window scan."
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
            "Alternative dates were not searched in EVALUATE; use FIND for range scan.",
            "COMPARE mode is not implemented for this Decision Type in this release.",
        ]

    def scored_improve_accuracy(self) -> list[str]:
        return [
            "Provide launch clock time to enable hourly window analysis (future).",
        ]

    def scored_counter_reason(self) -> str:
        return (
            "No alternative date was evaluated. EVALUATE assesses only the "
            "requested date; use FIND for a date-range window scan."
        )

    def scored_confidence_unavailable_message(self) -> str:
        return (
            "Upstream scoring did not supply a reasoning confidence value. "
            "Package confidence.value=0 is a schema placeholder, not a measured score."
        )


@dataclass(frozen=True, slots=True)
class ProductLaunchTimingOptFindSemantics:
    """FIND Package wording for bus-product-launch."""

    def insufficient_summary(
        self, answers: Any, *, range_start: str, range_end: str
    ) -> str:
        launch_object = getattr(answers, "launch_object", None) or "launch"
        return (
            f"Cannot scan launch timing windows for this {launch_object} "
            f"between {range_start} and {range_end} without natal evidence."
        )

    def insufficient_action(self) -> str:
        return (
            "Provide natal evidence (birth date, time, location) "
            "on the Case, then re-run FIND."
        )

    def insufficient_counter_reason(self) -> str:
        return (
            "FIND did not run. Without natal evidence, launch timing windows "
            "cannot be scanned."
        )

    def insufficient_limits(self) -> list[str]:
        return [
            "Launch-day timing scan only — not market fit, revenue, or readiness.",
            "No windows were generated because natal evidence was unavailable.",
        ]

    def insufficient_timing_notes(self) -> str:
        return (
            "Timing not scanned: natal evidence unavailable. "
            "No favorable windows are claimed."
        )

    def insufficient_confidence_message(self) -> str:
        return (
            "Birth date/time/location evidence is required for "
            "timing FIND scans."
        )

    def scored_summary(
        self,
        answers: Any,
        *,
        unique_dominant: bool,
        window_labels: list[str],
        tied_labels: list[str],
        no_strong_window: bool,
    ) -> str:
        launch_object = getattr(answers, "launch_object", None) or "project/product"
        if no_strong_window:
            return (
                f"No sufficiently strong launch timing window found for this "
                f"{launch_object} inside the selected range."
            )
        if unique_dominant and window_labels:
            return (
                f"Stronger launch timing window {window_labels[0]} for this "
                f"{launch_object} within the scanned range."
            )
        tied = " and ".join(tied_labels) if tied_labels else "several windows"
        return (
            f"Comparable launch timing windows for this {launch_object}: "
            f"{tied}. No clearly dominant window."
        )

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
            "Windows reflect relative launch-day timing signals inside the scanned range only.",
            "Does not assess market fit, demand, revenue, Product Hunt rank, or readiness.",
            "launch_object, launch_channel, and brand_or_company did not enter scoring.",
            "Same natal evidence was used for every scanned date.",
        ]

    def scored_timing_notes(
        self, *, unique_dominant: bool, no_strong_window: bool
    ) -> str:
        if no_strong_window:
            return (
                "No contiguous Favorable+ (band=high) launch-day windows were found "
                "in the scanned range."
            )
        if unique_dominant:
            return (
                "Windows built from contiguous Favorable+ days; ordered by peak score, "
                "then start date. Scores shown as whole numbers."
            )
        return (
            "Windows built from contiguous Favorable+ days. Top windows are within "
            "the tie threshold — no unique dominant window is claimed."
        )

    def scored_action_step(
        self,
        *,
        unique_dominant: bool,
        window_labels: list[str],
        tied_labels: list[str],
        no_strong_window: bool,
    ) -> str:
        if no_strong_window:
            return (
                "Widen or shift the date range, or evaluate a specific constrained "
                "launch date separately."
            )
        if unique_dominant and window_labels:
            return (
                f"Review logistics inside {window_labels[0]}, then decide whether "
                "that window fits non-timing constraints."
            )
        tied = " / ".join(tied_labels) if tied_labels else "the comparable windows"
        return (
            f"Treat {tied} as comparable on timing; choose using non-timing "
            "constraints (readiness, channel calendar, team capacity)."
        )

    def scored_assumptions(
        self, *, event_location_supplied: bool, timezone: str
    ) -> list[str]:
        return [
            "FIND used Case-persisted inclusive date range from decision_frame.",
            f"One scan timezone/context applied to every day: {timezone}.",
            "Transit timing used noon local default when no launch clock time was supplied.",
            "Canonical business_launch activity profile was used for each day score.",
            "Identical natal evidence bindings were applied to every scanned date.",
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
            "Relative symbolic launch-day timing only — not business or market intelligence.",
            "Does not predict launch success, revenue, adoption, Product Hunt rank, "
            "market demand, PR performance, or team readiness.",
            "launch_object, launch_channel, and brand_or_company did not affect scores.",
            "Hourly clock-time windows were not computed.",
            "Avoid windows were not computed as a primary product.",
            "Tiny score gaps within the tie threshold do not create a unique winner.",
            "Results are relative within the selected range only.",
        ]

    def scored_improve_accuracy(self) -> list[str]:
        return [
            "Provide launch clock time later for hourly analysis (not part of FIND v1).",
        ]

    def scored_counter_reason(
        self, *, unique_dominant: bool, no_strong_window: bool
    ) -> str:
        if no_strong_window:
            return (
                "Absence of a Favorable+ window is not a prohibition — it means "
                "no strong timing cluster met the eligibility rule in this range."
            )
        if unique_dominant:
            return (
                "A lower-ranked window may still be preferable when logistics "
                "outweigh a modest timing gap."
            )
        return (
            "Timing does not separate the top windows; non-timing constraints "
            "should decide."
        )

    def scored_confidence_unavailable_message(self) -> str:
        return (
            "Upstream scoring did not supply a reasoning confidence value. "
            "Package confidence.value=0 is a schema placeholder, not a measured score."
        )

    def relative_explanation(
        self,
        *,
        unique_dominant: bool,
        no_strong_window: bool,
        window_labels: list[str],
        peak_scores: list[float],
        tied_labels: list[str],
    ) -> tuple[str, str]:
        if no_strong_window:
            return (
                "No contiguous Favorable+ launch-day window was identified in range.",
                "FIND does not invent candidates when eligibility is unmet.",
            )
        if unique_dominant and window_labels and peak_scores:
            why = (
                f"{window_labels[0]} is the stronger timing window "
                f"(peak {peak_scores[0]:.0f}) under identical natal evidence."
            )
            why_not = (
                "Other days/windows are weaker or outside the Favorable+ eligibility "
                "band used for window construction."
            )
            return why, why_not
        tied = ", ".join(tied_labels) if tied_labels else "top windows"
        why = (
            f"{tied} are within the FIND tie threshold and share favorable "
            "launch-day timing under identical natal evidence."
        )
        why_not = (
            "No clearly dominant window is claimed because the peak-score gap "
            "is not material."
        )
        return why, why_not

    def option_strengths(
        self, *, score: float, band: str, rating: str
    ) -> tuple[str, ...]:
        label = rating or band
        return (f"Launch-day timing {label.lower()} (score {score:.0f}).",)

    def option_risks(
        self, *, score: float, band: str, rating: str
    ) -> tuple[str, ...]:
        if band == "high":
            return (
                "Non-timing constraints (readiness, channel calendar) may still override.",
            )
        if band == "moderate":
            return ("Mixed launch-day signals — confirm non-timing constraints.",)
        return ("Weaker launch-day timing relative to stronger windows.",)
