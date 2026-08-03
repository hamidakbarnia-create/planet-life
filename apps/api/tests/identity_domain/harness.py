"""Isolated PostgreSQL harness for EPIC-01 identity-domain tests.

Connects to a dedicated test database, applies ratified Identity migrations
for the current epic slice, and supports setup/teardown. Does not implement
production identity runtime behavior.

Requires:
  METIORO_IDENTITY_TEST_DATABASE_URL — PostgreSQL URL whose database name
  contains ``identity_test`` (isolation guard), unless an embedded test
  database is provisioned by the pytest fixtures.
"""

from __future__ import annotations

import os
import sys
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator
from urllib.parse import urlparse

import psycopg
from psycopg import Connection

from .invariants import (
    AUTHENTICATED_IDENTITY_TABLES,
    DEFERRED_GUEST_IDENTITY_TABLES,
    GUEST_CORE_IDENTITY_TABLES,
)

IDENTITY_TEST_DATABASE_URL_ENV = "METIORO_IDENTITY_TEST_DATABASE_URL"
REQUIRED_DATABASE_NAME_SUBSTRING = "identity_test"

_SRC = Path(__file__).resolve().parents[2] / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))


class IdentityHarnessError(RuntimeError):
    """Raised when the identity test harness cannot run safely."""


@dataclass(frozen=True)
class IdentityHarnessSession:
    """Active harness session bound to one connection."""

    conn: Connection
    database_url: str
    database_name: str


def get_identity_test_database_url() -> str | None:
    raw = os.environ.get(IDENTITY_TEST_DATABASE_URL_ENV, "").strip()
    return raw or None


def parse_database_name(database_url: str) -> str:
    parsed = urlparse(database_url)
    name = (parsed.path or "").lstrip("/")
    if not name:
        raise IdentityHarnessError(
            f"{IDENTITY_TEST_DATABASE_URL_ENV} must include a database name"
        )
    return name


def assert_isolated_database_name(database_name: str) -> None:
    if REQUIRED_DATABASE_NAME_SUBSTRING not in database_name:
        raise IdentityHarnessError(
            "Identity test database name must contain "
            f"{REQUIRED_DATABASE_NAME_SUBSTRING!r} for isolation; got {database_name!r}"
        )


def connect_identity_database(database_url: str | None = None) -> Connection:
    url = database_url or get_identity_test_database_url()
    if not url:
        raise IdentityHarnessError(
            f"{IDENTITY_TEST_DATABASE_URL_ENV} is not set"
        )
    database_name = parse_database_name(url)
    assert_isolated_database_name(database_name)
    conn = psycopg.connect(url)
    conn.autocommit = False
    return conn


def list_public_tables(conn: Connection) -> set[str]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT tablename
            FROM pg_catalog.pg_tables
            WHERE schemaname = 'public'
            """
        )
        return {row[0] for row in cur.fetchall()}


def list_table_columns(conn: Connection, table_name: str) -> set[str]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            """,
            (table_name,),
        )
        return {row[0] for row in cur.fetchall()}


def assert_deferred_guest_tables_absent(conn: Connection) -> None:
    present = list_public_tables(conn).intersection(DEFERRED_GUEST_IDENTITY_TABLES)
    if present:
        raise IdentityHarnessError(
            "Deferred guest identity tables must remain absent; "
            f"found {sorted(present)}"
        )


# Backward-compatible name for PR-02-era callers.
assert_guest_identity_tables_absent = assert_deferred_guest_tables_absent


def assert_authenticated_identity_tables_present(conn: Connection) -> None:
    present = list_public_tables(conn)
    missing = AUTHENTICATED_IDENTITY_TABLES - present
    if missing:
        raise IdentityHarnessError(
            "Authenticated identity tables missing after migrate; "
            f"missing {sorted(missing)}"
        )


def assert_guest_core_identity_tables_present(conn: Connection) -> None:
    present = list_public_tables(conn)
    missing = GUEST_CORE_IDENTITY_TABLES - present
    if missing:
        raise IdentityHarnessError(
            "Guest core identity tables missing after migrate; "
            f"missing {sorted(missing)}"
        )


def drop_identity_schema_objects(conn: Connection) -> None:
    """Reset identity objects and migration tracking (test isolation)."""
    conn.rollback()
    previous = conn.autocommit
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS guest_claim_token_nonces CASCADE")
            cur.execute("DROP TABLE IF EXISTS guest_installations CASCADE")
            cur.execute(
                "DROP FUNCTION IF EXISTS guest_installations_claimed_immutable_fn() CASCADE"
            )
            cur.execute("DROP TABLE IF EXISTS auth_identities CASCADE")
            cur.execute("DROP TABLE IF EXISTS users CASCADE")
            cur.execute("DROP FUNCTION IF EXISTS users_merge_acyclic_fn() CASCADE")
            cur.execute("DROP TABLE IF EXISTS schema_migrations CASCADE")
    finally:
        conn.autocommit = previous


def apply_identity_migrations(database_url: str) -> None:
    from db_migrate.discovery import default_migrations_dir
    from db_migrate.runner import apply_migrations

    apply_migrations(database_url, default_migrations_dir())


def reset_identity_schema(database_url: str) -> None:
    """Drop identity objects and re-apply canonical migrations from empty state."""
    conn = connect_identity_database(database_url)
    try:
        drop_identity_schema_objects(conn)
    finally:
        conn.close()
    apply_identity_migrations(database_url)


def truncate_identity_data(conn: Connection) -> None:
    conn.rollback()
    with conn.cursor() as cur:
        cur.execute(
            """
            TRUNCATE guest_claim_token_nonces, guest_installations,
                     auth_identities, users
            RESTART IDENTITY CASCADE
            """
        )
    conn.commit()


def setup_identity_harness(conn: Connection) -> None:
    """Prepare a clean session on the migrated identity schema for this slice."""
    conn.rollback()
    assert_authenticated_identity_tables_present(conn)
    assert_guest_core_identity_tables_present(conn)
    assert_deferred_guest_tables_absent(conn)
    truncate_identity_data(conn)


def teardown_identity_harness(conn: Connection) -> None:
    """Roll back open work and re-assert current-slice table presence."""
    conn.rollback()
    assert_authenticated_identity_tables_present(conn)
    assert_guest_core_identity_tables_present(conn)
    assert_deferred_guest_tables_absent(conn)


@contextmanager
def identity_harness_session(
    database_url: str | None = None,
) -> Iterator[IdentityHarnessSession]:
    """Reset schema → connect → setup → yield → teardown → close."""
    url = database_url or get_identity_test_database_url()
    if not url:
        raise IdentityHarnessError(
            f"{IDENTITY_TEST_DATABASE_URL_ENV} is not set"
        )
    database_name = parse_database_name(url)
    assert_isolated_database_name(database_name)
    reset_identity_schema(url)
    conn = connect_identity_database(url)
    try:
        setup_identity_harness(conn)
        yield IdentityHarnessSession(
            conn=conn,
            database_url=url,
            database_name=database_name,
        )
        teardown_identity_harness(conn)
    finally:
        conn.close()
