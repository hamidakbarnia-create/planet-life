"""Pytest fixtures for the EPIC-01 identity-domain harness."""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Iterator

import pytest

from .harness import (
    IDENTITY_TEST_DATABASE_URL_ENV,
    IdentityHarnessSession,
    assert_isolated_database_name,
    get_identity_test_database_url,
    identity_harness_session,
    parse_database_name,
)


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "identity_db: requires PostgreSQL identity_test database",
    )


def _start_embedded_identity_database() -> tuple[str, object]:
    pgserver = pytest.importorskip("pgserver")
    pgdata = Path(tempfile.mkdtemp(prefix="metioro-identity-test-"))
    server = pgserver.get_server(pgdata, cleanup_mode="delete")
    admin_uri = server.get_uri(database="postgres")
    import psycopg

    with psycopg.connect(admin_uri, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("DROP DATABASE IF EXISTS metioro_identity_test")
            cur.execute("CREATE DATABASE metioro_identity_test")
    return server.get_uri(database="metioro_identity_test"), server


@pytest.fixture(scope="session")
def identity_database_url() -> Iterator[str]:
    url = get_identity_test_database_url()
    server = None
    if url:
        assert_isolated_database_name(parse_database_name(url))
    else:
        url, server = _start_embedded_identity_database()
        assert_isolated_database_name(parse_database_name(url))
    yield url
    _ = server


@pytest.fixture()
def identity_db(identity_database_url: str) -> Iterator[IdentityHarnessSession]:
    with identity_harness_session(identity_database_url) as session:
        yield session
