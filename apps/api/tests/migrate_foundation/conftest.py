"""Fixtures for DB-003 migration foundation tests."""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path
from typing import Iterator
from urllib.parse import urlparse

import pytest

SRC = Path(__file__).resolve().parents[2] / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

MIGRATE_TEST_DATABASE_URL_ENV = "METIORO_MIGRATE_TEST_DATABASE_URL"
IDENTITY_TEST_DATABASE_URL_ENV = "METIORO_IDENTITY_TEST_DATABASE_URL"
REQUIRED_DB_SUBSTRING = "test"


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "migrate_db: requires PostgreSQL URL for migration foundation tests",
    )


def _env_database_url() -> str | None:
    for key in (MIGRATE_TEST_DATABASE_URL_ENV, IDENTITY_TEST_DATABASE_URL_ENV):
        raw = os.environ.get(key, "").strip()
        if raw:
            return raw
    return None


def _assert_isolated_db_name(url: str) -> None:
    name = (urlparse(url).path or "").lstrip("/")
    if REQUIRED_DB_SUBSTRING not in name:
        pytest.fail(
            "Migrate test database name must contain "
            f"{REQUIRED_DB_SUBSTRING!r} for isolation; got {name!r}"
        )


def _start_embedded_database() -> tuple[str, object]:
    """Start pgserver when installed (dev convenience; not a production dependency)."""
    pgserver = pytest.importorskip("pgserver")
    pgdata = Path(tempfile.mkdtemp(prefix="metioro-migrate-foundation-"))
    server = pgserver.get_server(pgdata, cleanup_mode="delete")
    admin_uri = server.get_uri(database="postgres")
    import psycopg

    with psycopg.connect(admin_uri, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("DROP DATABASE IF EXISTS metioro_migration_test")
            cur.execute("CREATE DATABASE metioro_migration_test")
    return server.get_uri(database="metioro_migration_test"), server


@pytest.fixture(scope="session")
def migrate_database_url() -> Iterator[str]:
    url = _env_database_url()
    server = None
    if url:
        _assert_isolated_db_name(url)
    else:
        url, server = _start_embedded_database()
        _assert_isolated_db_name(url)
    yield url
    # server cleaned via cleanup_mode=delete / process exit
    _ = server


@pytest.fixture()
def migrations_tmpdir(tmp_path: Path) -> Path:
    return tmp_path


@pytest.fixture()
def clean_migrate_db(migrate_database_url: str) -> Iterator[str]:
    """Provide a database URL and drop foundation tracking objects after each test."""
    import psycopg

    with psycopg.connect(migrate_database_url) as conn:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS schema_migrations")
            cur.execute("DROP TABLE IF EXISTS migrate_foundation_probe")
    yield migrate_database_url
    with psycopg.connect(migrate_database_url) as conn:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS schema_migrations")
            cur.execute("DROP TABLE IF EXISTS migrate_foundation_probe")
