"""Migration apply / status / verify checks for EPIC-01 PR-02."""

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
    assert_guest_identity_tables_absent,
    drop_identity_schema_objects,
    connect_identity_database,
)


pytestmark = pytest.mark.identity_db


def test_canonical_migrations_include_users_and_auth_identities() -> None:
    found = discover_migrations(default_migrations_dir())
    names = [m.filename for m in found]
    assert "0001__users.sql" in names
    assert "0002__auth_identities.sql" in names
    assert [m.version_int for m in found if m.version_int in (1, 2)] == [1, 2]


def test_apply_from_empty_is_idempotent_and_verifiable(identity_database_url: str) -> None:
    conn = connect_identity_database(identity_database_url)
    try:
        drop_identity_schema_objects(conn)
    finally:
        conn.close()

    directory = default_migrations_dir()
    first = apply_migrations(identity_database_url, directory)
    assert {m.filename for m in first.applied_now} >= {
        "0001__users.sql",
        "0002__auth_identities.sql",
    }

    status = status_migrations(identity_database_url, directory)
    applied_names = {row.filename for row in status.applied}
    assert "0001__users.sql" in applied_names
    assert "0002__auth_identities.sql" in applied_names
    assert status.pending == []

    second = apply_migrations(identity_database_url, directory)
    assert second.applied_now == []

    verified = verify_migrations(identity_database_url, directory)
    assert verified.ok is True
    assert verified.errors == []

    conn = connect_identity_database(identity_database_url)
    try:
        assert_authenticated_identity_tables_present(conn)
        assert_guest_identity_tables_absent(conn)
    finally:
        conn.close()
