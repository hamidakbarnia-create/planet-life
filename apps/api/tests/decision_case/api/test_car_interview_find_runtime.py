from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.car_interview_find import REAL_ENGINE_ID
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
START = "2026-09-01"
END = "2026-09-14"

NATAL = {
    "birth_date": "1988-06-15",
    "birth_time": "09:30",
    "location": "Paris",
    "latitude": 48.8566,
    "longitude": 2.3522,
}


def _outcome(score: float = 70.0, rating: str = "Favorable") -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating=rating,
            activity="Job Interview",
            summary="Supportive interview timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Communication timing",
                detail="Supportive conditions.",
                score=score,
            )
        ],
        explanation=Explanation(
            summary="Timing supports interview windows.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="car-interview-find-dates",
            action_type="job_interview",
        ),
    )


def _prepare_find_case(client: TestClient) -> tuple[str, int]:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "Attend job interview",
            "entry_mode": "structured",
        },
    )
    assert created.status_code == 201, created.text
    case_id = created.json()["case_id"]

    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": 1,
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": START,
                "end": END,
            },
        },
    )
    assert framed.status_code == 200, framed.text
    version = framed.json()["case"]["case_version"]
    assert framed.json()["case"]["mode"] == "find_dates"

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": version,
            "answers": {
                "role": "Product Manager",
                "natal_evidence": NATAL,
            },
        },
    )
    assert answers.status_code == 200, answers.text
    version = answers.json()["case"]["case_version"]

    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    assert completed.status_code == 200, completed.text
    version = completed.json()["case"]["case_version"]
    assert completed.json()["case"]["state"] == "evidence_ready"
    return case_id, version


def test_car_interview_find_api_lifecycle_isolation_and_refind(
    client: TestClient,
) -> None:
    case_id, version = _prepare_find_case(client)

    scores = [40.0] * 14
    scores[2] = 70.0
    scores[3] = 72.0
    scores[4] = 68.0
    scores[10] = 71.0
    outcomes = iter(
        _outcome(
            score=s,
            rating="Favorable" if s >= 65 else "Challenging",
        )
        for s in scores
    )

    with patch(
        "decision_case.services.find_runtime.generate_decision_outcome",
        side_effect=lambda _req: next(outcomes),
    ) as mocked:
        finding = client.post(
            f"{BASE}/{case_id}/findings",
            json={"expected_case_version": version},
        )

    assert finding.status_code == 201, finding.text
    assert mocked.call_count == 14
    body = finding.json()
    assert body["engine_id"] == REAL_ENGINE_ID
    assert body["dq_status"] == "pass"
    assert body["finding_version"] == 1
    package = body["package"]
    assert package["mode"] == "find_dates"
    assert package["family_id"] == "visibility"
    assert package["decision_type_id"] == "car-interview"
    assert package["find"]["range_start"] == START
    assert package["find"]["range_end"] == END
    assert len(package["find"]["windows"]) >= 1
    claim = package["recommendation"]["summary"].lower()
    assert "hired" not in claim
    assert "job offer" not in claim

    case = client.get(f"{BASE}/{case_id}")
    assert case.status_code == 200
    assert case.json()["state"] == "found"
    assert case.json()["mode"] == "find_dates"
    cas_after_first = case.json()["case_version"]

    listed_findings = client.get(f"{BASE}/{case_id}/findings")
    assert listed_findings.status_code == 200
    assert len(listed_findings.json()["findings"]) == 1
    first_finding_id = body["finding_id"]

    got = client.get(f"{BASE}/{case_id}/findings/{first_finding_id}")
    assert got.status_code == 200
    assert got.json()["finding_version"] == 1

    assert client.get(f"{BASE}/{case_id}/evaluations").json()["evaluations"] == []
    assert client.get(f"{BASE}/{case_id}/comparisons").json()["comparisons"] == []

    # Re-FIND on same framed case.
    scores2 = [40.0] * 14
    scores2[2] = 74.0
    scores2[3] = 75.0
    outcomes2 = iter(
        _outcome(score=s, rating="Favorable" if s >= 65 else "Challenging")
        for s in scores2
    )
    with patch(
        "decision_case.services.find_runtime.generate_decision_outcome",
        side_effect=lambda _req: next(outcomes2),
    ):
        again = client.post(
            f"{BASE}/{case_id}/findings",
            json={"expected_case_version": cas_after_first},
        )
    assert again.status_code == 201, again.text
    assert again.json()["finding_id"] != first_finding_id
    assert again.json()["finding_version"] == 2
    case2 = client.get(f"{BASE}/{case_id}")
    assert case2.json()["state"] == "found"
    assert case2.json()["case_version"] > cas_after_first
    assert client.get(f"{BASE}/{case_id}/evaluations").json()["evaluations"] == []
    assert client.get(f"{BASE}/{case_id}/comparisons").json()["comparisons"] == []
    assert len(client.get(f"{BASE}/{case_id}/findings").json()["findings"]) == 2


def test_car_interview_find_stale_version_and_owner_isolation(
    client: TestClient,
) -> None:
    case_id, version = _prepare_find_case(client)
    scores = [40.0] * 14
    scores[2] = 70.0
    scores[3] = 72.0
    outcomes = iter(
        _outcome(score=s, rating="Favorable" if s >= 65 else "Challenging")
        for s in scores
    )
    with patch(
        "decision_case.services.find_runtime.generate_decision_outcome",
        side_effect=lambda _req: next(outcomes),
    ):
        stale = client.post(
            f"{BASE}/{case_id}/findings",
            json={"expected_case_version": version - 1},
        )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "VERSION_CONFLICT"

    from decision_case.deps import get_e5_owner_subject_id
    from main import app

    app.dependency_overrides[get_e5_owner_subject_id] = lambda: "other-owner"
    try:
        assert client.get(f"{BASE}/{case_id}").status_code == 404
        assert client.get(f"{BASE}/{case_id}/findings").status_code == 404
    finally:
        app.dependency_overrides[get_e5_owner_subject_id] = lambda: "e5-test-owner"


def test_car_interview_find_rejects_short_range(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "Interview",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": 1,
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": "2026-09-01",
                "end": "2026-09-05",
            },
        },
    )
    assert framed.status_code == 400, framed.text


def test_unsupported_find_type_remains_fail_closed(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Wedding",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": 1,
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": START,
                "end": END,
            },
        },
    )
    # Framing may succeed or fail depending on registry modes; FIND must fail-closed.
    if framed.status_code == 200:
        version = framed.json()["case"]["case_version"]
        answers = client.post(
            f"{BASE}/{case_id}/intake/answers",
            json={
                "expected_case_version": version,
                "answers": {
                    "partner_a_name": "A",
                    "partner_b_name": "B",
                    "natal_evidence": NATAL,
                },
            },
        )
        if answers.status_code == 200:
            version = answers.json()["case"]["case_version"]
            completed = client.post(
                f"{BASE}/{case_id}/intake/complete",
                json={"expected_case_version": version},
            )
            if completed.status_code == 200:
                version = completed.json()["case"]["case_version"]
                finding = client.post(
                    f"{BASE}/{case_id}/findings",
                    json={"expected_case_version": version},
                )
                assert finding.status_code in {400, 404, 422}
    else:
        assert framed.status_code in {400, 422}
