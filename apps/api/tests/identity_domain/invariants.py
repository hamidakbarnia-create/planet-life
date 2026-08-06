"""Reusable identity-domain invariant helpers for EPIC-01 tests.

These helpers encode ratified non-goals and schema/SM expectations for
assertions in later PRs. They contain no production identity behavior and
do not create tables or perform claims.
"""

from __future__ import annotations

from typing import Iterable

# Frozen non-goals (EPIC-01 charter / ratified architecture).
FROZEN_NON_GOALS: frozenset[str] = frozenset(
    {
        "guests_are_never_users",
        "clerk_is_idp_only",
        "provider_ids_never_enter_business_tables",
        "fastapi_is_domain_authority",
        "postgresql_is_canonical",
    }
)

# Ratified identity table names (schema spec).
IDENTITY_TABLE_NAMES: tuple[str, ...] = (
    "users",
    "auth_identities",
    "guest_installations",
    "guest_claim_token_nonces",
    "guest_claim_conflicts",
    "guest_claim_audit",
)

# EPIC-01 PR-02 production tables.
AUTHENTICATED_IDENTITY_TABLES: frozenset[str] = frozenset(
    {
        "users",
        "auth_identities",
    }
)

# Guest principal + nonce ledger.
GUEST_CORE_IDENTITY_TABLES: frozenset[str] = frozenset(
    {
        "guest_installations",
        "guest_claim_token_nonces",
    }
)

# Conflict + audit evidence schema implemented in this slice.
EVIDENCE_IDENTITY_TABLES: frozenset[str] = frozenset(
    {
        "guest_claim_conflicts",
        "guest_claim_audit",
    }
)

# No remaining guest identity tables deferred after this slice.
DEFERRED_GUEST_IDENTITY_TABLES: frozenset[str] = frozenset()

# Backward-compatible alias used by older helpers/tests.
GUEST_IDENTITY_TABLES: frozenset[str] = DEFERRED_GUEST_IDENTITY_TABLES

# Canonical bare stored event_type values (Errata 01).
CANONICAL_AUDIT_EVENT_TYPES: tuple[str, ...] = (
    "guest_created",
    "claim_token_issued",
    "claim_started",
    "claim_choice_required",
    "claim_choice_submitted",
    "guest_claimed",
    "guest_claim_failed",
    "guest_claim_idempotent",
    "guest_discarded",
    "guest_expired",
    "guest_purged",
    "transition_rejected",
)

# Legal (lifecycle_state, claim_state) pairs from IDENTITY-DOMAIN-POSTGRES-SCHEMA.
LEGAL_GUEST_LIFECYCLE_CLAIM_PAIRS: frozenset[tuple[str, str]] = frozenset(
    {
        ("active", "unclaimed"),
        ("active", "awaiting_choice"),
        ("active", "claim_failed"),
        ("active", "discarded"),
        ("pending_claim", "claim_in_progress"),
        ("claimed", "claimed"),
        ("expired", "discarded"),
        ("purged", "discarded"),
    }
)

CLAIMABLE_GUEST_PAIRS: frozenset[tuple[str, str]] = frozenset(
    {
        ("active", "unclaimed"),
        ("active", "awaiting_choice"),
        ("active", "claim_failed"),
    }
)

PROVIDER_SUBJECT_COLUMN_NAMES: frozenset[str] = frozenset(
    {
        "provider_subject",
        "clerk_sub",
        "clerk_user_id",
        "auth_provider_id",
        "external_subject",
    }
)

USERS_FORBIDDEN_PROVIDER_COLUMNS: frozenset[str] = frozenset(
    {
        "provider",
        "provider_subject",
        "clerk_sub",
        "clerk_user_id",
        "auth_provider_id",
        "external_subject",
        "identity_kind",
    }
)

GUEST_CLAIM_CONFLICTS_COLUMNS: frozenset[str] = frozenset(
    {
        "id",
        "guest_installation_id",
        "user_id",
        "status",
        "conflict_classes",
        "conflict_classes_redacted",
        "choices",
        "idempotency_key",
        "created_at",
        "updated_at",
        "resolved_at",
        "expires_at",
        "scrubbed_at",
    }
)

GUEST_CLAIM_AUDIT_COLUMNS: frozenset[str] = frozenset(
    {
        "id",
        "event_type",
        "guest_installation_id",
        "user_id",
        "claim_token_nonce",
        "idempotency_key",
        "payload_pii",
        "pii_state",
        "scrubbed_at",
        "created_at",
        "delivery_state",
        "published_at",
        "retention_until",
    }
)


def assert_frozen_non_goals_declared() -> None:
    """Ensure charter non-goals remain explicitly enumerated for tests."""
    required = {
        "guests_are_never_users",
        "clerk_is_idp_only",
        "provider_ids_never_enter_business_tables",
        "fastapi_is_domain_authority",
        "postgresql_is_canonical",
    }
    missing = required - FROZEN_NON_GOALS
    assert not missing, f"Missing frozen non-goals: {sorted(missing)}"


def is_legal_guest_lifecycle_claim_pair(lifecycle_state: str, claim_state: str) -> bool:
    return (lifecycle_state, claim_state) in LEGAL_GUEST_LIFECYCLE_CLAIM_PAIRS


def is_guest_claimable(lifecycle_state: str, claim_state: str) -> bool:
    """EXPIRED and CLAIMED are never claimable (schema + SM)."""
    return (lifecycle_state, claim_state) in CLAIMABLE_GUEST_PAIRS


def assert_legal_guest_lifecycle_claim_pair(lifecycle_state: str, claim_state: str) -> None:
    assert is_legal_guest_lifecycle_claim_pair(lifecycle_state, claim_state), (
        f"Illegal guest (lifecycle_state, claim_state)=({lifecycle_state!r}, {claim_state!r})"
    )


def assert_guest_not_claimable_when_expired(lifecycle_state: str, claim_state: str) -> None:
    if lifecycle_state == "expired":
        assert claim_state == "discarded"
        assert not is_guest_claimable(lifecycle_state, claim_state)


def assert_no_provider_subject_columns(column_names: Iterable[str]) -> None:
    """Business / guest-capable tables must not carry provider subject columns."""
    found = PROVIDER_SUBJECT_COLUMN_NAMES.intersection(column_names)
    assert not found, f"Provider subject columns forbidden outside auth_identities: {sorted(found)}"


def assert_owner_xor(owner_user_id: object | None, owner_guest_installation_id: object | None) -> None:
    """Guest-capable rows: exactly one owner set (S-INV-3)."""
    has_user = owner_user_id is not None
    has_guest = owner_guest_installation_id is not None
    assert has_user != has_guest, (
        "Owner XOR violated: need exactly one of owner_user_id / owner_guest_installation_id"
    )
