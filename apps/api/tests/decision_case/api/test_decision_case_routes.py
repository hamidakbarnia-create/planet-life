"""HTTP contract tests for Decision Case API (E5 / ADR-0015-WS-01)."""

from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from decision_case.repository.postgres import DecisionCaseRepository

pytestmark = pytest.mark.identity_db

BASE = "/api/v1/decision-cases"
E5_OWNER = "e5-test-owner"


def _assert_error_envelope(
    payload: dict,
    *,
    code: str | None = None,
    must_have_details: bool = True,
) -> dict:
    assert "error" in payload
    error = payload["error"]
    assert set(error.keys()) >= {"code", "message", "requestId", "details"}
    assert isinstance(error["code"], str) and error["code"]
    assert isinstance(error["message"], str) and error["message"]
    assert isinstance(error["requestId"], str) and error["requestId"]
    assert isinstance(error["details"], dict)
    if code is not None:
        assert error["code"] == code
    if must_have_details:
        assert "details" in error
    return error


def _create_body(**overrides):
    body = {
        "decision_type_id": "tim-compare-three",
        "title": "Compare three dates",
        "entry_mode": "structured",
    }
    body.update(overrides)
    return body


def _seed_evaluated(repo: DecisionCaseRepository):
    created = repo.create_case(
        owner_subject_id=E5_OWNER,
        decision_type_id="tim-compare-three",
        family_id="timing_opt",
        title="Seeded",
    )
    c = repo.advance_state(
        created.case_id,
        E5_OWNER,
        to_state="intake",
        trigger="start_intake",
        expected_case_version=1,
        has_decision_type_or_classification_pending=True,
    )
    c = repo.advance_state(
        created.case_id,
        E5_OWNER,
        to_state="evidence_ready",
        trigger="complete_intake",
        expected_case_version=c.current_case_version,
        intake_complete_or_soft_gaps_accepted=True,
    )
    ev = repo.append_evaluation(
        created.case_id,
        E5_OWNER,
        expected_case_version=c.current_case_version,
        package={"recommendation": {"stance": "proceed"}, "modules": {}},
        package_contract_version="1.0.0",
        engine_id="die-v1",
        dq_status="pass",
    )
    case = repo.get_case(created.case_id, E5_OWNER)
    return case, ev


def test_create_case(client: TestClient) -> None:
    response = client.post(BASE, json=_create_body())
    assert response.status_code == 201
    payload = response.json()
    assert payload["state"] == "draft"
    assert payload["activation_phase"] == "draft"
    assert payload["decision_type_id"] == "tim-compare-three"
    assert payload["family_id"] == "timing_opt"
    assert payload["mode"] == "none"
    assert payload["case_version"] == 1
    assert payload["owner_subject_id"] == E5_OWNER
    assert payload["created_at"].endswith("Z")
    assert response.headers.get("Location", "").endswith(
        f"/api/v1/decision-cases/{payload['case_id']}"
    )


def test_list_cases(client: TestClient) -> None:
    first = client.post(BASE, json=_create_body(title="A")).json()
    second = client.post(BASE, json=_create_body(title="B")).json()
    response = client.get(BASE)
    assert response.status_code == 200
    cases = response.json()["cases"]
    assert len(cases) >= 2
    ids = {c["case_id"] for c in cases}
    assert first["case_id"] in ids
    assert second["case_id"] in ids


def test_get_case(client: TestClient) -> None:
    created = client.post(BASE, json=_create_body()).json()
    response = client.get(f"{BASE}/{created['case_id']}")
    assert response.status_code == 200
    assert response.json()["case_id"] == created["case_id"]
    assert response.json()["title"] == created["title"]


def test_complete_and_archive_case(
    client: TestClient, repo: DecisionCaseRepository
) -> None:
    case, _ = _seed_evaluated(repo)
    complete = client.post(
        f"{BASE}/{case.case_id}/complete",
        json={"expected_case_version": case.current_case_version},
    )
    assert complete.status_code == 200
    completed = complete.json()
    assert completed["state"] == "completed"
    assert completed["activation_phase"] == "completed"

    archive = client.post(
        f"{BASE}/{case.case_id}/archive",
        json={"expected_case_version": completed["case_version"]},
    )
    assert archive.status_code == 200
    archived = archive.json()
    assert archived["state"] == "archived"
    assert archived["activation_phase"] == "archived"


def test_history_retrieval(
    client: TestClient, repo: DecisionCaseRepository
) -> None:
    case, _ = _seed_evaluated(repo)
    completed = client.post(
        f"{BASE}/{case.case_id}/complete",
        json={"expected_case_version": case.current_case_version},
    ).json()
    response = client.get(f"{BASE}/{case.case_id}/history")
    assert response.status_code == 200
    events = response.json()["events"]
    assert events
    assert events[0]["event"] == "case_created"
    assert any(e["event"] == "case_completed" for e in events)
    assert any(e.get("to_state") == "completed" for e in events)
    assert completed["state"] == "completed"
    # Ordering: at ascending
    ats = [e["at"] for e in events]
    assert ats == sorted(ats)


def test_evaluations_list_and_detail(
    client: TestClient, repo: DecisionCaseRepository
) -> None:
    case, ev = _seed_evaluated(repo)
    listed = client.get(f"{BASE}/{case.case_id}/evaluations")
    assert listed.status_code == 200
    items = listed.json()["evaluations"]
    assert len(items) == 1
    assert items[0]["evaluation_id"] == str(ev.evaluation_id)
    assert "package" not in items[0]

    detail = client.get(
        f"{BASE}/{case.case_id}/evaluations/{ev.evaluation_id}"
    )
    assert detail.status_code == 200
    body = detail.json()
    assert body["evaluation_id"] == str(ev.evaluation_id)
    assert body["package"]["recommendation"]["stance"] == "proceed"


def test_missing_case(client: TestClient) -> None:
    response = client.get(f"{BASE}/{uuid4()}")
    assert response.status_code == 404
    error = _assert_error_envelope(response.json(), code="CASE_NOT_FOUND")
    assert "psycopg" not in response.text.lower()
    assert "traceback" not in response.text.lower()
    assert error["details"] == {}


def test_missing_evaluation(
    client: TestClient, repo: DecisionCaseRepository
) -> None:
    case, _ = _seed_evaluated(repo)
    response = client.get(f"{BASE}/{case.case_id}/evaluations/{uuid4()}")
    assert response.status_code == 404
    _assert_error_envelope(response.json(), code="EVALUATION_NOT_FOUND")


def test_invalid_payload(client: TestClient) -> None:
    response = client.post(
        BASE,
        json={
            "decision_type_id": "tim-compare-three",
            "title": "x",
            "entry_mode": "structured",
            "state": "draft",
        },
    )
    assert response.status_code == 400
    error = _assert_error_envelope(response.json(), code="VALIDATION_ERROR")
    assert "fields" in error["details"]
    assert error["requestId"]
    # Case envelope (with details), not ADR-0006 Decision execute shape.
    assert "details" in error
    assert error["requestId"] != ""


def test_unknown_decision_type(client: TestClient) -> None:
    response = client.post(
        BASE,
        json=_create_body(decision_type_id="not-a-real-type"),
    )
    assert response.status_code == 400
    _assert_error_envelope(response.json(), code="UNKNOWN_DECISION_TYPE")


def test_unavailable_entry_mode(client: TestClient) -> None:
    response = client.post(
        BASE,
        json=_create_body(entry_mode="natural_language"),
    )
    assert response.status_code == 400
    _assert_error_envelope(response.json(), code="ENTRY_MODE_UNAVAILABLE")


def test_version_conflict(
    client: TestClient, repo: DecisionCaseRepository
) -> None:
    case, _ = _seed_evaluated(repo)
    response = client.post(
        f"{BASE}/{case.case_id}/complete",
        json={"expected_case_version": 1},
    )
    assert response.status_code == 409
    error = _assert_error_envelope(response.json(), code="VERSION_CONFLICT")
    assert error["details"]["expected_case_version"] == 1
    assert error["details"]["current_case_version"] == case.current_case_version


def test_illegal_transition(client: TestClient) -> None:
    created = client.post(BASE, json=_create_body()).json()
    response = client.post(
        f"{BASE}/{created['case_id']}/complete",
        json={"expected_case_version": created["case_version"]},
    )
    assert response.status_code == 409
    error = _assert_error_envelope(response.json(), code="ILLEGAL_TRANSITION")
    assert error["details"]["state"] == "draft"


def test_duplicate_case_if_supported(
    client: TestClient, repo: DecisionCaseRepository
) -> None:
    # E5 server-generates IDs; exercise repository duplicate contract via repo,
    # then ensure API maps DuplicateCaseError if create were to collide.
    from decision_case.repository.errors import DuplicateCaseError
    from decision_case.routes.cases import _map_repository_error

    mapped = _map_repository_error(
        DuplicateCaseError("x"),
        request_id="req-dup",
    )
    assert mapped.status_code == 409
    assert mapped.body
    # Integration: second create with same client-supplied id via repository
    first = repo.create_case(
        owner_subject_id=E5_OWNER,
        decision_type_id="car-interview",
        family_id="visibility",
        title="One",
        case_id=uuid4(),
    )
    with pytest.raises(DuplicateCaseError):
        repo.create_case(
            owner_subject_id=E5_OWNER,
            decision_type_id="car-interview",
            family_id="visibility",
            title="Two",
            case_id=first.case_id,
        )
    # HTTP create still succeeds with server-generated ids
    response = client.post(BASE, json=_create_body(decision_type_id="car-interview"))
    assert response.status_code == 201


def test_request_id_present_in_errors(client: TestClient) -> None:
    response = client.get(f"{BASE}/{uuid4()}")
    error = _assert_error_envelope(response.json(), code="CASE_NOT_FOUND")
    assert len(error["requestId"]) >= 8


def test_no_internal_exception_leakage(
    client: TestClient, repo: DecisionCaseRepository, monkeypatch: pytest.MonkeyPatch
) -> None:
    secret = "sensitive-sql-detail-9f2a"

    def _boom(*_a, **_k):
        raise RuntimeError(secret)

    monkeypatch.setattr(repo, "get_case", _boom)
    response = client.get(f"{BASE}/{uuid4()}")
    assert response.status_code == 500
    error = _assert_error_envelope(response.json(), code="INTERNAL_ERROR")
    assert secret not in response.text
    assert "RuntimeError" not in response.text
    assert error["message"] == "Internal server error"


def test_no_403_emitted(client: TestClient) -> None:
    response = client.get(f"{BASE}/{uuid4()}")
    assert response.status_code != 403


def test_create_request_schema_has_no_owner_field() -> None:
    from decision_case.schemas.cases import CreateDecisionCaseRequest

    assert "owner_subject_id" not in CreateDecisionCaseRequest.model_fields
    assert "owner" not in CreateDecisionCaseRequest.model_fields


def test_router_has_no_allowlist_or_type_derivation() -> None:
    from pathlib import Path

    route_file = (
        Path(__file__).resolve().parents[3]
        / "src"
        / "decision_case"
        / "routes"
        / "cases.py"
    )
    text = route_file.read_text(encoding="utf-8")
    assert "_DECISION_TYPE_ALLOWLIST" not in text
    assert "timing_opt" not in text
    assert "visibility" not in text
    assert 'entry_mode == "natural_language"' not in text
    assert "resolve_decision_type" in text


def test_create_uses_registry_resolution(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from packages.decision_engine.registry.loader import DecisionTypeResolution
    import decision_case.routes.cases as cases_mod

    calls: list[tuple[str, str]] = []

    def _fake_resolve(decision_type_id: str, entry_mode: str) -> DecisionTypeResolution:
        calls.append((decision_type_id, entry_mode))
        return DecisionTypeResolution(
            decision_type_id="car-interview",
            family_id="visibility",
            mode="none",
        )

    monkeypatch.setattr(cases_mod, "resolve_decision_type", _fake_resolve)
    response = client.post(
        BASE,
        json=_create_body(decision_type_id="car-interview", title="Via registry"),
    )
    assert response.status_code == 201
    assert calls == [("car-interview", "structured")]
    assert response.json()["decision_type_id"] == "car-interview"
    assert response.json()["family_id"] == "visibility"
    assert response.json()["mode"] == "none"


def test_default_owner_constant_not_in_openapi_schema() -> None:
    from main import app
    from decision_case.deps import DEFAULT_OWNER_SUBJECT_ID

    schema_text = str(app.openapi())
    assert DEFAULT_OWNER_SUBJECT_ID not in schema_text


def test_concurrent_stale_expected_case_version(
    client: TestClient,
    repo: DecisionCaseRepository,
) -> None:
    case, _ = _seed_evaluated(repo)
    version = case.current_case_version
    ok = client.post(
        f"{BASE}/{case.case_id}/complete",
        json={"expected_case_version": version},
    )
    assert ok.status_code == 200
    stale = client.post(
        f"{BASE}/{case.case_id}/archive",
        json={"expected_case_version": version},
    )
    assert stale.status_code == 409
    _assert_error_envelope(stale.json(), code="VERSION_CONFLICT")


def test_lifecycle_history_correctness(
    client: TestClient, repo: DecisionCaseRepository
) -> None:
    case, _ = _seed_evaluated(repo)
    completed = client.post(
        f"{BASE}/{case.case_id}/complete",
        json={"expected_case_version": case.current_case_version},
    ).json()
    archived = client.post(
        f"{BASE}/{case.case_id}/archive",
        json={"expected_case_version": completed["case_version"]},
    ).json()
    events = client.get(f"{BASE}/{case.case_id}/history").json()["events"]
    to_states = [e["to_state"] for e in events if e["event"] == "state_transition"]
    assert "planned" in to_states
    assert "executing" in to_states
    assert "completed" in to_states
    assert "reflected" in to_states
    assert "archived" in to_states
    assert "scheduled" not in to_states
    assert any(e["event"] == "case_archived" for e in events)
    assert archived["state"] == "archived"


def test_empty_evaluations_list(client: TestClient) -> None:
    created = client.post(BASE, json=_create_body()).json()
    response = client.get(f"{BASE}/{created['case_id']}/evaluations")
    assert response.status_code == 200
    assert response.json() == {"evaluations": []}
