"""Typed models for Ask evaluation datasets, rubrics, and reports."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

AskLocale = Literal["en", "ru", "fa", "ar"]
AskRole = Literal["user", "assistant"]
RiskLevel = Literal["low", "medium", "high"]

ALLOWED_LOCALES: frozenset[str] = frozenset({"en", "ru", "fa", "ar"})
ALLOWED_ROLES: frozenset[str] = frozenset({"user", "assistant"})
ALLOWED_RISK_LEVELS: frozenset[str] = frozenset({"low", "medium", "high"})

REQUIRED_RUBRIC_DIMENSIONS: tuple[str, ...] = (
    "relevance",
    "specificity",
    "actionability",
    "reasoning_quality",
    "context_use",
    "uncertainty_handling",
    "safety_and_restraint",
    "conciseness",
    "product_differentiation",
    "language_quality",
)

SCORE_SCALE: tuple[int, ...] = (0, 1, 2, 3, 4)


@dataclass(frozen=True)
class EvalMessage:
    role: AskRole
    content: str


@dataclass(frozen=True)
class EvalScenario:
    id: str
    category: str
    locale: AskLocale
    messages: tuple[EvalMessage, ...]
    available_context: dict[str, Any]
    expected_characteristics: tuple[str, ...]
    forbidden_characteristics: tuple[str, ...]
    risk_level: RiskLevel
    forbidden_phrases: tuple[str, ...] = ()


@dataclass(frozen=True)
class EvalDataset:
    version: str
    scenarios: tuple[EvalScenario, ...]


@dataclass(frozen=True)
class RubricScoreDefinition:
    score: int
    criterion: str


@dataclass(frozen=True)
class RubricDimension:
    dimension: str
    scores: tuple[RubricScoreDefinition, ...]


@dataclass(frozen=True)
class EvalRubric:
    version: str
    scale_min: int
    scale_max: int
    dimensions: tuple[RubricDimension, ...]


@dataclass(frozen=True)
class StructuralCheckResult:
    check_id: str
    passed: bool
    detail: str


@dataclass(frozen=True)
class StructuralEvaluation:
    passed: bool
    checks: tuple[StructuralCheckResult, ...]

    @property
    def failed_checks(self) -> tuple[StructuralCheckResult, ...]:
        return tuple(check for check in self.checks if not check.passed)


@dataclass
class ScenarioRunResult:
    scenario_id: str
    category: str
    locale: str
    success: bool
    response: str | None
    provider: str
    model: str
    prompt_version: str
    latency_ms: float | None
    validation_ok: bool | None
    error_type: str | None
    error_message: str | None
    structural: StructuralEvaluation | None
    messages: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        return payload


@dataclass(frozen=True)
class BaselineReport:
    dataset_version: str
    rubric_version: str
    provider: str
    model: str
    prompt_version: str
    execution_timestamp: str
    scenario_count: int
    success_count: int
    failure_count: int
    structural_pass_rate: float | None
    category_breakdown: dict[str, dict[str, int]]
    locale_breakdown: dict[str, dict[str, int]]
    latency_statistics: dict[str, float | None]
    validation_failures: int
    provider_failures: int
    structural_failures: int
    subjective_scores_included: bool
    scenarios: tuple[ScenarioRunResult, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "dataset_version": self.dataset_version,
            "rubric_version": self.rubric_version,
            "provider": self.provider,
            "model": self.model,
            "prompt_version": self.prompt_version,
            "execution_timestamp": self.execution_timestamp,
            "scenario_count": self.scenario_count,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "structural_pass_rate": self.structural_pass_rate,
            "category_breakdown": self.category_breakdown,
            "locale_breakdown": self.locale_breakdown,
            "latency_statistics": self.latency_statistics,
            "validation_failures": self.validation_failures,
            "provider_failures": self.provider_failures,
            "structural_failures": self.structural_failures,
            "subjective_scores_included": self.subjective_scores_included,
            "scenarios": [item.to_dict() for item in self.scenarios],
        }


# Human-review template column order (CSV / JSONL compatible).
HUMAN_REVIEW_FIELDS: tuple[str, ...] = (
    "scenario_id",
    "response",
    "relevance_score",
    "specificity_score",
    "actionability_score",
    "reasoning_score",
    "context_use_score",
    "uncertainty_score",
    "safety_score",
    "conciseness_score",
    "differentiation_score",
    "language_score",
    "pass_fail",
    "critical_failure",
    "reviewer_notes",
    "suggested_improvement",
)
