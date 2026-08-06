"""Ensure API startup does not silently run migrations."""

from __future__ import annotations

from pathlib import Path


def test_main_lifespan_does_not_reference_db_migrate() -> None:
    main_path = Path(__file__).resolve().parents[2] / "src" / "main.py"
    text = main_path.read_text(encoding="utf-8")
    assert "db_migrate" not in text
    assert "apply_migrations" not in text
