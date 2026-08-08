from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.wedding_date_compare import REAL_ENGINE_ID
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
            activity="Wedding Date",
            summary="Supportive wedding timing.",
            text="Good conditions.",
        ),
        confidence=Confidence(value=0.6, rating="Favorable"),
        evidence_references=[
            EvidenceReference(
                title="Partnership timing",
                detail="Supportive conditions.",
                score=score,
            )
        ],
        explanation=Explanation(
            summary="Timing supports the wedding date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="wedding-date-compare-dates",
            action_type="wedding_date",
        ),
    )


def _prepare_compare_case(client: TestClient) -> tuple[str, int]:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Compare wedding dates",
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
                "dates": [D1, D2],
                "options": [
                    {"id": "early", "label": "Early weekend", "date": D1},
                    {"id": "late", "label": "Late weekend", "date": D2},
                ],
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
                "ceremony_type": "civil",
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


def test_wedding_date_compare_api_vertical(client: TestClient) -> None:
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
    natal_bindings = {
        (
            call.args[0].birth_date,
            call.args[0].birth_time,
            call.args[0].location,
            call.args[0].latitude,
            call.args[0].longitude,
        )
        for call in mocked.call_args_list
    }
    assert natal_bindings == {
        ("1988-06-15", "09:30", "Paris", 48.8566, 2.3522)
    }

    payload = comparison.json()
    assert payload["comparison_id"]
    assert payload["evaluation_id"]
    package = payload["package"]
    assert package["engine_id"] == REAL_ENGINE_ID
    assert package["decision_type_id"] == "mar-wedding-date"
    assert package["family_id"] == "timing_opt"
    assert package["mode"] == "compare_dates"
    candidates = sorted(package["timing"]["candidates"], key=lambda c: c["rank"])
    assert len(candidates) == 2
    assert candidates[0]["option_id"] == "late"
    assert candidates[0]["label"] == "Late weekend"
    assert candidates[0]["date"] == D2
    assert candidates[1]["option_id"] == "early"
    assert candidates[1]["label"] == "Early weekend"
    assert "Prefer Late weekend" in package["recommendation"]["summary"]

    case = client.get(f"{BASE}/{case_id}")
    assert case.status_code == 200
    assert case.json()["state"] == "compared"
    assert case.json()["activation_phase"] == "compared"
    assert case.json()["mode"] == "compare_dates"

    listed_cmp = client.get(f"{BASE}/{case_id}/comparisons")
    assert listed_cmp.status_code == 200
    comparisons = listed_cmp.json()["comparisons"]
    assert len(comparisons) == 1
    assert comparisons[0]["comparison_id"] == payload["comparison_id"]

    got = client.get(
        f"{BASE}/{case_id}/comparisons/{payload['comparison_id']}"
    )
    assert got.status_code == 200
    assert got.json()["package"]["mode"] == "compare_dates"

    # Compare packages must not appear in Evaluate history listing.
    listed_eval = client.get(f"{BASE}/{case_id}/evaluations")
    assert listed_eval.status_code == 200
    assert listed_eval.json()["evaluations"] == []


def test_compare_via_evaluations_is_rejected(client: TestClient) -> None:
    case_id, version = _prepare_compare_case(client)
    response = client.post(
        f"{BASE}/{case_id}/evaluations",
        json={"expected_case_version": version},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "OPERATION_NOT_IMPLEMENTED"
    assert response.json()["error"]["details"]["operation"] == "compare"
    case = client.get(f"{BASE}/{case_id}")
    assert case.json()["state"] == "evidence_ready"


def test_compare_framing_rejects_duplicate_option_dates(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Compare wedding dates",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    version = created.json()["case_version"]
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
