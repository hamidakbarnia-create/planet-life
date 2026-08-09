"""Regression: FIND framing requires migration 0010 mode/state constraints.

Production outage (request IDs 44cb989c-… / 7b0182b4-…): API code wrote
mode=find_dates while prod DB was still on 0009__decision_cases.sql, so
decision_cases_mode_check rejected the INSERT/UPDATE as CheckViolation → 500.
"""

from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

import psycopg
import pytest

from db_migrate.discovery import default_migrations_dir, discover_migrations
from db_migrate.runner import apply_migrations, status_migrations
from identity_domain.harness import connect_identity_database, drop_identity_schema_objects

pytestmark = pytest.mark.identity_db

FINDINGS_MIGRATION = "0010__decision_findings.sql"


def _copy_migrations_through(
    src: Path, dest: Path, *, max_version: int
) -> Path:
    dest.mkdir(parents=True, exist_ok=True)
    for migration in discover_migrations(src):
        if migration.version_int <= max_version:
            shutil.copy2(migration.path, dest / migration.filename)
    readme = src / "README.md"
    if readme.exists():
        shutil.copy2(readme, dest / "README.md")
    return dest


def test_find_dates_mode_rejected_before_0010_then_accepted(
    identity_database_url: str, tmp_path: Path
) -> None:
    conn = connect_identity_database(identity_database_url)
    try:
        drop_identity_schema_objects(conn)
    finally:
        conn.close()

    src = default_migrations_dir()
    through_0009 = _copy_migrations_through(src, tmp_path / "m0009", max_version=9)
    apply_migrations(identity_database_url, through_0009)

    status = status_migrations(identity_database_url, through_0009)
    assert status.pending == []
    assert all(a.filename != FINDINGS_MIGRATION for a in status.applied)

    with psycopg.connect(identity_database_url) as probe:
        with probe.cursor() as cur:
            cur.execute(
                """
                SELECT pg_get_constraintdef(oid)
                FROM pg_constraint
                WHERE conrelid = 'decision_cases'::regclass
                  AND conname = 'decision_cases_mode_check'
                """
            )
            mode_check = cur.fetchone()[0]
            assert "find_dates" not in mode_check
            cur.execute(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public'
                    AND table_name = 'decision_findings'
                )
                """
            )
            assert cur.fetchone()[0] is False

            with pytest.raises(psycopg.errors.CheckViolation) as excinfo:
                cur.execute(
                    """
                    INSERT INTO decision_cases (
                        case_id, owner_subject_id, decision_type_id, family_id,
                        title, state, mode, precision_level, schema_version,
                        current_case_version, paused_prior_state
                    ) VALUES (
                        %s, 'probe', 'bus-product-launch', 'timing_opt',
                        'probe', 'draft', 'find_dates', 'L1', '1.0.0', 1, NULL
                    )
                    """,
                    (str(uuid4()),),
                )
            assert "decision_cases_mode_check" in str(excinfo.value)
            probe.rollback()

    # Full tree (includes 0010) against the same DB advances the schema.
    apply_migrations(identity_database_url, src)
    status_full = status_migrations(identity_database_url, src)
    assert status_full.pending == []
    assert any(a.filename == FINDINGS_MIGRATION for a in status_full.applied)

    with psycopg.connect(identity_database_url) as probe:
        with probe.cursor() as cur:
            cur.execute(
                """
                SELECT pg_get_constraintdef(oid)
                FROM pg_constraint
                WHERE conrelid = 'decision_cases'::regclass
                  AND conname = 'decision_cases_mode_check'
                """
            )
            assert "find_dates" in cur.fetchone()[0]
            cur.execute(
                """
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public'
                    AND table_name = 'decision_findings'
                )
                """
            )
            assert cur.fetchone()[0] is True
            cur.execute(
                """
                INSERT INTO decision_cases (
                    case_id, owner_subject_id, decision_type_id, family_id,
                    title, state, mode, precision_level, schema_version,
                    current_case_version, paused_prior_state
                ) VALUES (
                    %s, 'probe', 'bus-product-launch', 'timing_opt',
                    'probe', 'draft', 'find_dates', 'L1', '1.0.0', 1, NULL
                )
                """,
                (str(uuid4()),),
            )
            probe.rollback()
