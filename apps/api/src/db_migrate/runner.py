"""Apply / status / verify for versioned SQL migrations (DB-003)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import psycopg
from psycopg import Connection

from .discovery import MigrationFile, default_migrations_dir, discover_migrations
from .errors import MigrationError
from .tracking import (
    AppliedMigration,
    ensure_tracking_table,
    list_applied,
    record_applied,
    release_advisory_lock,
    try_acquire_advisory_lock,
)


@dataclass(frozen=True)
class StatusReport:
    applied: list[AppliedMigration]
    pending: list[MigrationFile]
    migrations_dir: Path


@dataclass(frozen=True)
class ApplyReport:
    applied_now: list[MigrationFile]
    already_applied: list[AppliedMigration]
    migrations_dir: Path


@dataclass(frozen=True)
class VerifyReport:
    ok: bool
    applied: list[AppliedMigration]
    pending: list[MigrationFile]
    errors: list[str]
    migrations_dir: Path


def connect(database_url: str) -> Connection:
    try:
        conn = psycopg.connect(database_url)
    except Exception as exc:  # noqa: BLE001 — fail-closed surface
        raise MigrationError(f"Failed to connect to database: {exc}") from exc
    conn.autocommit = False
    return conn


def _pending(
    discovered: list[MigrationFile], applied: list[AppliedMigration]
) -> list[MigrationFile]:
    applied_versions = {a.version for a in applied}
    return [m for m in discovered if m.version not in applied_versions]


def status_migrations(
    database_url: str,
    migrations_dir: Path | None = None,
) -> StatusReport:
    directory = migrations_dir or default_migrations_dir()
    discovered = discover_migrations(directory)
    conn = connect(database_url)
    try:
        ensure_tracking_table(conn)
        applied = list_applied(conn)
        return StatusReport(
            applied=applied,
            pending=_pending(discovered, applied),
            migrations_dir=directory,
        )
    finally:
        conn.close()


def verify_migrations(
    database_url: str,
    migrations_dir: Path | None = None,
) -> VerifyReport:
    directory = migrations_dir or default_migrations_dir()
    # Discovery fail-closed (duplicate versions, bad names) before DB work.
    discovered = discover_migrations(directory)
    by_version = {m.version: m for m in discovered}

    conn = connect(database_url)
    try:
        ensure_tracking_table(conn)
        applied = list_applied(conn)
    finally:
        conn.close()

    errors: list[str] = []
    for row in applied:
        file = by_version.get(row.version)
        if file is None:
            errors.append(
                f"Applied version {row.version} has no migration file "
                f"(recorded filename {row.filename!r})"
            )
            continue
        if file.filename != row.filename:
            errors.append(
                f"Version {row.version}: recorded filename {row.filename!r} "
                f"!= disk filename {file.filename!r}"
            )
        if file.checksum != row.checksum:
            errors.append(
                f"Checksum mismatch for version {row.version} "
                f"({file.filename}): applied={row.checksum} disk={file.checksum}"
            )

    pending = _pending(discovered, applied)
    return VerifyReport(
        ok=not errors,
        applied=applied,
        pending=pending,
        errors=errors,
        migrations_dir=directory,
    )


def apply_migrations(
    database_url: str,
    migrations_dir: Path | None = None,
) -> ApplyReport:
    directory = migrations_dir or default_migrations_dir()
    discovered = discover_migrations(directory)

    conn = connect(database_url)
    lock_held = False
    try:
        if not try_acquire_advisory_lock(conn):
            raise MigrationError(
                "Could not acquire PostgreSQL advisory lock; "
                "another migrate apply may be in progress"
            )
        lock_held = True
        # Commit any implicit transaction state from lock acquisition.
        conn.commit()

        ensure_tracking_table(conn)
        applied = list_applied(conn)
        pending = _pending(discovered, applied)
        applied_now: list[MigrationFile] = []

        for migration in pending:
            sql = migration.path.read_text(encoding="utf-8")
            try:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    record_applied(
                        conn,
                        version=migration.version,
                        filename=migration.filename,
                        checksum=migration.checksum,
                    )
                conn.commit()
            except Exception as exc:  # noqa: BLE001 — fail-closed
                conn.rollback()
                raise MigrationError(
                    f"Migration {migration.filename} failed; "
                    "transaction rolled back; not recorded as applied: "
                    f"{exc}"
                ) from exc
            applied_now.append(migration)

        return ApplyReport(
            applied_now=applied_now,
            already_applied=applied,
            migrations_dir=directory,
        )
    finally:
        if lock_held:
            try:
                release_advisory_lock(conn)
                conn.commit()
            except Exception:  # noqa: BLE001
                pass
        conn.close()
