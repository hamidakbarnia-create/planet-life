"""Isolated PostgreSQL harness for EPIC-01 identity-domain tests.

Connects to a dedicated test database, verifies the empty identity baseline,
and supports setup/teardown. Does not create identity tables, run migrations,
or implement production identity behavior.

Requires:
  METIORO_IDENTITY_TEST_DATABASE_URL — PostgreSQL URL whose database name
  contains ``identity_test`` (isolation guard).
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Iterator
from urllib.parse import urlparse

import psycopg
from psycopg import Connection

from .invariants import IDENTITY_TABLE_NAMES

IDENTITY_TEST_DATABASE_URL_ENV = "METIORO_IDENTITY_TEST_DATABASE_URL"
REQUIRED_DATABASE_NAME_SUBSTRING = "identity_test"


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


def assert_identity_baseline_empty(conn: Connection) -> None:
    """Current baseline: no ratified identity tables exist yet."""
    present = list_public_tables(conn).intersection(IDENTITY_TABLE_NAMES)
    if present:
        raise IdentityHarnessError(
            "Identity baseline must be empty (no identity tables); "
            f"found {sorted(present)}"
        )


def setup_identity_harness(conn: Connection) -> None:
    """Prepare a clean session on the empty/baseline identity schema."""
    conn.rollback()
    assert_identity_baseline_empty(conn)


def teardown_identity_harness(conn: Connection) -> None:
    """Roll back any open work and re-assert empty identity baseline."""
    conn.rollback()
    assert_identity_baseline_empty(conn)


@contextmanager
def identity_harness_session(
    database_url: str | None = None,
) -> Iterator[IdentityHarnessSession]:
    """Connect → setup → yield → teardown → close."""
    url = database_url or get_identity_test_database_url()
    if not url:
        raise IdentityHarnessError(
            f"{IDENTITY_TEST_DATABASE_URL_ENV} is not set"
        )
    database_name = parse_database_name(url)
    assert_isolated_database_name(database_name)
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
