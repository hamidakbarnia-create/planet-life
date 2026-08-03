"""Unit tests for identity invariant helpers (no database required)."""

from __future__ import annotations

import pytest

from .harness import IdentityHarnessError, assert_isolated_database_name
from .invariants import (
    FROZEN_NON_GOALS,
    assert_frozen_non_goals_declared,
    assert_guest_not_claimable_when_expired,
    assert_legal_guest_lifecycle_claim_pair,
    assert_no_provider_subject_columns,
    assert_owner_xor,
    is_guest_claimable,
    is_legal_guest_lifecycle_claim_pair,
)


def test_database_name_isolation_guard() -> None:
    assert_isolated_database_name("metioro_identity_test")
    with pytest.raises(IdentityHarnessError):
        assert_isolated_database_name("postgres")
    with pytest.raises(IdentityHarnessError):
        assert_isolated_database_name("production")



def test_frozen_non_goals_include_charter_rules() -> None:
    assert_frozen_non_goals_declared()
    assert "guests_are_never_users" in FROZEN_NON_GOALS
    assert "clerk_is_idp_only" in FROZEN_NON_GOALS
    assert "provider_ids_never_enter_business_tables" in FROZEN_NON_GOALS
    assert "fastapi_is_domain_authority" in FROZEN_NON_GOALS
    assert "postgresql_is_canonical" in FROZEN_NON_GOALS


def test_expired_is_legal_only_with_discarded_and_not_claimable() -> None:
    assert is_legal_guest_lifecycle_claim_pair("expired", "discarded")
    assert not is_guest_claimable("expired", "discarded")
    assert_guest_not_claimable_when_expired("expired", "discarded")


def test_claimed_pair_is_not_claimable() -> None:
    assert is_legal_guest_lifecycle_claim_pair("claimed", "claimed")
    assert not is_guest_claimable("claimed", "claimed")


def test_illegal_lifecycle_claim_pair_rejected() -> None:
    assert not is_legal_guest_lifecycle_claim_pair("expired", "unclaimed")
    with pytest.raises(AssertionError):
        assert_legal_guest_lifecycle_claim_pair("expired", "unclaimed")


def test_owner_xor_helper() -> None:
    assert_owner_xor("user-1", None)
    assert_owner_xor(None, "guest-1")
    with pytest.raises(AssertionError):
        assert_owner_xor(None, None)
    with pytest.raises(AssertionError):
        assert_owner_xor("user-1", "guest-1")


def test_provider_subject_columns_forbidden_on_business_shapes() -> None:
    assert_no_provider_subject_columns(["id", "owner_user_id", "created_at"])
    with pytest.raises(AssertionError):
        assert_no_provider_subject_columns(["id", "provider_subject"])
