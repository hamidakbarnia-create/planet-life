"""Pytest fixtures for the EPIC-01 identity-domain harness."""

from __future__ import annotations

from typing import Iterator

import pytest

from .harness import (
    IDENTITY_TEST_DATABASE_URL_ENV,
    IdentityHarnessSession,
    get_identity_test_database_url,
    identity_harness_session,
)


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "identity_db: requires METIORO_IDENTITY_TEST_DATABASE_URL PostgreSQL",
    )


@pytest.fixture(scope="session")
def identity_database_url() -> str:
    url = get_identity_test_database_url()
    if not url:
        pytest.skip(
            f"{IDENTITY_TEST_DATABASE_URL_ENV} unset; skipping identity DB harness tests"
        )
    return url


@pytest.fixture()
def identity_db(identity_database_url: str) -> Iterator[IdentityHarnessSession]:
    with identity_harness_session(identity_database_url) as session:
        yield session
