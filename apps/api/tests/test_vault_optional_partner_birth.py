"""Blank optional partner birth fields are omitted, not rejected as invalid HH:MM."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(ROOT / "apps/api/src"), str(ROOT)]

from routes.vault import VaultCompatibilityRequest, router  # noqa: E402

_BASE = {
    "birth_date": "1990-01-15",
    "birth_time": "14:30",
    "location": "51.5155,-0.0922",
    "lang": "en",
    "relationship_type": "friendship",
    "partner_birth_date": "1990-01-15",
    "partner_location": "51.5155,-0.0922",
    "partner_birth_time_known": False,
}


def test_empty_partner_birth_time_coerces_to_none():
    body = VaultCompatibilityRequest.model_validate(
        {**_BASE, "partner_birth_time": ""}
    )
    assert body.partner_birth_time is None
    blank_date = VaultCompatibilityRequest.model_validate(
        {**_BASE, "partner_birth_date": "  ", "partner_birth_time": None}
    )
    assert blank_date.partner_birth_date is None


def test_invalid_partner_birth_time_still_rejected():
    with pytest.raises(ValidationError):
        VaultCompatibilityRequest.model_validate(
            {**_BASE, "partner_birth_time": "14"}
        )


@pytest.mark.parametrize(
    "endpoint",
    ("cheating-radar", "trust-patterns", "communication-risk"),
)
def test_shadow_routes_accept_blank_partner_time(endpoint: str):
    app = FastAPI()
    app.include_router(router, prefix="/api/vault")
    with TestClient(app) as client:
        response = client.post(
            f"/api/vault/{endpoint}",
            json={**_BASE, "partner_birth_time": ""},
        )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["relationship_type"] == "friendship"
    assert "partner_birth_time" in payload.get("missing_inputs", [])


def _compat_client():
    app = FastAPI()
    app.include_router(router, prefix="/api/vault")
    return TestClient(app)


def _compat_body(**overrides):
    body = {
        "birth_date": "1990-01-15",
        "birth_time": "14:30",
        "location": "51.5155,-0.0922",
        "lang": "en",
        "relationship_type": "friendship",
        "partner_birth_date": "1990-01-15",
        "partner_location": "51.5155,-0.0922",
        "partner_birth_time_known": True,
        "partner_birth_time": "09:15",
    }
    body.update(overrides)
    return body


@pytest.mark.parametrize(
    "overrides",
    (
        {"partner_birth_date": ""},
        {"partner_birth_date": None},
        {"omit": "partner_birth_date"},
        {"partner_location": ""},
        {"partner_location": None},
        {"omit": "partner_location"},
    ),
)
def test_compatibility_missing_partner_identity_has_no_overall_score(overrides):
    body = _compat_body()
    overrides = dict(overrides)
    omit = overrides.pop("omit", None)
    body.update(overrides)
    if omit:
        body.pop(omit, None)
    with _compat_client() as client:
        response = client.post("/api/vault/compatibility", json=body)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["overall_score"] is None
    assert payload["dimensions"] == {}
    missing = payload["missing_inputs"]
    if omit == "partner_birth_date" or "partner_birth_date" in overrides:
        assert "partner_birth_date" in missing
    if omit == "partner_location" or "partner_location" in overrides:
        assert "partner_location" in missing


@pytest.mark.parametrize("time_value", ("", None, "omit"))
def test_compatibility_unknown_partner_time_stays_unknown(time_value):
    body = _compat_body(partner_birth_time_known=True)
    if time_value == "omit":
        body.pop("partner_birth_time", None)
    else:
        body["partner_birth_time"] = time_value
    with _compat_client() as client:
        response = client.post("/api/vault/compatibility", json=body)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["overall_score"] is not None
    assert "partner_birth_time" in payload["missing_inputs"]
    assert payload["reading"]["data_completeness"] == "incomplete"
    assert payload["verdict"]["missing_inputs"] == payload["missing_inputs"]


@pytest.mark.parametrize("known_time", ("00:00", "12:00"))
def test_compatibility_explicit_clock_times_remain_known(known_time):
    complete = _compat_body(partner_birth_time="09:15", partner_birth_time_known=True)
    explicit = _compat_body(partner_birth_time=known_time, partner_birth_time_known=True)
    with _compat_client() as client:
        complete_res = client.post("/api/vault/compatibility", json=complete)
        explicit_res = client.post("/api/vault/compatibility", json=explicit)
    assert complete_res.status_code == 200, complete_res.text
    assert explicit_res.status_code == 200, explicit_res.text
    complete_payload = complete_res.json()
    explicit_payload = explicit_res.json()
    assert complete_payload["overall_score"] is not None
    assert explicit_payload["overall_score"] is not None
    assert "partner_birth_time" not in explicit_payload["missing_inputs"]
    assert explicit_payload["reading"]["data_completeness"] == "supplied_unverified"
    if known_time == "00:00":
        assert explicit_payload["overall_score"] != complete_payload["overall_score"] or (
            explicit_payload["dimensions"] != complete_payload["dimensions"]
        )
