"""Migration apply / status / verify checks for Identity schema migrations."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[2] / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from db_migrate.discovery import default_migrations_dir, discover_migrations
from db_migrate.runner import apply_migrations, status_migrations, verify_migrations

from .harness import (
    assert_authenticated_identity_tables_present,
    assert_deferred_guest_tables_absent,
    assert_evidence_identity_tables_present,
    assert_guest_core_identity_tables_present,
    connect_identity_database,
    drop_identity_schema_objects,
)


pytestmark = pytest.mark.identity_db

EXPECTED_MIGRATIONS = [
    "0001__users.sql",
    "0002__auth_identities.sql",
    "0003__guest_installations.sql",
    "0004__guest_claim_token_nonces.sql",
    "0005__guest_claim_token_nonces_terminal_irreversibility.sql",
    "0006__guest_claim_token_nonces_terminal_freeze.sql",
    "0007__guest_claim_conflicts.sql",
    "0008__guest_claim_audit.sql",
]


def test_canonical_migrations_include_evidence_tables() -> None:
    found = discover_migrations(default_migrations_dir())
    names = [m.filename for m in found]
    assert names == EXPECTED_MIGRATIONS


def test_apply_from_empty_is_idempotent_and_verifiable(identity_database_url: str) -> None:
    conn = connect_identity_database(identity_database_url)
    try:
        drop_identity_schema_objects(conn)
    finally:
        conn.close()

    directory = default_migrations_dir()
    first = apply_migrations(identity_database_url, directory)
    assert [m.filename for m in first.applied_now] == EXPECTED_MIGRATIONS

    status = status_migrations(identity_database_url, directory)
    assert [row.filename for row in status.applied] == EXPECTED_MIGRATIONS
    assert status.pending == []

    second = apply_migrations(identity_database_url, directory)
    assert second.applied_now == []

    verified = verify_migrations(identity_database_url, directory)
    assert verified.ok is True
    assert verified.errors == []

    conn = connect_identity_database(identity_database_url)
    try:
        assert_authenticated_identity_tables_present(conn)
        assert_guest_core_identity_tables_present(conn)
        assert_evidence_identity_tables_present(conn)
        assert_deferred_guest_tables_absent(conn)
    finally:
        conn.close()
