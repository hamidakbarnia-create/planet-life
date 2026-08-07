"""API: car-interview EVALUATE uses real runtime (not stub)."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.car_interview_evaluate import REAL_ENGINE_ID
from packages.decision_engine.evaluate.stub_package import STUB_ENGINE_ID
from packages.decision_engine.models import (
    Confidence,
    DecisionMetadata,
    DecisionOutcome,
    EvidenceReference,
    Explanation,
    Recommendation,
)

pytestmark = pytest.mark.identity_db

BASE = "/api/v1/decision-cases"
TARGET = "2026-08-18"
NATAL = {
    "birth_date": "1982-02-25",
    "birth_time": "05:47",
    "location": "Tehran",
    "latitude": 35.6892,
    "longitude": 51.389,
}


def _outcome(score: int = 70) -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating="Favorable",
            activity="negotiation",
            summary="Supportive window.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.55, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Presence",
                detail="Supportive presence factors.",
                score=68.0,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the interview date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="car-interview-evaluate-date",
            action_type="job_interview",
        ),
    )


def _ready_case(client: TestClient, *, framing_op: str = "evaluate") -> tuple[str, int]:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "Interview",
            "entry_mode": "structured",
        },
    )
    assert created.status_code == 201
    case_id = created.json()["case_id"]

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {
                "target_date": TARGET,
                "role": "Engineer",
                "natal_evidence": NATAL,
            },
        },
    )
    assert answers.status_code == 200, answers.text
    version = answers.json()["case"]["case_version"]

    if framing_op == "evaluate":
        framed = client.put(
            f"{BASE}/{case_id}/framing",
            json={
                "expected_case_version": version,
                "framing": {
                    "operation": "evaluate",
                    "time_scope": "specific_date",
                    "date": TARGET,
                },
            },
        )
    elif framing_op == "compare":
        framed = client.put(
            f"{BASE}/{case_id}/framing",
            json={
                "expected_case_version": version,
                "framing": {
                    "operation": "compare",
                    "time_scope": "multiple_dates",
                    "dates": [TARGET, "2026-08-20"],
                },
            },
        )
    else:
        framed = client.put(
            f"{BASE}/{case_id}/framing",
            json={
                "expected_case_version": version,
                "framing": {
                    "operation": "find",
                    "time_scope": "date_range",
                    "start": "2026-08-01",
                    "end": "2026-08-31",
                },
            },
        )
    assert framed.status_code == 200, framed.text
    version = framed.json()["case"]["case_version"]

    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    assert completed.status_code == 200, completed.text
    return case_id, completed.json()["case"]["case_version"]


def test_real_runtime_reads_framing_date_and_skips_stub(client: TestClient) -> None:
    case_id, version = _ready_case(client)

    with patch(
        "decision_case.services.car_interview_intake.generate_decision_outcome",
        return_value=_outcome(70),
    ) as mocked:
        evaluation = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": version},
        )
    assert evaluation.status_code == 201, evaluation.text
    assert mocked.called
    req = mocked.call_args.args[0]
    assert req.target_date == TARGET
    assert req.action_type == "job_interview"

    payload = evaluation.json()
    assert payload["engine_id"] == REAL_ENGINE_ID
    assert payload["engine_id"] != STUB_ENGINE_ID
    pkg = payload["package"]
    assert pkg["engine_id"] == REAL_ENGINE_ID
    assert pkg["timing"]["score"] == 70.0
    assert pkg["timing"]["candidates"][0]["date"] == TARGET
    assert pkg["counter_recommendation"]["summary"] == ""
    assert not any(p.get("code") == "STUB_ENGINE" for p in pkg["confidence"]["penalties"])


def test_missing_framing_returns_framing_required(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "No frame",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"target_date": TARGET, "role": "Engineer"},
        },
    )
    version = answers.json()["case"]["case_version"]
    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    version = completed.json()["case"]["case_version"]
    evaluation = client.post(
        f"{BASE}/{case_id}/evaluations",
        json={"expected_case_version": version},
    )
    assert evaluation.status_code == 400
    assert evaluation.json()["error"]["code"] == "FRAMING_REQUIRED"


def test_compare_and_find_not_implemented(client: TestClient) -> None:
    for op in ("compare", "find"):
        case_id, version = _ready_case(client, framing_op=op)
        evaluation = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": version},
        )
        assert evaluation.status_code == 400
        assert evaluation.json()["error"]["code"] == "OPERATION_NOT_IMPLEMENTED"


def test_missing_natal_returns_blocked_insufficient_not_stub(
    client: TestClient,
) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "No natal",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"target_date": TARGET, "role": "Engineer"},
        },
    )
    version = answers.json()["case"]["case_version"]
    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": version,
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
        },
    )
    version = framed.json()["case"]["case_version"]
    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    version = completed.json()["case"]["case_version"]

    with patch(
        "decision_case.services.car_interview_intake.generate_decision_outcome"
    ) as mocked:
        evaluation = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": version},
        )
    assert evaluation.status_code == 201, evaluation.text
    assert not mocked.called
    body = evaluation.json()
    assert body["engine_id"] == REAL_ENGINE_ID
    assert body["dq_status"] == "blocked"
    pkg = body["package"]
    assert pkg["recommendation"]["stance"] == "insufficient_data"
    assert pkg["timing"]["material"] is False
    # Case is evaluated but history marks insufficient via dq_status/stance.
    detail = client.get(f"{BASE}/{case_id}")
    assert detail.json()["state"] == "evaluated"
    history = client.get(f"{BASE}/{case_id}/history").json()["events"]
    created = [e for e in history if e["event"] == "evaluation_created"]
    assert created
    assert created[-1]["payload"]["dq_status"] == "blocked"
    assert created[-1]["payload"]["stance"] == "insufficient_data"


def test_reevaluate_after_natal_evidence_becomes_available(
    client: TestClient,
) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "Re-eval",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": 1,
            "answers": {"target_date": TARGET, "role": "Engineer"},
        },
    )
    version = answers.json()["case"]["case_version"]
    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": version,
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": TARGET,
            },
        },
    )
    version = framed.json()["case"]["case_version"]
    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    version = completed.json()["case"]["case_version"]
    first = client.post(
        f"{BASE}/{case_id}/evaluations",
        json={"expected_case_version": version},
    )
    assert first.status_code == 201
    assert first.json()["dq_status"] == "blocked"

    case = client.get(f"{BASE}/{case_id}").json()
    natal = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": case["case_version"],
            "answers": {"natal_evidence": NATAL},
        },
    )
    assert natal.status_code == 200
    version = natal.json()["case"]["case_version"]
    with patch(
        "decision_case.services.car_interview_intake.generate_decision_outcome",
        return_value=_outcome(70),
    ):
        second = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": version},
        )
    assert second.status_code == 201
    assert second.json()["dq_status"] == "pass"
    assert second.json()["package"]["recommendation"]["stance"] != "insufficient_data"
    assert second.json()["evaluation_version"] > first.json()["evaluation_version"]
    # Old blocked evaluation remains immutable; both appear in history.
    assert first.json()["evaluation_id"] != second.json()["evaluation_id"]
    listed = client.get(f"{BASE}/{case_id}/evaluations").json()["evaluations"]
    assert len(listed) >= 2
    by_id = {row["evaluation_id"]: row for row in listed}
    assert by_id[first.json()["evaluation_id"]]["dq_status"] == "blocked"
    assert by_id[second.json()["evaluation_id"]]["dq_status"] == "pass"
    history = client.get(f"{BASE}/{case_id}/history").json()["events"]
    eval_events = [e for e in history if e["event"] == "evaluation_created"]
    statuses = [e["payload"].get("dq_status") for e in eval_events]
    assert "blocked" in statuses
    assert "pass" in statuses
    # Natal write created a newer CaseVersion than the blocked eval's case_version.
    assert natal.json()["case"]["case_version"] > first.json()["case_version"]


def test_provider_failure_is_not_success(client: TestClient) -> None:
    case_id, version = _ready_case(client)

    with patch(
        "decision_case.services.car_interview_intake.generate_decision_outcome",
        side_effect=RuntimeError("provider down"),
    ):
        evaluation = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": version},
        )
    assert evaluation.status_code == 502
    assert evaluation.json()["error"]["code"] == "PROVIDER_FAILURE"


def test_stale_version_and_owner_isolation(client: TestClient) -> None:
    case_id, version = _ready_case(client)

    with patch(
        "decision_case.services.car_interview_intake.generate_decision_outcome",
        return_value=_outcome(70),
    ):
        stale = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": 1},
        )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "VERSION_CONFLICT"

    from decision_case.deps import get_e5_owner_subject_id
    from main import app

    app.dependency_overrides[get_e5_owner_subject_id] = lambda: "other-owner"
    try:
        missing = client.get(f"{BASE}/{case_id}")
        assert missing.status_code == 404
    finally:
        app.dependency_overrides[get_e5_owner_subject_id] = lambda: "e5-test-owner"


def test_repeated_evaluation_versions(client: TestClient) -> None:
    case_id, version = _ready_case(client)
    with patch(
        "decision_case.services.car_interview_intake.generate_decision_outcome",
        return_value=_outcome(70),
    ):
        first = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": version},
        )
        assert first.status_code == 201
        case = client.get(f"{BASE}/{case_id}").json()
        second = client.post(
            f"{BASE}/{case_id}/evaluations",
            json={"expected_case_version": case["case_version"]},
        )
    assert second.status_code == 201
    assert second.json()["evaluation_version"] >= first.json()["evaluation_version"]
