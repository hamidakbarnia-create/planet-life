"""Decision Case Repository — sole System of Record for Case aggregates."""

from .errors import (
    BrokenReferenceError,
    CaseNotFoundError,
    DuplicateCaseError,
    DuplicateVersionError,
    IllegalTransitionError,
    ImmutableRecordError,
    InvalidEvidenceStateError,
    InvalidStateError,
    MissingRelationError,
    RepositoryError,
    StaleVersionError,
)
from .models import (
    CaseRecord,
    CaseVersionRecord,
    ComparisonRank,
    EvaluationRecord,
    EvidenceBindingRecord,
    HistoryEventRecord,
    ParticipantRecord,
    TimelineEntry,
)
from .postgres import DecisionCaseRepository

__all__ = [
    "BrokenReferenceError",
    "CaseNotFoundError",
    "CaseRecord",
    "CaseVersionRecord",
    "ComparisonRank",
    "DecisionCaseRepository",
    "DuplicateCaseError",
    "DuplicateVersionError",
    "EvaluationRecord",
    "EvidenceBindingRecord",
    "HistoryEventRecord",
    "IllegalTransitionError",
    "ImmutableRecordError",
    "InvalidEvidenceStateError",
    "InvalidStateError",
    "MissingRelationError",
    "ParticipantRecord",
    "RepositoryError",
    "StaleVersionError",
    "TimelineEntry",
]
