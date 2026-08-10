from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from packages.decision_engine.evaluate.car_interview_compare import REAL_ENGINE_ID
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
            summary="Timing supports the interview date.",
            recommendation_text="Good conditions.",
        ),
        metadata=DecisionMetadata(
            module_origin="ask",
            decision_intent="car-interview-compare-dates",
            action_type="job_interview",
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
            "decision_type_id": "car-interview",
            "title": "Compare interview dates",
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
                "role": "Product Manager",
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


def test_car_interview_compare_api_vertical(client: TestClient) -> None:
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
        assert call.args[0].action_type == "job_interview"

    payload = comparison.json()
    assert payload["comparison_id"]
    package = payload["package"]
    assert package["engine_id"] == REAL_ENGINE_ID
    assert package["decision_type_id"] == "car-interview"
    assert package["family_id"] == "visibility"
    assert package["mode"] == "compare_dates"
    candidates = sorted(package["timing"]["candidates"], key=lambda c: c["rank"])
    assert len(candidates) == 2
    assert candidates[0]["option_id"] == "opt-2"
    assert candidates[0]["date"] == D2
    assert "Prefer Thu" in package["recommendation"]["summary"]
    assert package["recommendation"]["stance"] == "proceed_with_conditions"

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

    listed_eval = client.get(f"{BASE}/{case_id}/evaluations")
    assert listed_eval.status_code == 200
    assert listed_eval.json()["evaluations"] == []

    listed_findings = client.get(f"{BASE}/{case_id}/findings")
    assert listed_findings.status_code == 200
    assert listed_findings.json()["findings"] == []


def test_compare_five_dates_accepted(client: TestClient) -> None:
    dates = [
        "2026-09-10",
        "2026-09-12",
        "2026-09-15",
        "2026-09-18",
        "2026-09-20",
    ]
    case_id, version = _prepare_compare_case(client, dates=dates)

    def _generate(request):
        return _outcome_for(50.0 + dates.index(request.target_date))

    with patch(
        "decision_case.services.compare_runtime.generate_decision_outcome",
        side_effect=_generate,
    ):
        comparison = client.post(
            f"{BASE}/{case_id}/comparisons",
            json={"expected_case_version": version},
        )
    assert comparison.status_code == 201, comparison.text
    assert len(comparison.json()["package"]["timing"]["candidates"]) == 5


def test_compare_via_evaluations_is_rejected(client: TestClient) -> None:
    case_id, version = _prepare_compare_case(client)
    response = client.post(
        f"{BASE}/{case_id}/evaluations",
        json={"expected_case_version": version},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "OPERATION_NOT_IMPLEMENTED"
    case = client.get(f"{BASE}/{case_id}")
    assert case.json()["state"] == "evidence_ready"


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
        missing = client.get(f"{BASE}/{case_id}")
        assert missing.status_code == 404
        missing_cmp = client.get(f"{BASE}/{case_id}/comparisons")
        assert missing_cmp.status_code == 404
    finally:
        app.dependency_overrides[get_e5_owner_subject_id] = lambda: "e5-test-owner"


def test_same_date_recompare_preserves_candidate_identity(
    client: TestClient,
) -> None:
    """Re-compare without reframing must upsert candidates, not 500.

    Invariant (from compare_runtime + schema):
    - candidates bind to intake decision_versions.version (unchanged on re-compare)
    - unique (case_id, case_version, candidate_date) therefore conflicts
    - ON CONFLICT preserves candidate_date_id; new comparison_id/evaluation_id
    - case.current_case_version (CAS) advances; there is no comparison_version
    """
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
    # Comparison rows bind to the same intake case_version (not a comparison seq).
    assert second_body["case_version"] == first_body["case_version"]

    first_rank_ids = {
        str(item["candidate_date_id"]) for item in first_body["ranking"]
    }
    second_rank_ids = {
        str(item["candidate_date_id"]) for item in second_body["ranking"]
    }
    assert len(first_rank_ids) == 2
    assert first_rank_ids == second_rank_ids

    listed = client.get(f"{BASE}/{case_id}/comparisons")
    assert listed.status_code == 200
    comparisons = listed.json()["comparisons"]
    assert len(comparisons) == 2
    listed_ids = {c["comparison_id"] for c in comparisons}
    assert listed_ids == {
        first_body["comparison_id"],
        second_body["comparison_id"],
    }

    after = client.get(f"{BASE}/{case_id}").json()
    assert after["state"] == "compared"
    assert after["activation_phase"] == "compared"
    assert after["case_version"] > case_after_first["case_version"]

    listed_eval = client.get(f"{BASE}/{case_id}/evaluations")
    assert listed_eval.status_code == 200
    assert listed_eval.json()["evaluations"] == []
    listed_findings = client.get(f"{BASE}/{case_id}/findings")
    assert listed_findings.status_code == 200
    assert listed_findings.json()["findings"] == []


def test_compare_framing_rejects_one_and_six_and_duplicates(
    client: TestClient,
) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "Compare interview dates",
            "entry_mode": "structured",
        },
    )
    case_id = created.json()["case_id"]
    version = created.json()["case_version"]

    one = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": version,
            "framing": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": [D1],
                "options": [{"id": "a", "label": "A", "date": D1}],
            },
        },
    )
    assert one.status_code == 400

    six_dates = [
        "2026-09-10",
        "2026-09-11",
        "2026-09-12",
        "2026-09-13",
        "2026-09-14",
        "2026-09-15",
    ]
    six = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": version,
            "framing": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": six_dates,
                "options": [
                    {"id": f"o{i}", "label": f"L{i}", "date": d}
                    for i, d in enumerate(six_dates)
                ],
            },
        },
    )
    assert six.status_code == 400

    before_case = client.get(f"{BASE}/{case_id}").json()
    dup = client.put(
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
    assert dup.status_code == 400
    # Rejected at framing validation — never reaches compare / append_candidate_dates.
    after_case = client.get(f"{BASE}/{case_id}").json()
    assert after_case["case_version"] == before_case["case_version"]
    assert after_case["state"] == before_case["state"]
    listed = client.get(f"{BASE}/{case_id}/comparisons")
    assert listed.status_code == 200
    assert listed.json()["comparisons"] == []
