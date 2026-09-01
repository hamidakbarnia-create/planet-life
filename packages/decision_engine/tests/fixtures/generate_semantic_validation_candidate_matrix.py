"""Phase 2C.2 side-by-side corpus: current 2C vs candidate classifier."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from packages.decision_engine.dimension_classification import (
    CLASSIFIER_VERSION,
    classify_from_dimensions,
)
from packages.decision_engine.dimension_classification_candidate import (
    CANDIDATE_CLASSIFIER_VERSION,
    classify_from_dimensions_candidate,
)
from packages.decision_engine.tests.fixtures.generate_semantic_validation_matrix import (
    _PHASE2A_PLACEHOLDER,
    load_case_dimensions,
)
from packages.decision_engine.tests.fixtures.semantic_validation_corpus import (
    EXTENDED_CORPUS,
    CorpusCase,
)

MATRIX_PATH = (
    Path(__file__).resolve().parent / "semantic_validation_candidate_matrix.json"
)

FOCUS_CASE_IDS = (
    "HL03_one_drive_80_other_mid_50",
    "AC03_lukewarm_criticals_counted_as_coverage",
    "RV03_split_without_strong_drive",
    "MX02_critical_conflict_preempts_split",
    "MX04_cooperation_conflict_ignored",
    "BD01_clarity_46_not_veto",
)


def _matches_product(case: CorpusCase, result) -> bool:
    return (
        result.day_class == case.expected_class
        and result.split_signal == case.expected_split_signal
        and result.same_dimension_conflict == case.expected_same_dimension_conflict
        and tuple(result.veto_dimension_ids) == case.expected_veto_dimensions
    )


def _reason_changed(case: CorpusCase, current, candidate) -> str:
    if (
        current.day_class == candidate.day_class
        and current.split_signal == candidate.split_signal
        and current.same_dimension_conflict == candidate.same_dimension_conflict
        and current.veto_dimension_ids == candidate.veto_dimension_ids
        and current.rule_id == candidate.rule_id
    ):
        return ""
    bits: list[str] = []
    if current.day_class != candidate.day_class:
        bits.append(f"class {current.day_class}->{candidate.day_class}")
    if current.rule_id != candidate.rule_id:
        bits.append(f"rule {current.rule_id}->{candidate.rule_id}")
    if current.split_signal != candidate.split_signal:
        bits.append(f"split {current.split_signal}->{candidate.split_signal}")
    if current.same_dimension_conflict != candidate.same_dimension_conflict:
        bits.append(
            f"conflict {current.same_dimension_conflict}->"
            f"{candidate.same_dimension_conflict}"
        )
    if case.case_id == "HL03_one_drive_80_other_mid_50":
        bits.append("single drive>=80 no longer qualifies as high_leverage")
    elif case.case_id == "AC03_lukewarm_criticals_counted_as_coverage":
        bits.append("critical quality floor 55 blocks lukewarm 46/46 coverage")
    elif case.case_id == "RV03_split_without_strong_drive":
        bits.append("drive HIGH + veto is selective without drive_strong")
    elif case.case_id == "MX02_critical_conflict_preempts_split":
        bits.append("split preempts mixed; conflict remains metadata")
    elif case.case_id == "BD01_clarity_46_not_veto":
        bits.append("clarity 46 is not a quality critical (>=55)")
    elif case.case_id.startswith("BUILD03"):
        bits.append("sparse HIGH cooperation is not BUILD")
    return "; ".join(bits)


def evaluate_extended_corpus() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for case in EXTENDED_CORPUS:
        dimensions, score = load_case_dimensions(case)
        current = classify_from_dimensions(
            dimensions,
            phase2a_class=_PHASE2A_PLACEHOLDER,
            executive_score=score,
        )
        candidate = classify_from_dimensions_candidate(
            dimensions,
            phase2a_class=_PHASE2A_PLACEHOLDER,
            executive_score=score,
        )
        rows.append(
            {
                "case_id": case.case_id,
                "family": case.family,
                "intent": case.intent,
                "product_expected": case.expected_class,
                "phase2c_current": current.day_class,
                "phase2c_candidate": candidate.day_class,
                "current_pass": _matches_product(case, current),
                "candidate_pass": _matches_product(case, candidate),
                "reason_changed": _reason_changed(case, current, candidate),
                "current_rule_id": current.rule_id,
                "candidate_rule_id": candidate.rule_id,
                "coverage": candidate.classification_coverage,
                "split": candidate.split_signal,
                "conflict": candidate.same_dimension_conflict,
                "vetoes": list(candidate.veto_dimension_ids),
                "conflicted_dimension_ids": list(candidate.conflicted_dimension_ids),
                "expected_split": case.expected_split_signal,
                "expected_conflict": case.expected_same_dimension_conflict,
                "expected_vetoes": list(case.expected_veto_dimensions),
                "executive_score_input": candidate.executive_score,
                "focus": case.case_id in FOCUS_CASE_IDS,
            }
        )
    return rows


def write_candidate_matrix(path: Path | None = None) -> Path:
    target = path or MATRIX_PATH
    rows = evaluate_extended_corpus()
    original = [row for row in rows if not row["case_id"].startswith("BUILD")]
    payload = {
        "current_classifier_version": CLASSIFIER_VERSION,
        "candidate_classifier_version": CANDIDATE_CLASSIFIER_VERSION,
        "semantic_status": "experimental_shadow",
        "corpus_size": len(rows),
        "original_corpus_size": len(original),
        "current_pass_count": sum(1 for row in original if row["current_pass"]),
        "candidate_pass_count": sum(1 for row in rows if row["candidate_pass"]),
        "candidate_pass_count_original_32": sum(
            1 for row in original if row["candidate_pass"]
        ),
        "current_pass_count_extended": sum(1 for row in rows if row["current_pass"]),
        "rows": rows,
    }
    target.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    return target


if __name__ == "__main__":
    path = write_candidate_matrix()
    payload = json.loads(path.read_text())
    print(
        f"original32 current {payload['current_pass_count']}/"
        f"{payload['original_corpus_size']}  "
        f"candidate {payload['candidate_pass_count_original_32']}/"
        f"{payload['original_corpus_size']}"
    )
    print(
        f"extended candidate {payload['candidate_pass_count']}/"
        f"{payload['corpus_size']}"
    )
    print(path)
    print(
        "case_id | product_expected | phase2c_current | "
        "phase2c_candidate | candidate_pass | reason_changed"
    )
    for row in payload["rows"]:
        print(
            f"{row['case_id']} | {row['product_expected']} | "
            f"{row['phase2c_current']} | {row['phase2c_candidate']} | "
            f"{row['candidate_pass']} | {row['reason_changed']}"
        )
