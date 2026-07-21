"""CORS origin resolution and staging validation."""

from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from cors_origins import (
    DEFAULT_CORS_ALLOWED_ORIGINS,
    resolve_cors_allowed_origins,
    validate_staging_cors_configuration,
)


def test_default_origins_match_historical_allowlist() -> None:
    origins = resolve_cors_allowed_origins({})
    assert origins == list(DEFAULT_CORS_ALLOWED_ORIGINS)
    assert "https://metioro.com" in origins
    assert "https://staging.metioro.com" not in origins


def test_explicit_override_replaces_defaults() -> None:
    origins = resolve_cors_allowed_origins(
        {
            "CORS_ALLOWED_ORIGINS": (
                "https://staging.metioro.com,"
                "https://planet-life-web-staging.example.workers.dev"
            )
        }
    )
    assert origins == [
        "https://staging.metioro.com",
        "https://planet-life-web-staging.example.workers.dev",
    ]


def test_wildcard_rejected() -> None:
    with pytest.raises(ValueError, match="wildcard"):
        resolve_cors_allowed_origins({"CORS_ALLOWED_ORIGINS": "*"})


def test_empty_override_rejected() -> None:
    with pytest.raises(ValueError, match="no origins"):
        resolve_cors_allowed_origins({"CORS_ALLOWED_ORIGINS": " , , "})


def test_staging_requires_explicit_cors() -> None:
    with pytest.raises(RuntimeError, match="CORS_ALLOWED_ORIGINS"):
        validate_staging_cors_configuration({"APP_ENV": "staging"})


def test_staging_accepts_explicit_cors() -> None:
    validate_staging_cors_configuration(
        {
            "APP_ENV": "staging",
            "CORS_ALLOWED_ORIGINS": "https://staging.metioro.com",
        }
    )


def test_non_staging_does_not_require_override() -> None:
    validate_staging_cors_configuration({"APP_ENV": "production"})
    validate_staging_cors_configuration({})
