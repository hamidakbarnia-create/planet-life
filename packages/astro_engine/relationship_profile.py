"""Relationship intelligence profiles for synastry interpretation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class InsightSectionDef:
    key: str
    planets: tuple[str, ...]
    harmony_weight: float = 11.0
    tension_weight: float = 12.0


@dataclass(frozen=True)
class RecommendationTemplates:
    aligned: tuple[str, ...]
    caution: tuple[str, ...]
    tension: tuple[str, ...]


@dataclass(frozen=True)
class RelationshipProfile:
  """Interpretation and weighting profile — not a duplicate chart engine."""

  key: str
  label: str
  scoring_priorities: tuple[str, ...]
  weighted_planets: dict[str, float]
  weighted_houses: dict[int, float]
  weighted_harmony_aspects: dict[str, float]
  weighted_tension_aspects: dict[str, float]
  reasoning_categories: tuple[str, ...]
  insight_sections: tuple[InsightSectionDef, ...]
  recommendation_templates: RecommendationTemplates
  meeting_action_type: str
  preferred_meeting_action_type: str = ""
  fallback_meeting_action_type: str = ""
  base_score: float = 50.0


_DEFAULT_HARMONY: Final[dict[str, float]] = {
    "trine": 8.0,
    "sextile": 6.0,
    "conjunction": 5.0,
}
_DEFAULT_TENSION: Final[dict[str, float]] = {
    "square": 8.0,
    "opposition": 7.0,
}
_DEFAULT_PLANETS: Final[dict[str, float]] = {
    "sun": 10.0,
    "moon": 10.0,
    "venus": 9.0,
    "mars": 8.0,
    "saturn": 9.0,
    "jupiter": 6.0,
    "mercury": 5.0,
}


def _planets(**weights: float) -> dict[str, float]:
    merged = dict(_DEFAULT_PLANETS)
    merged.update(weights)
    return merged


def _section(key: str, planets: tuple[str, ...], hw: float = 11.0, tw: float = 12.0) -> InsightSectionDef:
    return InsightSectionDef(key=key, planets=planets, harmony_weight=hw, tension_weight=tw)


RELATIONSHIP_PROFILES: Final[dict[str, RelationshipProfile]] = {
    "spouse": RelationshipProfile(
        key="spouse",
        label="Spouse",
        scoring_priorities=("emotional_bond", "stability", "trust", "communication"),
        weighted_planets=_planets(moon=12.0, venus=11.0, saturn=10.0, sun=9.0),
        weighted_houses={4: 1.0, 7: 1.0, 8: 0.6},
        weighted_harmony_aspects={**_DEFAULT_HARMONY, "conjunction": 6.0},
        weighted_tension_aspects=dict(_DEFAULT_TENSION),
        reasoning_categories=("emotional_bond", "stability", "trust", "communication", "boundaries"),
        insight_sections=(
            _section("emotional_bond", ("moon", "venus", "sun"), 12.0, 13.0),
            _section("stability", ("saturn", "sun", "moon"), 11.0, 12.0),
            _section("trust", ("saturn", "jupiter", "venus"), 10.0, 11.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Protect weekly rituals that keep tenderness alive alongside duty.",),
            caution=("Slow down before discussing logistics when feelings are unspoken.",),
            tension=("Agree on one repair gesture after friction.",),
        ),
        meeting_action_type="shared_life_planning",
        preferred_meeting_action_type="shared_life_planning",
        fallback_meeting_action_type="relationship_repair",
        base_score=50.0,
    ),
    "romantic_partner": RelationshipProfile(
        key="romantic_partner",
        label="Romantic partner",
        scoring_priorities=("chemistry", "emotional_bond", "communication", "growth"),
        weighted_planets=_planets(venus=12.0, mars=11.0, moon=10.0, sun=8.0),
        weighted_houses={5: 1.0, 7: 0.9, 8: 0.8},
        weighted_harmony_aspects={"trine": 9.0, "sextile": 7.0, "conjunction": 6.0},
        weighted_tension_aspects={"square": 7.0, "opposition": 6.0},
        reasoning_categories=("chemistry", "emotional_bond", "communication", "boundaries", "growth"),
        insight_sections=(
            _section("chemistry", ("venus", "mars", "moon"), 13.0, 11.0),
            _section("emotional_bond", ("moon", "venus", "sun"), 12.0, 12.0),
            _section("communication", ("mercury", "moon", "venus"), 10.0, 11.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Keep curiosity alive — plan something playful.",),
            caution=("Pace desire and comfort.",),
            tension=("Pause before sarcasm when spark turns sharp.",),
        ),
        meeting_action_type="romantic_meeting",
        preferred_meeting_action_type="romantic_meeting",
        fallback_meeting_action_type="relationship_repair",
        base_score=52.0,
    ),
    "business_partner": RelationshipProfile(
        key="business_partner",
        label="Business partner",
        scoring_priorities=("shared_goals", "trust", "communication", "practical_fit"),
        weighted_planets=_planets(mercury=12.0, saturn=11.0, jupiter=10.0, sun=9.0),
        weighted_houses={10: 1.0, 7: 0.9, 11: 0.8, 2: 0.7},
        weighted_harmony_aspects=dict(_DEFAULT_HARMONY),
        weighted_tension_aspects={"square": 9.0, "opposition": 8.0},
        reasoning_categories=("shared_goals", "trust", "communication", "power_dynamic", "practical_fit"),
        insight_sections=(
            _section("shared_goals", ("sun", "jupiter", "saturn"), 11.0, 12.0),
            _section("trust", ("saturn", "jupiter", "mercury"), 10.0, 13.0),
            _section("communication", ("mercury", "moon", "sun"), 11.0, 11.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Document decisions while momentum is high.",),
            caution=("Separate friendship warmth from governance.",),
            tension=("Use a neutral facilitator for high-stakes negotiations.",),
        ),
        meeting_action_type="negotiation",
        base_score=48.0,
    ),
    "cofounder": RelationshipProfile(
        key="cofounder",
        label="Co-founder",
        scoring_priorities=("shared_goals", "power_dynamic", "stability", "trust"),
        weighted_planets=_planets(sun=12.0, mars=11.0, jupiter=10.0, saturn=10.0, mercury=9.0),
        weighted_houses={10: 1.0, 1: 0.9, 11: 0.9, 6: 0.7},
        weighted_harmony_aspects={**_DEFAULT_HARMONY, "conjunction": 6.0},
        weighted_tension_aspects={"square": 9.0, "opposition": 8.0},
        reasoning_categories=("shared_goals", "power_dynamic", "stability", "trust", "growth"),
        insight_sections=(
            _section("shared_goals", ("sun", "mars", "jupiter"), 12.0, 13.0),
            _section("power_dynamic", ("sun", "mars", "saturn"), 11.0, 14.0),
            _section("stability", ("saturn", "jupiter", "sun"), 10.0, 12.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Ship one visible win together this week.",),
            caution=("Watch for competing visions dressed as execution disagreements.",),
            tension=("Bring roles and decision rights back to writing.",),
        ),
        meeting_action_type="business_launch",
        base_score=47.0,
    ),
    "employee": RelationshipProfile(
        key="employee",
        label="Employee",
        scoring_priorities=("practical_fit", "communication", "boundaries", "growth"),
        weighted_planets=_planets(mercury=12.0, saturn=10.0, moon=9.0, jupiter=8.0),
        weighted_houses={6: 1.0, 10: 0.8, 3: 0.7},
        weighted_harmony_aspects=dict(_DEFAULT_HARMONY),
        weighted_tension_aspects=dict(_DEFAULT_TENSION),
        reasoning_categories=("practical_fit", "communication", "boundaries", "growth", "trust"),
        insight_sections=(
            _section("practical_fit", ("mercury", "saturn", "sun"), 11.0, 11.0),
            _section("communication", ("mercury", "moon"), 12.0, 10.0),
            _section("boundaries", ("saturn", "mars", "moon"), 9.0, 12.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Give clear scope and feedback loops.",),
            caution=("Check whether ambiguity reads as mistrust.",),
            tension=("Reset roles in writing after a tense exchange.",),
        ),
        meeting_action_type="hiring",
        base_score=50.0,
    ),
    "employer": RelationshipProfile(
        key="employer",
        label="Employer",
        scoring_priorities=("power_dynamic", "stability", "trust", "practical_fit"),
        weighted_planets=_planets(saturn=12.0, sun=11.0, jupiter=9.0, mercury=8.0),
        weighted_houses={10: 1.0, 6: 0.9, 2: 0.7},
        weighted_harmony_aspects=dict(_DEFAULT_HARMONY),
        weighted_tension_aspects={"square": 9.0, "opposition": 8.0},
        reasoning_categories=("power_dynamic", "stability", "trust", "boundaries", "practical_fit"),
        insight_sections=(
            _section("power_dynamic", ("saturn", "sun", "mars"), 10.0, 13.0),
            _section("stability", ("saturn", "jupiter", "sun"), 11.0, 11.0),
            _section("trust", ("saturn", "jupiter", "mercury"), 10.0, 12.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Ask what support would make their best work sustainable.",),
            caution=("Do not conflate respect with agreement.",),
            tension=("Separate performance feedback from identity.",),
        ),
        meeting_action_type="negotiation",
        base_score=49.0,
    ),
    "friend": RelationshipProfile(
        key="friend",
        label="Friend",
        scoring_priorities=("emotional_bond", "communication", "growth", "boundaries"),
        weighted_planets=_planets(moon=11.0, mercury=10.0, jupiter=9.0, venus=8.0),
        weighted_houses={11: 1.0, 3: 0.8, 5: 0.7},
        weighted_harmony_aspects={"trine": 9.0, "sextile": 7.0, "conjunction": 5.0},
        weighted_tension_aspects={"square": 6.0, "opposition": 6.0},
        reasoning_categories=("emotional_bond", "communication", "growth", "boundaries", "chemistry"),
        insight_sections=(
            _section("emotional_bond", ("moon", "venus", "sun"), 12.0, 10.0),
            _section("communication", ("mercury", "moon", "jupiter"), 11.0, 10.0),
            _section("growth", ("jupiter", "sun", "mercury"), 10.0, 9.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Keep a light recurring ritual.",),
            caution=("Do not over-function as therapist.",),
            tension=("Name the rupture directly.",),
        ),
        meeting_action_type="networking",
        base_score=52.0,
    ),
    "family": RelationshipProfile(
        key="family",
        label="Family",
        scoring_priorities=("emotional_bond", "stability", "boundaries", "communication"),
        weighted_planets=_planets(moon=12.0, sun=10.0, saturn=9.0, jupiter=8.0),
        weighted_houses={4: 1.0, 3: 0.8, 10: 0.6},
        weighted_harmony_aspects={**_DEFAULT_HARMONY, "conjunction": 6.0},
        weighted_tension_aspects=dict(_DEFAULT_TENSION),
        reasoning_categories=("emotional_bond", "stability", "boundaries", "communication", "trust"),
        insight_sections=(
            _section("emotional_bond", ("moon", "sun", "venus"), 12.0, 12.0),
            _section("stability", ("saturn", "jupiter", "moon"), 11.0, 11.0),
            _section("boundaries", ("saturn", "mars", "mercury"), 9.0, 13.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Honor shared history without replaying old roles.",),
            caution=("Notice when helpfulness becomes control.",),
            tension=("Set time limits on hard topics.",),
        ),
        meeting_action_type="negotiation",
        base_score=50.0,
    ),
    "parent_child": RelationshipProfile(
        key="parent_child",
        label="Parent / child",
        scoring_priorities=("emotional_bond", "boundaries", "growth", "communication"),
        weighted_planets=_planets(moon=12.0, saturn=11.0, sun=10.0, mercury=8.0),
        weighted_houses={4: 1.0, 5: 0.8, 10: 0.7},
        weighted_harmony_aspects=dict(_DEFAULT_HARMONY),
        weighted_tension_aspects={"square": 9.0, "opposition": 8.0},
        reasoning_categories=("emotional_bond", "boundaries", "growth", "power_dynamic", "communication"),
        insight_sections=(
            _section("emotional_bond", ("moon", "sun", "venus"), 12.0, 11.0),
            _section("boundaries", ("saturn", "mars", "sun"), 10.0, 14.0),
            _section("growth", ("jupiter", "mercury", "sun"), 11.0, 10.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Celebrate autonomy milestones.",),
            caution=("Watch for guilt or obligation masquerading as love.",),
            tension=("Separate respect from agreement.",),
        ),
        meeting_action_type="negotiation",
        base_score=49.0,
    ),
    "mentor": RelationshipProfile(
        key="mentor",
        label="Mentor",
        scoring_priorities=("growth", "trust", "communication", "boundaries"),
        weighted_planets=_planets(jupiter=12.0, saturn=11.0, mercury=10.0, sun=8.0),
        weighted_houses={9: 1.0, 3: 0.8, 10: 0.7},
        weighted_harmony_aspects={"trine": 8.0, "sextile": 7.0, "conjunction": 5.0},
        weighted_tension_aspects={"square": 7.0, "opposition": 7.0},
        reasoning_categories=("growth", "trust", "communication", "boundaries", "power_dynamic"),
        insight_sections=(
            _section("growth", ("jupiter", "sun", "mercury"), 12.0, 9.0),
            _section("trust", ("saturn", "jupiter", "mercury"), 11.0, 10.0),
            _section("communication", ("mercury", "moon", "jupiter"), 11.0, 10.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Set one concrete growth goal for the next month.",),
            caution=("Clarify availability — boundaries protect the relationship.",),
            tension=("Revisit expectations of access and response time.",),
        ),
        meeting_action_type="networking",
        base_score=51.0,
    ),
    "investor": RelationshipProfile(
        key="investor",
        label="Investor",
        scoring_priorities=("trust", "shared_goals", "practical_fit", "power_dynamic"),
        weighted_planets=_planets(jupiter=12.0, saturn=11.0, mercury=10.0, sun=9.0),
        weighted_houses={2: 1.0, 8: 0.9, 11: 0.8, 10: 0.7},
        weighted_harmony_aspects=dict(_DEFAULT_HARMONY),
        weighted_tension_aspects={"square": 9.0, "opposition": 8.0},
        reasoning_categories=("trust", "shared_goals", "practical_fit", "power_dynamic", "stability"),
        insight_sections=(
            _section("trust", ("saturn", "jupiter", "mercury"), 11.0, 13.0),
            _section("shared_goals", ("sun", "jupiter", "saturn"), 11.0, 12.0),
            _section("practical_fit", ("mercury", "saturn", "jupiter"), 10.0, 11.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Lead with metrics and milestones.",),
            caution=("Align on risk appetite before capital decisions accelerate.",),
            tension=("Bring third-party validation to the next conversation.",),
        ),
        meeting_action_type="investment",
        base_score=47.0,
    ),
    "client": RelationshipProfile(
        key="client",
        label="Client",
        scoring_priorities=("practical_fit", "communication", "trust", "boundaries"),
        weighted_planets=_planets(mercury=12.0, venus=10.0, saturn=10.0, jupiter=8.0),
        weighted_houses={7: 1.0, 2: 0.8, 6: 0.7},
        weighted_harmony_aspects=dict(_DEFAULT_HARMONY),
        weighted_tension_aspects=dict(_DEFAULT_TENSION),
        reasoning_categories=("practical_fit", "communication", "trust", "boundaries", "shared_goals"),
        insight_sections=(
            _section("practical_fit", ("mercury", "venus", "saturn"), 11.0, 11.0),
            _section("communication", ("mercury", "moon"), 12.0, 10.0),
            _section("trust", ("saturn", "jupiter", "venus"), 10.0, 12.0),
        ),
        recommendation_templates=RecommendationTemplates(
            aligned=("Confirm scope and success criteria in writing.",),
            caution=("Clarify revision limits and timelines before enthusiasm commits you.",),
            tension=("Move difficult topics to a call.",),
        ),
        meeting_action_type="contract_signing",
        base_score=48.0,
    ),
}

_LEGACY_ALIASES: Final[dict[str, str]] = {"rival": "business_partner"}


def resolve_relationship_profile(relationship_type: str | None) -> RelationshipProfile:
    if relationship_type is None or not str(relationship_type).strip():
        raise ValueError("Relationship type is required")
    raw = str(relationship_type).strip().lower().replace("-", "_").replace(" ", "_")
    if raw in _LEGACY_ALIASES:
        return RELATIONSHIP_PROFILES[_LEGACY_ALIASES[raw]]
    if raw in RELATIONSHIP_PROFILES:
        return RELATIONSHIP_PROFILES[raw]
    raise ValueError(f"Unknown relationship profile: {relationship_type}")
