"""Smoke tests for the EPIC-01 identity-domain PostgreSQL harness."""

from __future__ import annotations

import pytest

from .harness import (
    assert_identity_baseline_empty,
    list_public_tables,
    setup_identity_harness,
    teardown_identity_harness,
)
from .invariants import IDENTITY_TABLE_NAMES, assert_frozen_non_goals_declared


@pytest.mark.identity_db
def test_harness_connects_and_starts_from_empty_identity_baseline(identity_db) -> None:
    assert_frozen_non_goals_declared()
    assert "identity_test" in identity_db.database_name
    assert_identity_baseline_empty(identity_db.conn)
    public_tables = list_public_tables(identity_db.conn)
    assert public_tables.isdisjoint(IDENTITY_TABLE_NAMES)


@pytest.mark.identity_db
def test_harness_setup_and_teardown_preserve_empty_baseline(identity_db) -> None:
    setup_identity_harness(identity_db.conn)
    with identity_db.conn.cursor() as cur:
        cur.execute("SELECT 1")
        assert cur.fetchone() == (1,)
    teardown_identity_harness(identity_db.conn)
    assert_identity_baseline_empty(identity_db.conn)


@pytest.mark.identity_db
def test_harness_exposes_live_connection_for_future_invariant_checks(identity_db) -> None:
    with identity_db.conn.cursor() as cur:
        cur.execute("SELECT current_database(), current_user")
        database_name, _user = cur.fetchone()
    assert database_name == identity_db.database_name
    assert "identity_test" in database_name
