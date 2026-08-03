"""Smoke tests for the EPIC-01 identity-domain PostgreSQL harness."""

from __future__ import annotations

import pytest

from .harness import (
    assert_authenticated_identity_tables_present,
    assert_deferred_guest_tables_absent,
    assert_guest_core_identity_tables_present,
    list_public_tables,
    setup_identity_harness,
    teardown_identity_harness,
)
from .invariants import (
    AUTHENTICATED_IDENTITY_TABLES,
    DEFERRED_GUEST_IDENTITY_TABLES,
    GUEST_CORE_IDENTITY_TABLES,
    assert_frozen_non_goals_declared,
)


@pytest.mark.identity_db
def test_harness_connects_with_guest_core_migrated_baseline(identity_db) -> None:
    assert_frozen_non_goals_declared()
    assert "identity_test" in identity_db.database_name
    assert_authenticated_identity_tables_present(identity_db.conn)
    assert_guest_core_identity_tables_present(identity_db.conn)
    assert_deferred_guest_tables_absent(identity_db.conn)
    public_tables = list_public_tables(identity_db.conn)
    assert AUTHENTICATED_IDENTITY_TABLES.issubset(public_tables)
    assert GUEST_CORE_IDENTITY_TABLES.issubset(public_tables)
    assert public_tables.isdisjoint(DEFERRED_GUEST_IDENTITY_TABLES)


@pytest.mark.identity_db
def test_harness_setup_and_teardown_preserve_current_baseline(identity_db) -> None:
    setup_identity_harness(identity_db.conn)
    with identity_db.conn.cursor() as cur:
        cur.execute("SELECT 1")
        assert cur.fetchone() == (1,)
    teardown_identity_harness(identity_db.conn)
    assert_authenticated_identity_tables_present(identity_db.conn)
    assert_guest_core_identity_tables_present(identity_db.conn)
    assert_deferred_guest_tables_absent(identity_db.conn)


@pytest.mark.identity_db
def test_harness_exposes_live_connection_for_invariant_checks(identity_db) -> None:
    with identity_db.conn.cursor() as cur:
        cur.execute("SELECT current_database(), current_user")
        database_name, _user = cur.fetchone()
    assert database_name == identity_db.database_name
    assert "identity_test" in database_name
