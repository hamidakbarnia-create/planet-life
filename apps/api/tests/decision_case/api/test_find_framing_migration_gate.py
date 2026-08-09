"""HTTP regression for production FIND framing 500 (missing migration 0010).

Exact production shape:
  POST /api/v1/decision-cases/from-framing
  PUT  /api/v1/decision-cases/{id}/framing
  bus-product-launch + operation=find + time_scope=date_range
"""

from __future__ import annotations

import shutil
import sys
from collections.abc import Iterator
from contextlib import contextmanager
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

from db_migrate.discovery import default_migrations_dir, discover_migrations  # noqa: E402
from db_migrate.runner import apply_migrations  # noqa: E402
from decision_case.deps import (  # noqa: E402
    get_decision_case_repository,
    get_e5_owner_subject_id,
)
from decision_case.repository.postgres import DecisionCaseRepository  # noqa: E402
from identity_domain.conftest import _start_embedded_identity_database  # noqa: E402
from identity_domain.harness import (  # noqa: E402
    assert_isolated_database_name,
    connect_identity_database,
    drop_identity_schema_objects,
    get_identity_test_database_url,
    parse_database_name,
)
from main import app  # noqa: E402

pytestmark = pytest.mark.identity_db

BASE = "/api/v1/decision-cases"
E5_OWNER = "e5-test-owner"
FIND_FRAMING = {
    "operation": "find",
    "time_scope": "date_range",
    "options": [],
    "raw_intent": "best time to launch a product",
    "start": "2026-09-01",
    "end": "2026-10-15",
}


def _copy_migrations_through(src: Path, dest: Path, *, max_version: int) -> Path:
    dest.mkdir(parents=True, exist_ok=True)
    for migration in discover_migrations(src):
        if migration.version_int <= max_version:
            shutil.copy2(migration.path, dest / migration.filename)
    readme = src / "README.md"
    if readme.exists():
        shutil.copy2(readme, dest / "README.md")
    return dest


@pytest.fixture(scope="module")
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


@contextmanager
def _client_for_url(database_url: str) -> Iterator[TestClient]:
    conn = connect_identity_database(database_url)
    repo = DecisionCaseRepository(conn)

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
        conn.rollback()
        conn.close()


def test_find_framing_500_without_0010_then_201_after_apply(
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

    # Reproduce production failure shape on schema without FIND constraints.
    with _client_for_url(identity_database_url) as client:
        created = client.post(
            BASE,
            json={
                "decision_type_id": "bus-product-launch",
                "title": "Launch a project or product",
                "entry_mode": "structured",
            },
        )
        assert created.status_code == 201, created.text
        case_id = created.json()["case_id"]

        put = client.put(
            f"{BASE}/{case_id}/framing",
            json={"expected_case_version": 1, "framing": FIND_FRAMING},
        )
        assert put.status_code == 500, put.text
        assert put.json()["error"]["code"] == "INTERNAL_ERROR"

        from_framing = client.post(
            f"{BASE}/from-framing",
            json={
                "decision_type_id": "bus-product-launch",
                "title": "Launch a project or product",
                "framing": FIND_FRAMING,
            },
        )
        assert from_framing.status_code == 500, from_framing.text
        assert from_framing.json()["error"]["code"] == "INTERNAL_ERROR"

    # Apply 0010 (and any later) — FIND framing must succeed.
    apply_migrations(identity_database_url, src)

    with _client_for_url(identity_database_url) as client:
        from_framing = client.post(
            f"{BASE}/from-framing",
            json={
                "decision_type_id": "bus-product-launch",
                "title": "Launch a project or product",
                "framing": FIND_FRAMING,
            },
        )
        assert from_framing.status_code == 201, from_framing.text
        body = from_framing.json()
        assert body["case"]["mode"] == "find_dates"
        assert body["case"]["state"] == "intake"
        assert body["framing"]["operation"] == "find"
        assert body["framing"]["time_scope"] == "date_range"
        assert body["framing"]["start"] == "2026-09-01"
        assert body["framing"]["end"] == "2026-10-15"

        created = client.post(
            BASE,
            json={
                "decision_type_id": "bus-product-launch",
                "title": "Launch PUT framing",
                "entry_mode": "structured",
            },
        )
        assert created.status_code == 201, created.text
        case_id = created.json()["case_id"]
        put = client.put(
            f"{BASE}/{case_id}/framing",
            json={"expected_case_version": 1, "framing": FIND_FRAMING},
        )
        assert put.status_code == 200, put.text
        assert put.json()["case"]["mode"] == "find_dates"
        assert put.json()["case"]["state"] == "intake"
