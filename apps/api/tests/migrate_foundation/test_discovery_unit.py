"""Unit tests for migration discovery (no database)."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[2] / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from db_migrate.checksums import sha256_bytes, sha256_file
from db_migrate.discovery import discover_migrations
from db_migrate.errors import MigrationError


def test_ordering_is_numeric_not_lexicographic(tmp_path: Path) -> None:
    (tmp_path / "0002__two.sql").write_text("SELECT 2;\n", encoding="utf-8")
    (tmp_path / "00010__ten.sql").write_text("SELECT 10;\n", encoding="utf-8")
    (tmp_path / "0001__one.sql").write_text("SELECT 1;\n", encoding="utf-8")

    found = discover_migrations(tmp_path)
    assert [m.version_int for m in found] == [1, 2, 10]
    assert [m.filename for m in found] == [
        "0001__one.sql",
        "0002__two.sql",
        "00010__ten.sql",
    ]


def test_duplicate_versions_fail_closed(tmp_path: Path) -> None:
    (tmp_path / "0001__a.sql").write_text("SELECT 1;\n", encoding="utf-8")
    (tmp_path / "001__b.sql").write_text("SELECT 2;\n", encoding="utf-8")

    with pytest.raises(MigrationError, match="Duplicate migration version"):
        discover_migrations(tmp_path)


def test_invalid_filename_rejected(tmp_path: Path) -> None:
    (tmp_path / "v1_users.sql").write_text("SELECT 1;\n", encoding="utf-8")
    with pytest.raises(MigrationError, match="Invalid migration filename"):
        discover_migrations(tmp_path)


def test_checksum_is_sha256_of_exact_bytes(tmp_path: Path) -> None:
    path = tmp_path / "0001__probe.sql"
    data = b"SELECT 1;\n"
    path.write_bytes(data)
    assert sha256_file(path) == sha256_bytes(data)
