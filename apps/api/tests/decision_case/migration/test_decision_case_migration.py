"""Migration Foundation tests for decision-case SQL migrations."""

from __future__ import annotations

import hashlib
from pathlib import Path

import pytest

from db_migrate.discovery import default_migrations_dir, discover_migrations
from db_migrate.runner import apply_migrations, status_migrations, verify_migrations
from identity_domain.harness import connect_identity_database, drop_identity_schema_objects

pytestmark = pytest.mark.identity_db

MIGRATION_NAME = "0009__decision_cases.sql"
FINDINGS_MIGRATION_NAME = "0010__decision_findings.sql"


def test_decision_case_migration_present() -> None:
    names = [m.filename for m in discover_migrations(default_migrations_dir())]
    assert MIGRATION_NAME in names
    assert FINDINGS_MIGRATION_NAME in names
    assert names[-1] == FINDINGS_MIGRATION_NAME


def test_fresh_apply_status_verify_idempotent(identity_database_url: str) -> None:
    conn = connect_identity_database(identity_database_url)
    try:
        drop_identity_schema_objects(conn)
    finally:
        conn.close()

    directory = default_migrations_dir()
    first = apply_migrations(identity_database_url, directory)
    assert any(m.filename == MIGRATION_NAME for m in first.applied_now)
    assert any(m.filename == FINDINGS_MIGRATION_NAME for m in first.applied_now)

    status = status_migrations(identity_database_url, directory)
    assert status.pending == []
    assert any(a.filename == MIGRATION_NAME for a in status.applied)
    assert any(a.filename == FINDINGS_MIGRATION_NAME for a in status.applied)

    second = apply_migrations(identity_database_url, directory)
    assert second.applied_now == []

    verified = verify_migrations(identity_database_url, directory)
    assert verified.ok is True
    assert verified.errors == []

    conn = connect_identity_database(identity_database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT tablename FROM pg_catalog.pg_tables
                WHERE schemaname = 'public' AND tablename LIKE 'decision_%'
                """
            )
            tables = {r[0] for r in cur.fetchall()}
        assert "decision_cases" in tables
        assert "decision_versions" in tables
        assert "decision_evaluations" in tables
        assert "decision_history_events" in tables
        assert "decision_comparison_ranks" in tables
        assert "decision_findings" in tables
    finally:
        conn.close()


def test_forward_apply_on_existing_identity_schema(identity_database_url: str) -> None:
    """Apply all migrations; latest decision-case migration is findings."""
    conn = connect_identity_database(identity_database_url)
    try:
        drop_identity_schema_objects(conn)
    finally:
        conn.close()

    directory = default_migrations_dir()
    apply_migrations(identity_database_url, directory)
    status = status_migrations(identity_database_url, directory)
    assert [a.filename for a in status.applied][-1] == FINDINGS_MIGRATION_NAME


def test_checksum_mismatch_fails(identity_database_url: str, tmp_path: Path) -> None:
    conn = connect_identity_database(identity_database_url)
    try:
        drop_identity_schema_objects(conn)
    finally:
        conn.close()

    # Copy migrations to temp and tamper 0009 after apply
    src = default_migrations_dir()
    for item in src.iterdir():
        if item.suffix == ".sql" or item.name == "README.md":
            (tmp_path / item.name).write_bytes(item.read_bytes())

    apply_migrations(identity_database_url, tmp_path)
    target = tmp_path / MIGRATION_NAME
    target.write_text(target.read_text(encoding="utf-8") + "\n-- tamper\n", encoding="utf-8")
    verified = verify_migrations(identity_database_url, tmp_path)
    assert verified.ok is False
    assert any("Checksum mismatch" in e for e in verified.errors)
    # restore note: real migrations dir untouched
    _ = hashlib.sha256
