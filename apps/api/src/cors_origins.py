"""CORS origin resolution for production-safe defaults and staging overrides.

When ``CORS_ALLOWED_ORIGINS`` is unset, the historical hard-coded production
allowlist is used unchanged (including local development origins).

When ``CORS_ALLOWED_ORIGINS`` is set (comma-separated), that list replaces the
default. Staging Railway services must set this explicitly.

Wildcard ``*`` is rejected because credentials are enabled.
"""

from __future__ import annotations

import os
from collections.abc import Mapping

# Historical production allowlist — keep byte-stable when env override is absent.
DEFAULT_CORS_ALLOWED_ORIGINS: tuple[str, ...] = (
    "http://localhost:3000",
    "http://localhost:3001",
    "https://metioro.com",
    "https://www.metioro.com",
    "https://planet-life-web.planet-life.workers.dev",
)


def resolve_cors_allowed_origins(
    env: Mapping[str, str] | None = None,
) -> list[str]:
    """Return the active CORS allowlist.

    Raises:
        ValueError: when an explicit override is empty or contains ``*``.
    """
    source: Mapping[str, str] = os.environ if env is None else env
    raw = str(source.get("CORS_ALLOWED_ORIGINS", "") or "").strip()
    if not raw:
        return list(DEFAULT_CORS_ALLOWED_ORIGINS)

    origins = [part.strip() for part in raw.split(",") if part.strip()]
    if not origins:
        raise ValueError("CORS_ALLOWED_ORIGINS is set but contains no origins")
    if "*" in origins:
        raise ValueError(
            "CORS_ALLOWED_ORIGINS must not include wildcard '*' when credentials are enabled"
        )
    return origins


def validate_staging_cors_configuration(
    env: Mapping[str, str] | None = None,
) -> None:
    """Fail fast when APP_ENV=staging lacks an explicit CORS allowlist."""
    source: Mapping[str, str] = os.environ if env is None else env
    app_env = str(source.get("APP_ENV", "") or "").strip().lower()
    if app_env != "staging":
        return
    raw = str(source.get("CORS_ALLOWED_ORIGINS", "") or "").strip()
    if not raw:
        raise RuntimeError(
            "CORS_ALLOWED_ORIGINS is required when APP_ENV=staging"
        )
    # Ensure the override parses and rejects wildcards.
    _ = resolve_cors_allowed_origins(source)
