"""PostgreSQL tests for migration apply / status / verify / locks / failures."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[2] / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

psycopg = pytest.importorskip("psycopg")

from db_migrate.errors import MigrationError
from db_migrate.runner import apply_migrations, status_migrations, verify_migrations
from db_migrate.tracking import (
    ADVISORY_LOCK_KEY1,
    ADVISORY_LOCK_KEY2,
    try_acquire_advisory_lock,
)


pytestmark = pytest.mark.migrate_db


def _write_migration(directory: Path, filename: str, sql: str) -> Path:
    path = directory / filename
    path.write_text(sql, encoding="utf-8")
    return path


def test_status_and_apply_ordering(
    clean_migrate_db: str, migrations_tmpdir: Path
) -> None:
    _write_migration(
        migrations_tmpdir,
        "0002__second.sql",
        "CREATE TABLE migrate_foundation_probe (id int primary key);\n"
        "INSERT INTO migrate_foundation_probe(id) VALUES (2);\n",
    )
    _write_migration(
        migrations_tmpdir,
        "0001__first.sql",
        "SELECT 1;\n",
    )

    status_before = status_migrations(clean_migrate_db, migrations_tmpdir)
    assert [m.version_int for m in status_before.pending] == [1, 2]
    assert status_before.applied == []

    report = apply_migrations(clean_migrate_db, migrations_tmpdir)
    assert [m.version_int for m in report.applied_now] == [1, 2]

    status_after = status_migrations(clean_migrate_db, migrations_tmpdir)
    assert status_after.pending == []
    assert [a.version for a in status_after.applied] == ["1", "2"]


def test_verify_ok_and_checksum_mismatch(
    clean_migrate_db: str, migrations_tmpdir: Path
) -> None:
    path = _write_migration(
        migrations_tmpdir, "0001__ok.sql", "SELECT 1;\n"
    )
    apply_migrations(clean_migrate_db, migrations_tmpdir)
    ok = verify_migrations(clean_migrate_db, migrations_tmpdir)
    assert ok.ok is True
    assert ok.errors == []

    path.write_text("SELECT 2;\n", encoding="utf-8")
    bad = verify_migrations(clean_migrate_db, migrations_tmpdir)
    assert bad.ok is False
    assert any("Checksum mismatch" in e for e in bad.errors)


def test_failed_migration_not_recorded(
    clean_migrate_db: str, migrations_tmpdir: Path
) -> None:
    _write_migration(migrations_tmpdir, "0001__good.sql", "SELECT 1;\n")
    _write_migration(
        migrations_tmpdir,
        "0002__bad.sql",
        "CREATE TABLE migrate_foundation_probe (id int);\n"
        "THIS IS NOT VALID SQL;\n",
    )

    with pytest.raises(MigrationError, match="not recorded as applied"):
        apply_migrations(clean_migrate_db, migrations_tmpdir)

    status = status_migrations(clean_migrate_db, migrations_tmpdir)
    assert [a.version for a in status.applied] == ["1"]
    assert [m.version_int for m in status.pending] == [2]

    with psycopg.connect(clean_migrate_db) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'migrate_foundation_probe'
                """
            )
            # Failed migration rolled back — probe table must not remain.
            assert cur.fetchone()[0] == 0


def test_advisory_lock_blocks_second_apply(
    clean_migrate_db: str, migrations_tmpdir: Path
) -> None:
    _write_migration(migrations_tmpdir, "0001__lock.sql", "SELECT 1;\n")

    holder = psycopg.connect(clean_migrate_db)
    holder.autocommit = True
    try:
        assert try_acquire_advisory_lock(holder) is True
        with pytest.raises(MigrationError, match="advisory lock"):
            apply_migrations(clean_migrate_db, migrations_tmpdir)
    finally:
        with holder.cursor() as cur:
            cur.execute(
                "SELECT pg_advisory_unlock(%s, %s)",
                (ADVISORY_LOCK_KEY1, ADVISORY_LOCK_KEY2),
            )
        holder.close()

    # After release, apply succeeds.
    report = apply_migrations(clean_migrate_db, migrations_tmpdir)
    assert len(report.applied_now) == 1


def test_verify_does_not_apply(
    clean_migrate_db: str, migrations_tmpdir: Path
) -> None:
    _write_migration(migrations_tmpdir, "0001__pending.sql", "SELECT 1;\n")
    report = verify_migrations(clean_migrate_db, migrations_tmpdir)
    assert report.ok is True
    assert len(report.pending) == 1
    assert report.applied == []

    status = status_migrations(clean_migrate_db, migrations_tmpdir)
    assert status.applied == []
    assert len(status.pending) == 1
