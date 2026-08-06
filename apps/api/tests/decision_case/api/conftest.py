"""Fixtures for Decision Case HTTP API tests (E5)."""

from __future__ import annotations

import sys
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[3]
SRC = API_ROOT / "src"
TESTS = API_ROOT / "tests"


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for candidate in (here, *here.parents):
        if (candidate / "packages" / "decision_engine").is_dir():
            return candidate
    raise RuntimeError("Could not locate monorepo root")


REPO_ROOT = _repo_root()
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
from decision_case.deps import (  # noqa: E402
    get_decision_case_repository,
    get_e5_owner_subject_id,
)
from decision_case.repository.postgres import DecisionCaseRepository  # noqa: E402
from main import app  # noqa: E402

pytestmark = pytest.mark.identity_db

# Test owner is overridden explicitly; must not rely on deps default string.
E5_OWNER = "e5-test-owner"


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


@pytest.fixture()
def client(repo: DecisionCaseRepository) -> Iterator[TestClient]:
    def _repo_override() -> DecisionCaseRepository:
        return repo

    def _owner_override() -> str:
        return E5_OWNER

    app.dependency_overrides[get_decision_case_repository] = _repo_override
    app.dependency_overrides[get_e5_owner_subject_id] = _owner_override
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_decision_case_repository, None)
        app.dependency_overrides.pop(get_e5_owner_subject_id, None)
