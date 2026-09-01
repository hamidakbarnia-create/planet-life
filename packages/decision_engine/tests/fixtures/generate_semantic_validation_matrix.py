"""Run the Phase 2C.1 semantic validation corpus against the shadow classifier."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable

from packages.astro_engine.scoring import calculate_activity_score
from packages.decision_engine.day_intelligence_models import (
    build_day_intelligence_snapshot,
)
from packages.decision_engine.dimension_classification import (
    classify_from_dimensions,
)
from packages.decision_engine.tests.fixtures.calendar_score_cases import (
    case_action_type_business_launch,
    case_action_type_rest_recovery,
)
from packages.decision_engine.tests.fixtures.semantic_validation_corpus import (
    CORPUS,
    CorpusCase,
    materialize_dimensions,
)

MATRIX_PATH = Path(__file__).resolve().parent / "semantic_validation_matrix.json"

LIVE_CASE_BUILDERS: dict[str, Callable[[], dict[str, Any]]] = {
    "case_action_type_business_launch": case_action_type_business_launch,
    "case_action_type_rest_recovery": case_action_type_rest_recovery,
}

# Dummy 2A label: never used to choose the 2C class.
_PHASE2A_PLACEHOLDER = "mixed"


def _executive_score_for(case: CorpusCase) -> int:
    return 10 if case.case_id.startswith("RC02") else 0


def load_case_dimensions(case: CorpusCase):
    """Dimensions + dummy score. Score never chooses the class."""
    score = _executive_score_for(case)
    if case.source == "live":
        assert case.live_builder is not None
        live = LIVE_CASE_BUILDERS[case.live_builder]()
        result = calculate_activity_score(
            live["natal"],
            live["transit"],
            live["action_type"],
            scoring_context=live["scoring_context"],
        )
        snapshot = build_day_intelligence_snapshot(
            result,
            natal=live["natal"],
            transit=live["transit"],
            activity_type=live["action_type"],
            scoring_context=live["scoring_context"],
        )
        # Live executive_score is passthrough metadata only; class still
        # comes from dimensions. Preserve the snapshot score so the 2C.1
        # matrix stays stable.
        return snapshot.dimensions, snapshot.final_score
    dimensions = materialize_dimensions(
        case.dimensions,
        action_type="corpus",
    )
    return dimensions, score


def _classify_case(case: CorpusCase):
    dimensions, score = load_case_dimensions(case)
    return classify_from_dimensions(
        dimensions,
        phase2a_class=_PHASE2A_PLACEHOLDER,
        executive_score=score,
    )


def evaluate_corpus() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for case in CORPUS:
        actual = _classify_case(case)
        passed = (
            actual.day_class == case.expected_class
            and actual.split_signal == case.expected_split_signal
            and actual.same_dimension_conflict
            == case.expected_same_dimension_conflict
            and tuple(actual.veto_dimension_ids) == case.expected_veto_dimensions
        )
        rows.append(
            {
                "case_id": case.case_id,
                "family": case.family,
                "intent": case.intent,
                "expected": case.expected_class,
                "actual": actual.day_class,
                "coverage": actual.classification_coverage,
                "split": actual.split_signal,
                "conflict": actual.same_dimension_conflict,
                "vetoes": list(actual.veto_dimension_ids),
                "expected_split": case.expected_split_signal,
                "expected_conflict": case.expected_same_dimension_conflict,
                "expected_vetoes": list(case.expected_veto_dimensions),
                "rule_id": actual.rule_id,
                "classifier_divergence": case.classifier_divergence,
                "pass": passed,
                "executive_score_input": actual.executive_score,
            }
        )
    return rows


def write_matrix(path: Path | None = None) -> Path:
    target = path or MATRIX_PATH
    rows = evaluate_corpus()
    payload = {
        "classifier_version": "dimension_class.v1-shadow",
        "semantic_status": "experimental_shadow",
        "corpus_size": len(rows),
        "pass_count": sum(1 for row in rows if row["pass"]),
        "fail_count": sum(1 for row in rows if not row["pass"]),
        "rows": rows,
    }
    target.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    return target


if __name__ == "__main__":
    path = write_matrix()
    payload = json.loads(path.read_text())
    print(
        f"{payload['pass_count']}/{payload['corpus_size']} pass  "
        f"{payload['fail_count']} fail"
    )
    print(path)
    print("case_id | expected | actual | coverage | split | conflict | vetoes | pass")
    for row in payload["rows"]:
        print(
            f"{row['case_id']} | {row['expected']} | {row['actual']} | "
            f"{row['coverage']} | {row['split']} | {row['conflict']} | "
            f"{row['vetoes']} | {row['pass']}"
        )
