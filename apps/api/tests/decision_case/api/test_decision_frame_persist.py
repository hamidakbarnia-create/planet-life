"""Persist Decision Frame → Decision Case (no runtime).

Canonical shapes:
  EVALUATE → operation, time_scope=specific_date, date
  COMPARE  → operation, time_scope=multiple_dates, dates[]
  FIND     → operation, time_scope=date_range, start, end
  EVALUATE → operation, time_scope=none  (no temporal assumption)
"""

from __future__ import annotations

from datetime import date

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.identity_db

BASE = "/api/v1/decision-cases"
TODAY = date.today().isoformat()
# Stable fixture dates used across assertions (must not equal "today").
D1 = "2026-08-14"
D2 = "2026-08-18"
D3 = "2026-08-20"
RANGE_START = "2026-08-01"
RANGE_END = "2026-08-31"


def _evaluate_framing(**overrides):
    body = {
        "operation": "evaluate",
        "time_scope": "specific_date",
        "date": D2,
        "options": [],
        "objective": "Check interview date",
        "raw_intent": "Is August 18 good for my interview?",
    }
    body.update(overrides)
    return body


def _assert_no_legacy_aliases(framing: dict) -> None:
    assert "range_start" not in framing
    assert "range_end" not in framing


def test_unresolved_operation_does_not_create_case(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Unresolved frame",
            "framing": {
                "operation": "unresolved",
                "time_scope": "none",
            },
        },
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] in {
        "VALIDATION_ERROR",
        "FRAMING_UNRESOLVED",
    }


def test_evaluate_canonical_persist_and_readback(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Interview date check",
            "framing": _evaluate_framing(),
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    framing = body["framing"]
    assert framing["operation"] == "evaluate"
    assert framing["time_scope"] == "specific_date"
    assert framing["date"] == D2
    assert "dates" not in framing
    _assert_no_legacy_aliases(framing)
    assert framing["runtime_executed"] is False
    assert framing["date"] != TODAY
    assert body["case"]["state"] == "intake"
    assert body["intake"]["target_date"] == D2

    detail = client.get(f"{BASE}/{body['case']['case_id']}")
    assert detail.status_code == 200
    recovered_intake = detail.json()["intake"]
    recovered = recovered_intake["decision_frame"]
    assert recovered["operation"] == "evaluate"
    assert recovered["time_scope"] == "specific_date"
    assert recovered["date"] == D2
    assert recovered_intake["target_date"] == D2
    assert "dates" not in recovered
    _assert_no_legacy_aliases(recovered)


def test_evaluate_time_scope_none_no_implicit_today(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Yes/no without timing",
            "framing": {
                "operation": "evaluate",
                "time_scope": "none",
                "objective": "Should I take the role?",
                "raw_intent": "Should I take the role?",
            },
        },
    )
    assert response.status_code == 201, response.text
    framing = response.json()["framing"]
    assert framing["operation"] == "evaluate"
    assert framing["time_scope"] == "none"
    assert "date" not in framing
    assert "dates" not in framing
    assert TODAY not in str(framing)
    assert framing["runtime_executed"] is False

    case_id = response.json()["case"]["case_id"]
    recovered = client.get(f"{BASE}/{case_id}").json()["intake"]["decision_frame"]
    assert recovered["time_scope"] == "none"
    assert "date" not in recovered
    assert "dates" not in recovered


def test_compare_canonical_persist_and_readback(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "tim-compare-three",
            "title": "Compare dates",
            "framing": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": [D1, D2],
                "options": [
                    {"id": "a", "label": "14 Aug", "date": D1},
                    {"id": "b", "label": "18 Aug", "date": D2},
                ],
            },
        },
    )
    assert response.status_code == 201, response.text
    framing = response.json()["framing"]
    assert framing["operation"] == "compare"
    assert framing["time_scope"] == "multiple_dates"
    assert framing["dates"] == [D1, D2]
    assert "date" not in framing
    _assert_no_legacy_aliases(framing)
    assert len(framing["options"]) == 2

    case_id = response.json()["case"]["case_id"]
    recovered = client.get(f"{BASE}/{case_id}").json()["intake"]["decision_frame"]
    assert recovered["dates"] == [D1, D2]
    assert "date" not in recovered
    _assert_no_legacy_aliases(recovered)


def test_find_canonical_persist_and_readback_no_runtime(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Find best date",
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": RANGE_START,
                "end": RANGE_END,
            },
        },
    )
    assert response.status_code == 201, response.text
    framing = response.json()["framing"]
    assert framing["operation"] == "find"
    assert framing["time_scope"] == "date_range"
    assert framing["start"] == RANGE_START
    assert framing["end"] == RANGE_END
    _assert_no_legacy_aliases(framing)
    assert framing["runtime_executed"] is False
    assert framing["find_runtime"] == "timing_opt_find"
    # Metadata only — no evaluation / score package created.
    case_id = response.json()["case"]["case_id"]
    evals = client.get(f"{BASE}/{case_id}/evaluations")
    assert evals.status_code == 200
    assert evals.json()["evaluations"] == []

    recovered = client.get(f"{BASE}/{case_id}").json()["intake"]["decision_frame"]
    assert recovered["start"] == RANGE_START
    assert recovered["end"] == RANGE_END
    _assert_no_legacy_aliases(recovered)


def test_legacy_alias_normalization_identical_accepted(client: TestClient) -> None:
    """Identical canonical + legacy pairs accept deterministically (canonical kept)."""
    evaluate = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Identical evaluate aliases",
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": D2,
                "dates": [D2],
            },
        },
    )
    assert evaluate.status_code == 201, evaluate.text
    framing = evaluate.json()["framing"]
    assert framing["date"] == D2
    assert "dates" not in framing

    legacy_only = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Legacy dates array",
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "dates": [D2],
            },
        },
    )
    assert legacy_only.status_code == 201, legacy_only.text
    assert legacy_only.json()["framing"]["date"] == D2
    assert "dates" not in legacy_only.json()["framing"]

    find = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Identical find aliases",
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": RANGE_START,
                "end": RANGE_END,
                "range_start": RANGE_START,
                "range_end": RANGE_END,
            },
        },
    )
    assert find.status_code == 201, find.text
    framing = find.json()["framing"]
    assert framing["start"] == RANGE_START
    assert framing["end"] == RANGE_END
    _assert_no_legacy_aliases(framing)

    legacy_find = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Legacy find aliases",
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "range_start": RANGE_START,
                "range_end": RANGE_END,
            },
        },
    )
    assert legacy_find.status_code == 201, legacy_find.text
    framing = legacy_find.json()["framing"]
    assert framing["start"] == RANGE_START
    assert framing["end"] == RANGE_END
    _assert_no_legacy_aliases(framing)


def test_conflicting_canonical_legacy_aliases_rejected(client: TestClient) -> None:
    # A. date vs dates disagree
    a = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Conflict A",
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": D2,
                "dates": [D3],
            },
        },
    )
    assert a.status_code == 400
    assert a.json()["error"]["code"] == "VALIDATION_ERROR"

    # B. start/end vs range_start/range_end disagree
    b = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Conflict B",
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": "2026-08-10",
                "end": "2026-08-20",
                "range_start": "2026-08-11",
                "range_end": "2026-08-21",
            },
        },
    )
    assert b.status_code == 400
    assert b.json()["error"]["code"] == "VALIDATION_ERROR"

    # C. evaluate specific_date with more than one date
    c = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Conflict C",
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "dates": [D1, D2],
            },
        },
    )
    assert c.status_code == 400
    assert c.json()["error"]["code"] == "VALIDATION_ERROR"

    # D. compare with fewer than two dates
    d = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Conflict D",
            "framing": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": [D2],
            },
        },
    )
    assert d.status_code == 400
    assert d.json()["error"]["code"] == "VALIDATION_ERROR"

    # E. find start > end
    e = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Conflict E",
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": RANGE_END,
                "end": RANGE_START,
            },
        },
    )
    assert e.status_code == 400
    assert e.json()["error"]["code"] == "VALIDATION_ERROR"


def test_no_implicit_today_missing_evaluate_date_rejected(client: TestClient) -> None:
    missing_date = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Bad evaluate",
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
            },
        },
    )
    assert missing_date.status_code == 400
    assert missing_date.json()["error"]["code"] == "VALIDATION_ERROR"


def test_invalid_operation_time_combinations_rejected(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Bad combo",
            "framing": {
                "operation": "compare",
                "time_scope": "specific_date",
                "dates": [D2],
            },
        },
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_stale_framing_update_returns_409(client: TestClient) -> None:
    created = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "CAS framing",
            "framing": _evaluate_framing(),
        },
    )
    assert created.status_code == 201
    case_id = created.json()["case"]["case_id"]
    assert created.json()["case"]["case_version"] >= 1
    stale = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": 1,
            "framing": _evaluate_framing(date=D3),
        },
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "VERSION_CONFLICT"


def test_owner_isolation_for_framing_read(client: TestClient) -> None:
    from decision_case.deps import get_e5_owner_subject_id
    from main import app

    created = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Owner A",
            "framing": _evaluate_framing(),
        },
    )
    assert created.status_code == 201
    case_id = created.json()["case"]["case_id"]

    app.dependency_overrides[get_e5_owner_subject_id] = lambda: "other-owner"
    try:
        missing = client.get(f"{BASE}/{case_id}")
        assert missing.status_code == 404
    finally:
        app.dependency_overrides[get_e5_owner_subject_id] = lambda: "e5-test-owner"


def test_car_interview_intake_preserves_decision_frame(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "decision_type_id": "car-interview",
            "title": "Attend job interview",
            "entry_mode": "structured",
        },
    )
    assert created.status_code == 201
    case_id = created.json()["case_id"]

    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": 1,
            "framing": _evaluate_framing(),
        },
    )
    assert framed.status_code == 200, framed.text
    version = framed.json()["case"]["case_version"]
    intake_after_frame = framed.json()["intake"]
    assert "decision_frame" in intake_after_frame
    # Framing lives under intake.decision_frame — not duplicated as top-level slots.
    assert "date" not in intake_after_frame
    assert "dates" not in intake_after_frame
    assert "start" not in intake_after_frame
    assert "end" not in intake_after_frame
    assert "range_start" not in intake_after_frame
    assert "range_end" not in intake_after_frame

    answers = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": version,
            "answers": {"target_date": D2, "role": "Engineer"},
        },
    )
    assert answers.status_code == 200, answers.text
    intake = answers.json()["intake"]
    assert intake["target_date"] == D2
    assert intake["role"] == "Engineer"
    assert intake["decision_frame"]["operation"] == "evaluate"
    assert intake["decision_frame"]["date"] == D2
    _assert_no_legacy_aliases(intake["decision_frame"])


# --- Structured intake carry-forward (target_date seed) ---


@pytest.mark.parametrize(
    "decision_type_id,title",
    [
        ("car-interview", "Job interview"),
        ("bus-investor-meeting", "Investor meeting"),
        ("bus-product-launch", "Product launch"),
        ("mar-wedding-date", "Wedding date"),
    ],
)
def test_evaluate_from_framing_seeds_target_date(
    client: TestClient, decision_type_id: str, title: str
) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": decision_type_id,
            "title": title,
            "framing": _evaluate_framing(
                objective=title,
                raw_intent=f"Is {D2} good?",
            ),
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["framing"]["date"] == D2
    assert body["intake"]["target_date"] == D2
    assert body["intake"]["decision_frame"]["date"] == D2

    readback = client.get(f"{BASE}/{body['case']['case_id']}")
    assert readback.status_code == 200
    intake = readback.json()["intake"]
    assert intake["target_date"] == D2
    assert intake["decision_frame"]["date"] == D2


def test_evaluate_none_does_not_seed_target_date(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "car-interview",
            "title": "No date",
            "framing": {
                "operation": "evaluate",
                "time_scope": "none",
                "raw_intent": "Should I take the interview?",
            },
        },
    )
    assert response.status_code == 201, response.text
    intake = response.json()["intake"]
    assert "target_date" not in intake
    assert "date" not in intake.get("decision_frame", {})


def test_compare_does_not_seed_target_date(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "mar-wedding-date",
            "title": "Compare wedding dates",
            "framing": {
                "operation": "compare",
                "time_scope": "multiple_dates",
                "dates": [D1, D2],
                "options": [
                    {"id": "a", "label": "A", "date": D1},
                    {"id": "b", "label": "B", "date": D2},
                ],
            },
        },
    )
    assert response.status_code == 201, response.text
    intake = response.json()["intake"]
    assert "target_date" not in intake
    assert intake["decision_frame"]["dates"] == [D1, D2]


def test_find_does_not_seed_target_date(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "bus-product-launch",
            "title": "Find launch window",
            "framing": {
                "operation": "find",
                "time_scope": "date_range",
                "start": RANGE_START,
                "end": RANGE_END,
            },
        },
    )
    assert response.status_code == 201, response.text
    intake = response.json()["intake"]
    assert "target_date" not in intake
    assert intake["decision_frame"]["start"] == RANGE_START


def test_invalid_evaluate_date_rejected_without_seed(client: TestClient) -> None:
    response = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "car-interview",
            "title": "Bad date",
            "framing": {
                "operation": "evaluate",
                "time_scope": "specific_date",
                "date": "2026-13-40",
            },
        },
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_seed_intake_from_framing_never_overwrites_target_date() -> None:
    from decision_case.services.decision_frame import seed_intake_from_framing

    framing = {
        "operation": "evaluate",
        "time_scope": "specific_date",
        "date": D2,
    }
    seeded = seed_intake_from_framing(
        {"decision_frame": framing, "target_date": D1},
        framing,
    )
    assert seeded["target_date"] == D1


def test_framing_update_does_not_overwrite_existing_target_date(
    client: TestClient,
) -> None:
    created = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "car-interview",
            "title": "Interview",
            "framing": _evaluate_framing(date=D1),
        },
    )
    assert created.status_code == 201, created.text
    case_id = created.json()["case"]["case_id"]
    version = created.json()["case"]["case_version"]
    assert created.json()["intake"]["target_date"] == D1

    saved = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": version,
            "answers": {"target_date": D3, "role": "PM"},
        },
    )
    assert saved.status_code == 200, saved.text
    version = saved.json()["case"]["case_version"]
    assert saved.json()["intake"]["target_date"] == D3

    framed = client.put(
        f"{BASE}/{case_id}/framing",
        json={
            "expected_case_version": version,
            "framing": _evaluate_framing(date=D2),
        },
    )
    assert framed.status_code == 200, framed.text
    assert framed.json()["intake"]["target_date"] == D3
    assert framed.json()["intake"]["decision_frame"]["date"] == D2


def test_stale_case_version_on_answers_still_conflicts(client: TestClient) -> None:
    created = client.post(
        f"{BASE}/from-framing",
        json={
            "decision_type_id": "car-interview",
            "title": "Interview",
            "framing": _evaluate_framing(),
        },
    )
    assert created.status_code == 201, created.text
    case_id = created.json()["case"]["case_id"]
    stale = created.json()["case"]["case_version"]

    first = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": stale,
            "answers": {"target_date": D2, "role": "Engineer"},
        },
    )
    assert first.status_code == 200, first.text

    conflict = client.post(
        f"{BASE}/{case_id}/intake/answers",
        json={
            "expected_case_version": stale,
            "answers": {"target_date": D1, "role": "Designer"},
        },
    )
    assert conflict.status_code == 409
