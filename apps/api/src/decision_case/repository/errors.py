"""Typed Decision Case repository errors (E4)."""

from __future__ import annotations


class RepositoryError(Exception):
    """Base repository failure."""


class CaseNotFoundError(RepositoryError):
    """Unknown case_id or owner isolation failure."""


class DuplicateCaseError(RepositoryError):
    """Duplicate stable case_id."""


class DuplicateVersionError(RepositoryError):
    """Duplicate case or evaluation version."""


class StaleVersionError(RepositoryError):
    """Optimistic concurrency conflict (expected_case_version mismatch)."""


class InvalidStateError(RepositoryError):
    """Invalid canonical Case state value."""


class IllegalTransitionError(RepositoryError):
    """E3 rejected the requested lifecycle transition."""


class ImmutableRecordError(RepositoryError):
    """Attempted mutation of an immutable historical record."""


class InvalidEvidenceStateError(RepositoryError):
    """Unknown evidence eligibility state."""


class MissingRelationError(RepositoryError):
    """Required aggregate relation missing."""


class BrokenReferenceError(RepositoryError):
    """Broken candidate/comparison/evaluation reference."""
