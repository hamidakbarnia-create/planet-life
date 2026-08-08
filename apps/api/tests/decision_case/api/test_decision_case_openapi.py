"""OpenAPI activation tests for Decision Case API (E5 + PR-2 intake/eval)."""

from __future__ import annotations

import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[3]
SRC = API_ROOT / "src"


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for candidate in (here, *here.parents):
        if (candidate / "packages" / "decision_engine").is_dir():
            return candidate
    raise RuntimeError("Could not locate monorepo root")


for path in (str(_repo_root()), str(SRC)):
    if path not in sys.path:
        sys.path.insert(0, path)

from main import app  # noqa: E402

ACTIVE_PATHS = {
    "/api/v1/decision-cases": {"post", "get"},
    "/api/v1/decision-cases/from-framing": {"post"},
    "/api/v1/decision-cases/{case_id}": {"get"},
    "/api/v1/decision-cases/{case_id}/framing": {"put"},
    "/api/v1/decision-cases/{case_id}/complete": {"post"},
    "/api/v1/decision-cases/{case_id}/archive": {"post"},
    "/api/v1/decision-cases/{case_id}/history": {"get"},
    "/api/v1/decision-cases/{case_id}/intake/answers": {"post"},
    "/api/v1/decision-cases/{case_id}/intake/complete": {"post"},
    "/api/v1/decision-cases/{case_id}/evaluations": {"get", "post"},
    "/api/v1/decision-cases/{case_id}/evaluations/{evaluation_id}": {"get"},
    "/api/v1/decision-cases/{case_id}/comparisons": {"get", "post"},
    "/api/v1/decision-cases/{case_id}/comparisons/{comparison_id}": {"get"},
    "/api/v1/decision-cases/{case_id}/findings": {"get", "post"},
    "/api/v1/decision-cases/{case_id}/findings/{finding_id}": {"get"},
}

RESERVED_PATHS: set[str] = set()


def test_openapi_contains_all_and_only_active_e5_routes() -> None:
    schema = app.openapi()
    paths = schema["paths"]
    case_paths = {
        path: set(methods)
        for path, methods in paths.items()
        if path.startswith("/api/v1/decision-cases")
    }
    expected = {path: set(methods) for path, methods in ACTIVE_PATHS.items()}
    normalized = {
        path: {m for m in methods if m in {"get", "post", "put", "patch", "delete"}}
        for path, methods in case_paths.items()
    }
    assert normalized == expected


def test_reserved_routes_absent_from_openapi() -> None:
    schema = app.openapi()
    paths = schema["paths"]
    for reserved in RESERVED_PATHS:
        assert reserved not in paths


def test_openapi_documents_case_error_contracts_without_reserved_403() -> None:
    schema = app.openapi()
    post = schema["paths"]["/api/v1/decision-cases"]["post"]
    responses = post["responses"]
    assert "201" in responses
    assert "400" in responses
    assert "409" in responses
    assert "500" in responses
    assert "403" not in responses
    assert "422" not in responses
