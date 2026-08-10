"""Visibility Family FIND runtime.

Family guard + binding to the shared FIND executor. Type activation remains
owned by VisibilityTypeFindConfig allowlisting. family_id alone never
activates a type.
"""

from __future__ import annotations

from datetime import datetime
from typing import Mapping
from uuid import UUID

from packages.decision_engine.evaluate.find_runtime_common import (
    GenerateOutcomeFn,
    assemble_find_package,
    build_insufficient_natal_find_package,
    execute_find,
)
from packages.decision_engine.evaluate.type_visibility_find_config import (
    VisibilityTypeFindConfig,
)
from packages.decision_engine.package_models import DecisionEvaluationPackage


def find_visibility(
    config: VisibilityTypeFindConfig,
    *,
    case_id: UUID | str,
    case_version: int,
    intake: Mapping[str, object],
    generate_outcome: GenerateOutcomeFn,
    evaluation_id: UUID | str | None = None,
    created_at: datetime | None = None,
) -> DecisionEvaluationPackage:
    """Visibility Family FIND entrypoint for an allowlisted type config."""
    if config.family_id != "visibility":
        raise ValueError(
            "find_visibility requires family_id='visibility'; "
            f"got {config.family_id!r}"
        )
    return execute_find(
        config,
        case_id=case_id,
        case_version=case_version,
        intake=intake,
        generate_outcome=generate_outcome,
        action_type_config_label="VisibilityTypeFindConfig.action_type",
        evaluation_id=evaluation_id,
        created_at=created_at,
    )


__all__ = [
    "assemble_find_package",
    "build_insufficient_natal_find_package",
    "find_visibility",
]
