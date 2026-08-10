from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.investor_meeting_compare import REAL_ENGINE_ID
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
D1 = "2026-09-10"
D2 = "2026-09-18"

NATAL = {
    "birth_date": "1988-06-15",
    "birth_time": "09:30",
    "location": "Paris",
    "latitude": 48.8566,
    "longitude": 2.3522,
}


def _outcome_for(score: float) -> DecisionOutcome:
    return DecisionOutcome(
        recommendation=Recommendation(
            score=score,
            rating="Favorable" if score >= 65 else "Mixed",
            activity="Investor Meeting",
            summary="Supportive meeting timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Negotiation timing",
                detail="Supportive conditions.",
                score=score,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the investor meeting date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="investor-meeting-compare-dates",
            action_type="investor_meeting",
        ),
    )


def _prepare_compare_case(
    client: TestClient,
    *,
    dates: list[str] | None = None,
) -> tuple[str, int]:
    candidate_dates = dates or [D1, D2]
    labels = ["Mon", "Thu", "Fri", "Sat", "Sun"]
    options = [
        {
            "id": f"opt-{index + 1}",
            "label": labels[index],
            "date": date_value,
        }
        for index, date_value in enumerate(candidate_dates)
    ]
    created = client.post(
        BASE,
        json={
            "decision_type_id": "bus-investor-meeting",
            "title": "Compare investor meeting dates",
            "entry_mode": "structured",
        },
    )
    assert created.status_code == 201, created.text
    case_id = created.json()["case_id"]
    version = created.json()["case_version"]

    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": version,
            "framing": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": candidate_dates,
                "options": options,
            },
        },
    )
    assert framed.status_code == 200, framed.text
    body = framed.json()
    assert body["case"]["mode"] == "compare_dates"
    version = body["case"]["case_version"]

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": version,
            "answers": {
                "meeting_goal": "Raise seed",
                "natal_evidence": NATAL,
            },
        },
    )
    assert answers.status_code == 200, answers.text
    assert answers.json()["is_complete"] is True
    version = answers.json()["case"]["case_version"]

    completed = client.post(
        f"{BASE}/{case_id}/intake/complete",
        json={"expected_case_version": version},
    )
    assert completed.status_code == 200, completed.text
    version = completed.json()["case"]["case_version"]
    return case_id, version


def test_investor_meeting_compare_api_vertical(client: TestClient) -> None:
    case_id, version = _prepare_compare_case(client)
    scores = {D1: 61.0, D2: 79.0}

    def _generate(request):
        return _outcome_for(scores[request.target_date])

    with patch(
        "decision_case.services.compare_runtime.generate_decision_outcome",
        side_effect=_generate,
    ) as mocked:
        comparison = client.post(
            f"{BASE}/{case_id}/comparisons",
            json={"expected_case_version": version},
        )

    assert comparison.status_code == 201, comparison.text
    assert mocked.call_count == 2
    for call in mocked.call_args_list:
        assert call.args[0].action_type == "investor_meeting"

    payload = comparison.json()
    package = payload["package"]
    assert package["engine_id"] == REAL_ENGINE_ID
    assert package["decision_type_id"] == "bus-investor-meeting"
    assert package["family_id"] == "visibility"
    assert package["mode"] == "compare_dates"
    candidates = sorted(package["timing"]["candidates"], key=lambda c: c["rank"])
    assert candidates[0]["date"] == D2
    assert "Prefer Thu" in package["recommendation"]["summary"]
    assert package["recommendation"]["stance"] == "proceed_with_conditions"

    case = client.get(f"{BASE}/{case_id}")
    assert case.json()["state"] == "compared"
    assert case.json()["activation_phase"] == "compared"

    listed_cmp = client.get(f"{BASE}/{case_id}/comparisons")
    assert len(listed_cmp.json()["comparisons"]) == 1
    got = client.get(
        f"{BASE}/{case_id}/comparisons/{payload['comparison_id']}"
    )
    assert got.status_code == 200

    assert client.get(f"{BASE}/{case_id}/evaluations").json()["evaluations"] == []
    assert client.get(f"{BASE}/{case_id}/findings").json()["findings"] == []


def test_same_date_recompare_preserves_candidate_identity(
    client: TestClient,
) -> None:
    case_id, version = _prepare_compare_case(client)

    with patch(
        "decision_case.services.compare_runtime.generate_decision_outcome",
        return_value=_outcome_for(70),
    ):
        first = client.post(
            f"{BASE}/{case_id}/comparisons",
            json={"expected_case_version": version},
        )
        assert first.status_code == 201, first.text
        first_body = first.json()
        case_after_first = client.get(f"{BASE}/{case_id}").json()
        assert case_after_first["state"] == "compared"
        assert case_after_first["activation_phase"] == "compared"
        assert case_after_first["case_version"] > version

        second = client.post(
            f"{BASE}/{case_id}/comparisons",
            json={"expected_case_version": case_after_first["case_version"]},
        )
    assert second.status_code == 201, second.text
    second_body = second.json()
    assert second_body["comparison_id"] != first_body["comparison_id"]
    assert second_body["evaluation_id"] != first_body["evaluation_id"]
    assert second_body["case_version"] == first_body["case_version"]
    assert {
        str(item["candidate_date_id"]) for item in first_body["ranking"]
    } == {
        str(item["candidate_date_id"]) for item in second_body["ranking"]
    }
    assert len(client.get(f"{BASE}/{case_id}/comparisons").json()["comparisons"]) == 2
    after = client.get(f"{BASE}/{case_id}").json()
    assert after["state"] == "compared"
    assert after["activation_phase"] == "compared"
    assert after["case_version"] > case_after_first["case_version"]
    assert client.get(f"{BASE}/{case_id}/evaluations").json()["evaluations"] == []
    assert client.get(f"{BASE}/{case_id}/findings").json()["findings"] == []


def test_stale_version_and_owner_isolation(client: TestClient) -> None:
    case_id, version = _prepare_compare_case(client)

    with patch(
        "decision_case.services.compare_runtime.generate_decision_outcome",
        return_value=_outcome_for(70),
    ):
        stale = client.post(
            f"{BASE}/{case_id}/comparisons",
            json={"expected_case_version": 1},
        )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "VERSION_CONFLICT"

    from decision_case.deps import get_e5_owner_subject_id
    from main import app

    app.dependency_overrides[get_e5_owner_subject_id] = lambda: "other-owner"
    try:
        assert client.get(f"{BASE}/{case_id}").status_code == 404
        assert client.get(f"{BASE}/{case_id}/comparisons").status_code == 404
    finally:
        app.dependency_overrides[get_e5_owner_subject_id] = lambda: "e5-test-owner"


def test_compare_framing_rejects_duplicates_before_repository(
    client: TestClient,
) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "bus-investor-meeting",
            "title": "Compare investor meeting dates",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    version = created.json()["case_version"]
    before = client.get(f"{BASE}/{case_id}").json()
    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": version,
            "framing": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": [D1, D1],
                "options": [
                    {"id": "a", "label": "A", "date": D1},
                    {"id": "b", "label": "B", "date": D1},
                ],
            },
        },
    )
    assert framed.status_code == 400
    after = client.get(f"{BASE}/{case_id}").json()
    assert after["case_version"] == before["case_version"]
    assert after["state"] == before["state"]
    assert client.get(f"{BASE}/{case_id}/comparisons").json()["comparisons"] == []


def test_compare_via_evaluations_is_rejected(client: TestClient) -> None:
    case_id, version = _prepare_compare_case(client)
    response = client.post(
        f"{BASE}/{case_id}/evaluations",
        json={"expected_case_version": version},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "OPERATION_NOT_IMPLEMENTED"
