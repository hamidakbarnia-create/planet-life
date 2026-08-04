"""Fixtures for Decision Case migration tests."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterator

import pytest

API_ROOT = Path(__file__).resolve().parents[3]
REPO_ROOT = Path(__file__).resolve().parents[4]
SRC = API_ROOT / "src"
TESTS = API_ROOT / "tests"
for path in (str(TESTS), str(REPO_ROOT), str(SRC)):
    if path not in sys.path:
        sys.path.insert(0, path)

from identity_domain.conftest import _start_embedded_identity_database  # noqa: E402
from identity_domain.harness import (  # noqa: E402
    assert_isolated_database_name,
    get_identity_test_database_url,
    parse_database_name,
)

pytestmark = pytest.mark.identity_db


@pytest.fixture(scope="session")
def identity_database_url() -> Iterator[str]:
    url = get_identity_test_database_url()
    server = None
    if url:
        assert_isolated_database_name(parse_database_name(url))
    else:
        url, server = _start_embedded_identity_database()
        assert_isolated_database_name(parse_database_name(url))
    yield url
    _ = server
