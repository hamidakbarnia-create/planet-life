"""Strict EPIC-001 Decision Type Registry v1 models.

This module freezes only fields with explicit authority.
Per-type intake slots and completion rules remain unimplemented until
canonical type records are authorized.
"""

from __future__ import annotations

from typing import Any, Final, Literal, Mapping, get_args

from pydantic import BaseModel, ConfigDict, Field, model_validator


RegistrySchemaVersion = Literal["1.0.0"]
DecisionTypeId = Literal[
    "tim-compare-three",
    "car-interview",
    "mar-wedding-date",
    "bus-investor-meeting",
    "bus-product-launch",
    "car-offer-negotiation",
]
FamilyId = Literal["timing_opt", "visibility"]
DecisionMode = Literal["evaluate_date", "compare_dates", "find_dates"]
EntryMode = Literal["structured"]
OutputProfile = Literal["decision_evaluation_package.v1"]
RiskLevel = Literal["standard", "elevated", "high_stakes"]
RiskDomain = Literal[
    "legal",
    "immigration",
    "medical",
    "financial",
    "safety",
    "employment",
    "relationship",
    "other",
]
RiskResolution = Literal["registry", "documented_default", "unresolved", "explicit"]

DEADLINE_PRIORITY_INVARIANT = (
    "A known legal, administrative, medical, or financial deadline must never "
    "be delayed because astrology semantics indicate review, recovery, or "
    "defensive timing. This phase records the invariant and policy code; it "
    "does not implement scheduling."
)


class RegistryModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class RiskContext(RegistryModel):
    """Explicit decision-type risk/safety context. Never inferred from names."""

    level: RiskLevel = "standard"
    domains: tuple[RiskDomain, ...] = ()
    outcome_prediction_prohibited: bool = False
    factual_deadline_priority: bool = False

    @model_validator(mode="after")
    def _high_stakes_never_predicts_outcomes(self) -> "RiskContext":
        if self.level == "high_stakes" and not self.outcome_prediction_prohibited:
            return self.model_copy(update={"outcome_prediction_prohibited": True})
        return self


class ResolvedRiskContext(RegistryModel):
    """Resolved risk context with provenance. Unknown is not high risk."""

    level: RiskLevel
    domains: tuple[RiskDomain, ...]
    outcome_prediction_prohibited: bool
    factual_deadline_priority: bool
    resolution: RiskResolution

    @model_validator(mode="after")
    def _high_stakes_never_predicts_outcomes(self) -> "ResolvedRiskContext":
        if self.level == "high_stakes" and not self.outcome_prediction_prohibited:
            return self.model_copy(update={"outcome_prediction_prohibited": True})
        return self


def documented_default_risk_context(
    *,
    resolution: RiskResolution = "documented_default",
) -> ResolvedRiskContext:
    """Conservative default for omitted registry fields or unknown types.

    Not high_stakes. Unknown risk is not treated as high risk.
    """
    return ResolvedRiskContext(
        level="standard",
        domains=(),
        outcome_prediction_prohibited=False,
        factual_deadline_priority=False,
        resolution=resolution,
    )


def risk_context_from_mapping(payload: Mapping[str, Any]) -> ResolvedRiskContext:
    """Read ``risk_context`` only. Never inspects id, label, or other names."""
    if "risk_context" not in payload:
        return documented_default_risk_context()
    raw = payload.get("risk_context")
    parsed = RiskContext.model_validate(raw if isinstance(raw, Mapping) else {})
    return ResolvedRiskContext(
        level=parsed.level,
        domains=parsed.domains,
        outcome_prediction_prohibited=parsed.outcome_prediction_prohibited,
        factual_deadline_priority=parsed.factual_deadline_priority,
        resolution="registry",
    )


def risk_context_from_record(record: "DecisionTypeRecord") -> ResolvedRiskContext:
    """Use the structured field only. Id and label are not classifiers."""
    if "risk_context" not in record.model_fields_set:
        return documented_default_risk_context()
    rc = record.risk_context
    return ResolvedRiskContext(
        level=rc.level,
        domains=rc.domains,
        outcome_prediction_prohibited=rc.outcome_prediction_prohibited,
        factual_deadline_priority=rc.factual_deadline_priority,
        resolution="registry",
    )


class DecisionTypeRecord(RegistryModel):
    decision_type_id: DecisionTypeId
    family_id: FamilyId
    label: str = Field(min_length=1)
    create_mode: Literal["none"]
    available_entry_modes: tuple[EntryMode, ...] = Field(min_length=1)
    allowed_modes: tuple[DecisionMode, ...] = Field(min_length=1)
    output_profile: OutputProfile
    risk_context: RiskContext = Field(default_factory=RiskContext)


# Canonical registry authority. Authorizing a Decision Type requires two
# explicit edits: extend ``DecisionTypeId`` and add the matching
# ``EXPECTED_RECORDS`` entry. Registry size is derived from those declarations
# so the authorized count is never restated as a literal.
EXPECTED_TYPE_IDS: Final[frozenset[str]] = frozenset(get_args(DecisionTypeId))

EXPECTED_RECORDS: dict[str, tuple[str, tuple[str, ...]]] = {
    "tim-compare-three": ("timing_opt", ("compare_dates",)),
    "car-interview": (
        "visibility",
        ("evaluate_date", "compare_dates", "find_dates"),
    ),
    "mar-wedding-date": (
        "timing_opt",
        ("evaluate_date", "compare_dates"),
    ),
    "bus-investor-meeting": (
        "visibility",
        ("evaluate_date", "compare_dates"),
    ),
    "bus-product-launch": (
        "timing_opt",
        ("evaluate_date", "find_dates"),
    ),
    "car-offer-negotiation": (
        "visibility",
        ("evaluate_date",),
    ),
}

if frozenset(EXPECTED_RECORDS) != EXPECTED_TYPE_IDS:
    _missing = sorted(EXPECTED_TYPE_IDS - frozenset(EXPECTED_RECORDS))
    _unexpected = sorted(frozenset(EXPECTED_RECORDS) - EXPECTED_TYPE_IDS)
    raise RuntimeError(
        "registry authority is inconsistent: DecisionTypeId and "
        "EXPECTED_RECORDS must authorize the same decision type ids; "
        f"missing={_missing}, unexpected={_unexpected}"
    )

EXPECTED_REGISTRY_SIZE: Final[int] = len(EXPECTED_TYPE_IDS)


class DecisionTypeRegistry(RegistryModel):
    schema_version: RegistrySchemaVersion
    decision_types: tuple[DecisionTypeRecord, ...] = Field(
        min_length=EXPECTED_REGISTRY_SIZE,
        max_length=EXPECTED_REGISTRY_SIZE,
    )


__all__ = [
    "DEADLINE_PRIORITY_INVARIANT",
    "DecisionMode",
    "DecisionTypeId",
    "DecisionTypeRecord",
    "DecisionTypeRegistry",
    "EXPECTED_RECORDS",
    "EXPECTED_REGISTRY_SIZE",
    "EXPECTED_TYPE_IDS",
    "ResolvedRiskContext",
    "RiskContext",
    "RiskDomain",
    "RiskLevel",
    "RiskResolution",
    "documented_default_risk_context",
    "risk_context_from_mapping",
    "risk_context_from_record",
]
