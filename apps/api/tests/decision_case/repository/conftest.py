"""PostgreSQL fixtures for Decision Case repository tests."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterator

import pytest

REPO_ROOT = Path(__file__).resolve().parents[4]
API_ROOT = Path(__file__).resolve().parents[3]
SRC = API_ROOT / "src"
TESTS = API_ROOT / "tests"
# SRC must precede TESTS so `decision_case` resolves to src package, not tests/.
for path in (str(TESTS), str(REPO_ROOT), str(SRC)):
    if path not in sys.path:
        sys.path.insert(0, path)

from identity_domain.harness import (  # noqa: E402
    IdentityHarnessSession,
    assert_isolated_database_name,
    connect_identity_database,
    drop_identity_schema_objects,
    get_identity_test_database_url,
    parse_database_name,
)
from identity_domain.conftest import _start_embedded_identity_database  # noqa: E402
from db_migrate.discovery import default_migrations_dir  # noqa: E402
from db_migrate.runner import apply_migrations  # noqa: E402
from decision_case.repository.postgres import DecisionCaseRepository  # noqa: E402

pytestmark = pytest.mark.identity_db


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
def decision_db(identity_database_url: str) -> Iterator[IdentityHarnessSession]:
    conn = connect_identity_database(identity_database_url)
    try:
        drop_identity_schema_objects(conn)
    finally:
        conn.close()
    apply_migrations(identity_database_url, default_migrations_dir())
    conn = connect_identity_database(identity_database_url)
    db_name = parse_database_name(identity_database_url)
    try:
        yield IdentityHarnessSession(
            conn=conn,
            database_url=identity_database_url,
            database_name=db_name,
        )
    finally:
        conn.rollback()
        conn.close()


@pytest.fixture()
def repo(decision_db: IdentityHarnessSession) -> DecisionCaseRepository:
    return DecisionCaseRepository(decision_db.conn)
