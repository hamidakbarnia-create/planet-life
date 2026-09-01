"""Phase 2C.3 side-by-side corpus: v1 current vs v2 candidate vs v3 proposed."""

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
from packages.decision_engine.dimension_classification_proposed import (
    ACTIVE_SHADOW_CLASSIFIER_VERSION,
    classify_from_dimensions_proposed,
)
from packages.decision_engine.tests.fixtures.generate_semantic_validation_candidate_matrix import (
    _matches_product,
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
    Path(__file__).resolve().parent / "semantic_validation_proposed_matrix.json"
)

FOCUS_CASE_IDS = (
    "HL01_covered_strong_drive",
    "HL02_drive_exactly_65",
    "HL03_one_drive_80_other_mid_50",
    "AC03_lukewarm_criticals_counted_as_coverage",
    "RV03_split_without_strong_drive",
    "MX02_critical_conflict_preempts_split",
    "MX04_cooperation_conflict_ignored",
    "BD01_clarity_46_not_veto",
    "BD02_pressure_64_not_veto",
    "BD03_drive_80_vs_79_with_mid_momentum",
    "BUILD01_constructive_drive_covered_support",
    "BUILD02_drive_64_just_below_action",
    "BUILD03_sparse_cooperation_high_is_not_build",
    "BUILD04_covered_mids_without_support_high",
)


def _reason_v2_to_v3(case: CorpusCase, candidate, proposed) -> str:
    if (
        candidate.day_class == proposed.day_class
        and candidate.split_signal == proposed.split_signal
        and candidate.same_dimension_conflict == proposed.same_dimension_conflict
        and candidate.veto_dimension_ids == proposed.veto_dimension_ids
        and candidate.rule_id == proposed.rule_id
    ):
        return ""
    bits: list[str] = []
    if candidate.day_class != proposed.day_class:
        bits.append(f"class {candidate.day_class}->{proposed.day_class}")
    if candidate.rule_id != proposed.rule_id:
        bits.append(f"rule {candidate.rule_id}->{proposed.rule_id}")
    if case.case_id == "BD01_clarity_46_not_veto":
        bits.append("removed 55 floor; one forward critical >=65 is enough")
    elif case.case_id == "AC03_lukewarm_criticals_counted_as_coverage":
        bits.append("no forward critical >=65 so still action")
    return "; ".join(bits)


def evaluate_proposed_corpus() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for case in EXTENDED_CORPUS:
        dimensions, score = load_case_dimensions(case)
        kwargs = {
            "phase2a_class": _PHASE2A_PLACEHOLDER,
            "executive_score": score,
        }
        current = classify_from_dimensions(dimensions, **kwargs)
        candidate = classify_from_dimensions_candidate(dimensions, **kwargs)
        proposed = classify_from_dimensions_proposed(dimensions, **kwargs)
        rows.append(
            {
                "case_id": case.case_id,
                "family": case.family,
                "intent": case.intent,
                "product_expected": case.expected_class,
                "phase2c_v1": current.day_class,
                "phase2c_v2": candidate.day_class,
                "phase2c_v3": proposed.day_class,
                "v1_pass": _matches_product(case, current),
                "v2_pass": _matches_product(case, candidate),
                "v3_pass": _matches_product(case, proposed),
                "reason_v2_to_v3": _reason_v2_to_v3(case, candidate, proposed),
                "v1_rule_id": current.rule_id,
                "v2_rule_id": candidate.rule_id,
                "v3_rule_id": proposed.rule_id,
                "coverage": proposed.classification_coverage,
                "split": proposed.split_signal,
                "conflict": proposed.same_dimension_conflict,
                "vetoes": list(proposed.veto_dimension_ids),
                "conflicted_dimension_ids": list(proposed.conflicted_dimension_ids),
                "expected_split": case.expected_split_signal,
                "expected_conflict": case.expected_same_dimension_conflict,
                "expected_vetoes": list(case.expected_veto_dimensions),
                "executive_score_input": proposed.executive_score,
                "focus": case.case_id in FOCUS_CASE_IDS,
            }
        )
    return rows


def write_proposed_matrix(path: Path | None = None) -> Path:
    target = path or MATRIX_PATH
    rows = evaluate_proposed_corpus()
    original = [row for row in rows if not row["case_id"].startswith("BUILD")]
    payload = {
        "v1_classifier_version": CLASSIFIER_VERSION,
        "v2_classifier_version": CANDIDATE_CLASSIFIER_VERSION,
        "v3_classifier_version": ACTIVE_SHADOW_CLASSIFIER_VERSION,
        "semantic_status": "experimental_shadow",
        "corpus_size": len(rows),
        "original_corpus_size": len(original),
        "v1_pass_count_original_32": sum(1 for row in original if row["v1_pass"]),
        "v2_pass_count_original_32": sum(1 for row in original if row["v2_pass"]),
        "v3_pass_count_original_32": sum(1 for row in original if row["v3_pass"]),
        "v1_pass_count_extended": sum(1 for row in rows if row["v1_pass"]),
        "v2_pass_count_extended": sum(1 for row in rows if row["v2_pass"]),
        "v3_pass_count_extended": sum(1 for row in rows if row["v3_pass"]),
        "rows": rows,
    }
    target.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    return target


if __name__ == "__main__":
    path = write_proposed_matrix()
    payload = json.loads(path.read_text())
    print(
        f"original32  v1 {payload['v1_pass_count_original_32']}/"
        f"{payload['original_corpus_size']}  "
        f"v2 {payload['v2_pass_count_original_32']}/"
        f"{payload['original_corpus_size']}  "
        f"v3 {payload['v3_pass_count_original_32']}/"
        f"{payload['original_corpus_size']}"
    )
    print(
        f"extended    v1 {payload['v1_pass_count_extended']}/"
        f"{payload['corpus_size']}  "
        f"v2 {payload['v2_pass_count_extended']}/"
        f"{payload['corpus_size']}  "
        f"v3 {payload['v3_pass_count_extended']}/"
        f"{payload['corpus_size']}"
    )
    print(path)
    print(
        "case_id | product_expected | v1 | v2 | v3 | v3_pass | reason_v2_to_v3"
    )
    for row in payload["rows"]:
        print(
            f"{row['case_id']} | {row['product_expected']} | "
            f"{row['phase2c_v1']} | {row['phase2c_v2']} | "
            f"{row['phase2c_v3']} | {row['v3_pass']} | "
            f"{row['reason_v2_to_v3']}"
        )
