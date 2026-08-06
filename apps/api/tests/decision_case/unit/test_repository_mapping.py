"""Unit / purity checks for Decision Case repository module."""

from __future__ import annotations

import ast
from pathlib import Path

from decision_case.repository.models import CaseRecord
from packages.decision_engine.state_machine import CaseState


def test_case_record_maps_prior_active_state_field() -> None:
    # Field exists on DTO; DB column is paused_prior_state (mapped in postgres).
    assert "prior_active_state" in CaseRecord.__dataclass_fields__


def test_repository_has_no_forbidden_imports() -> None:
    root = Path(__file__).resolve().parents[3] / "src" / "decision_case" / "repository"
    forbidden = ("fastapi", "httpx", "openai", "flask", "django", "apps.web")
    for path in root.glob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    assert not any(alias.name.startswith(p) for p in forbidden)
            if isinstance(node, ast.ImportFrom) and node.module:
                assert not any(node.module.startswith(p) for p in forbidden)


def test_no_second_state_enum_in_repository() -> None:
    text = (
        Path(__file__).resolve().parents[3]
        / "src"
        / "decision_case"
        / "repository"
        / "postgres.py"
    ).read_text(encoding="utf-8")
    assert "class CaseState" not in text
    assert "from packages.decision_engine.state_machine import" in text
    assert CaseState.DRAFT.value == "draft"
