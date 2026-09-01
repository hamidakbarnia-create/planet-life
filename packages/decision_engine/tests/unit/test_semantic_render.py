"""Phase 3F1 — semantic localization catalog and deterministic renderer."""

from __future__ import annotations

import inspect
import re

import pytest

from packages.decision_engine.compare_dates import (
    ScoredCompareOption,
    rank_compare_options,
)
from packages.decision_engine.i18n.catalog import (
    REQUIRED_SLOTS,
    SUPPORTED_LOCALES,
    assert_catalog_covers_emitted_codes,
    catalog_messages,
    emitted_semantic_codes,
    load_catalog,
    posture_term,
    required_slots,
    template_for,
)
from packages.decision_engine.semantic_explanation import (
    CODE_INSUFFICIENT,
    CODE_MATERIAL_TRADEOFF,
    CODE_NO_OUTCOME_PREDICTION,
    SemanticExplanation,
    explain_assessment,
    explain_compare_pair,
    explain_find_window,
)
from packages.decision_engine.semantic_policy import compare_pair_policy
from packages.decision_engine.semantic_render import (
    UNAVAILABLE_MISSING_ARGS,
    UNAVAILABLE_UNSUPPORTED_LOCALE,
    SemanticRenderError,
    interpolate,
    render_semantic_explanation,
)
from packages.decision_engine.tests.unit.test_semantic_explanation import _assessment

_SLOT_RE = re.compile(r"\{([a-z][a-z0-9_]*)\}")

FORBIDDEN_COPY = (
    "probab",
    "chance",
    "luck",
    "destin",
    "guarant",
    "100%",
    "perfect day",
    "universe wants",
    "definitely better",
    "semantic_shadow",
    "classifier",
    "evidence_strength",
    "classification_coverage",
    "experimental_shadow",
)

INTERNAL_LEAKS = (
    "semantic_shadow",
    "classifier",
    "evidence_strength",
    "classification_coverage",
    "dimension_class.v3",
)

POSTURE_IDS = (
    "high_leverage",
    "action",
    "build",
    "selective",
    "review",
    "defensive",
    "recovery",
    "mixed",
    "insufficient",
)

COMPARE_CONTEXT = {
    "option_labels": {"a": "Option A", "b": "Option B"},
}

EN_GOLDENS = {
    "strong_clean_headline": "Strong timing with supportive execution conditions.",
    "action_posture": "Conditions support moving forward.",
    "build_posture": "Good for steady progress and preparation.",
    "selective_posture": "Opportunity is present, but act selectively.",
    "review_headline": "Better suited to review and refinement than a major push.",
    "defensive_posture": "Protect position and reduce avoidable risk.",
    "recovery_posture": "Favor recovery, consolidation, and lower-pressure progress.",
    "mixed_headline": "Signals conflict. This day is not uniformly favorable or unfavorable.",
    "insufficient_headline": "Not enough evidence for a reliable decision posture.",
    "high_leverage_posture": "Strong timing with supportive execution conditions.",
    "material_tradeoff": (
        "Option A has stronger timing, while Option B offers cleaner execution. "
        "This is a trade-off rather than a clear winner."
    ),
    "near_tie": "Timing strength is very close. Execution conditions favor Option B.",
    "no_outcome": "Timing signals cannot determine the factual outcome.",
    "high_stakes": (
        "Use timing as a planning aid. Verify the decision against real-world "
        "evidence and professional requirements."
    ),
    "deadline": "Do not delay a factual deadline because of timing signals.",
    "low_clarity": "Information quality or decision clarity is weaker.",
    "window_mixed": "This window mixes forward and more restrictive days.",
    "window_mixed_summary": "High-score window contains both forward and restrictive days.",
}

SAFETY_GOLDENS = {
    "en": {
        "no_outcome": "Timing signals cannot determine the factual outcome.",
        "high_stakes": (
            "Use timing as a planning aid. Verify the decision against real-world "
            "evidence and professional requirements."
        ),
        "deadline": "Do not delay a factual deadline because of timing signals.",
    },
    "fa": {
        "no_outcome": "سیگنال‌های زمان‌بندی نتیجهٔ واقعی را تعیین نمی‌کنند.",
        "high_stakes": "زمان‌بندی را ابزار برنامه‌ریزی بدانید. تصمیم را با شواهد واقعی و الزامات حرفه‌ای بسنجید.",
        "deadline": "مهلت واقعی را به‌خاطر سیگنال‌های زمان‌بندی عقب نیندازید.",
    },
    "ar": {
        "no_outcome": "إشارات التوقيت لا تحدّد النتيجة الواقعية.",
        "high_stakes": "استخدم التوقيت كأداة تخطيط. تحقق من القرار وفق الأدلة الواقعية والمتطلبات المهنية.",
        "deadline": "لا تؤجّل مهلة واقعية بسبب إشارات التوقيت.",
    },
    "ru": {
        "no_outcome": "Временные сигналы не определяют фактический исход.",
        "high_stakes": "Используйте время как помощь в планировании. Сверяйте решение с реальными данными и профессиональными требованиями.",
        "deadline": "Не откладывайте фактический срок из‑за временных сигналов.",
    },
}

TRADEOFF_GOLDENS = {
    "en": "Option A has stronger timing, while Option B offers cleaner execution. This is a trade-off rather than a clear winner.",
    "fa": "Option A زمان‌بندی قوی‌تری دارد و Option B شرایط اجرای پاک‌تری دارد. این بده‌بستان است، نه انتخاب قطعی.",
    "ar": "Option A أقوى من حيث التوقيت، و Option B يوفّر شروط تنفيذ أنظف. هذه مقايضة وليست تفضيلاً قاطعاً.",
    "ru": "У Option A сильнее временные условия, а у Option B чище исполнение. Это компромисс, а не однозначный выбор.",
}


def _dummy_slots(code: str) -> dict[str, str]:
    return {name: f"[{name}]" for name in required_slots(code)}


def _copy_blob(rendered) -> str:
    parts = [
        rendered.headline,
        rendered.summary,
        rendered.opportunity,
        rendered.posture,
        rendered.tradeoff,
        *rendered.supports,
        *rendered.cautions,
        *rendered.safety,
    ]
    return "\n".join(item for item in parts if item)


def test_catalog_covers_every_emitted_code_in_all_locales() -> None:
    assert_catalog_covers_emitted_codes()
    codes = emitted_semantic_codes()
    assert len(codes) >= 50
    for locale in SUPPORTED_LOCALES:
        messages = catalog_messages(locale)
        for code in codes:
            text = interpolate(template_for(locale, code), _dummy_slots(code))
            assert text.strip(), code
            assert "{" not in text, (locale, code, text)
            assert "}" not in text, (locale, code, text)


def test_placeholders_match_required_slots_across_locales() -> None:
    codes = emitted_semantic_codes()
    for code in codes:
        expected = tuple(required_slots(code))
        for locale in SUPPORTED_LOCALES:
            found = tuple(_SLOT_RE.findall(template_for(locale, code)))
            assert found == expected, (locale, code, found, expected)


def test_no_english_fallback_for_supported_locales() -> None:
    codes = emitted_semantic_codes()
    en = catalog_messages("en")
    for locale in ("fa", "ar", "ru"):
        other = catalog_messages(locale)
        for code in codes:
            assert other[code] != en[code], (locale, code)


def test_catalog_copy_has_no_probability_or_internal_terms() -> None:
    for locale in SUPPORTED_LOCALES:
        catalog = load_catalog(locale)
        blob = " ".join(
            [
                *catalog["messages"].values(),
                *catalog["posture_terms"].values(),
            ]
        ).lower()
        for needle in (*FORBIDDEN_COPY, *INTERNAL_LEAKS):
            assert needle not in blob, (locale, needle)
        assert "neutral" not in catalog["messages"][CODE_INSUFFICIENT].lower()


def test_en_destiny_not_in_copy() -> None:
    blob = " ".join(catalog_messages("en").values()).lower()
    assert "destiny" not in blob
    assert "destined" not in blob


def test_render_is_deterministic() -> None:
    expl = explain_assessment(_assessment(80, "action"))
    first = render_semantic_explanation(expl, "en")
    second = render_semantic_explanation(expl, "en")
    assert first == second


def test_single_assessment_en_goldens() -> None:
    cases = [
        (80, "high_leverage", "headline", EN_GOLDENS["strong_clean_headline"]),
        (80, "high_leverage", "posture", EN_GOLDENS["high_leverage_posture"]),
        (80, "action", "posture", EN_GOLDENS["action_posture"]),
        (70, "build", "posture", EN_GOLDENS["build_posture"]),
        (81, "selective", "posture", EN_GOLDENS["selective_posture"]),
        (70, "review", "headline", EN_GOLDENS["review_headline"]),
        (40, "defensive", "posture", EN_GOLDENS["defensive_posture"]),
        (40, "recovery", "posture", EN_GOLDENS["recovery_posture"]),
        (70, "mixed", "headline", EN_GOLDENS["mixed_headline"]),
        (70, "insufficient", "headline", EN_GOLDENS["insufficient_headline"]),
    ]
    for score, posture, field, expected in cases:
        rendered = render_semantic_explanation(
            explain_assessment(_assessment(score, posture)), "en"
        )
        assert rendered.status == "ok"
        assert getattr(rendered, field) == expected


def test_insufficient_is_not_neutral_in_any_locale() -> None:
    expl = explain_assessment(_assessment(70, "insufficient"))
    for locale in SUPPORTED_LOCALES:
        rendered = render_semantic_explanation(expl, locale)
        blob = _copy_blob(rendered).lower()
        assert "neutral" not in blob
        assert "خنث" not in blob
        assert "محايد" not in blob
        assert "нейтрал" not in blob
        assert rendered.headline
        assert rendered.headline != render_semantic_explanation(
            explain_assessment(_assessment(80, "action")), locale
        ).headline


def test_material_tradeoff_copy_all_locales() -> None:
    left = {"id": "a", "score": 81, "dimension_class": "selective"}
    right = {"id": "b", "score": 70, "dimension_class": "action"}
    policy = compare_pair_policy(left, right, left_id="a", right_id="b")
    expl = explain_compare_pair(left, right, policy.model_dump(mode="json"))
    assert expl.headline_code == CODE_MATERIAL_TRADEOFF
    rendered = {
        locale: render_semantic_explanation(expl, locale, COMPARE_CONTEXT)
        for locale in SUPPORTED_LOCALES
    }
    en = rendered["en"]
    assert en.headline == TRADEOFF_GOLDENS["en"]
    assert en.tradeoff == "This is a trade-off rather than a clear winner."
    for locale, item in rendered.items():
        assert item.headline == TRADEOFF_GOLDENS[locale]
    for locale, item in rendered.items():
        blob = _copy_blob(item)
        lowered = blob.lower()
        assert "option a" in lowered or "Option A" in blob
        assert "option b" in lowered or "Option B" in blob
        assert "definitely better" not in lowered
        assert "is the winner" not in lowered
        assert "the winner is" not in lowered
        assert "победитель" not in lowered
        assert "برنده" not in blob
        assert "الفائز" not in blob
        assert "{" not in blob
        if locale != "en":
            assert item.headline != en.headline


def test_near_tie_cleaner_posture_copy() -> None:
    left = {"id": "a", "score": 71, "dimension_class": "selective"}
    right = {"id": "b", "score": 70, "dimension_class": "action"}
    policy = compare_pair_policy(left, right, left_id="a", right_id="b")
    expl = explain_compare_pair(left, right, policy.model_dump(mode="json"))
    rendered = render_semantic_explanation(expl, "en", COMPARE_CONTEXT)
    assert rendered.headline == EN_GOLDENS["near_tie"]
    fa = render_semantic_explanation(expl, "fa", COMPARE_CONTEXT)
    assert "Option B" in fa.headline
    assert "{" not in fa.headline


def test_rtl_named_slots_do_not_depend_on_english_word_order() -> None:
    left = {"id": "a", "score": 81, "dimension_class": "selective"}
    right = {"id": "b", "score": 70, "dimension_class": "action"}
    policy = compare_pair_policy(left, right, left_id="a", right_id="b")
    expl = explain_compare_pair(left, right, policy.model_dump(mode="json"))
    context = {
        "option_labels": {"a": "سه‌شنبه", "b": "جمعه"},
    }
    for locale in ("fa", "ar"):
        rendered = render_semantic_explanation(expl, locale, context)
        assert rendered.text_direction == "rtl"
        assert "سه‌شنبه" in rendered.headline
        assert "جمعه" in rendered.headline
        assert rendered.headline.index("سه‌شنبه") != rendered.headline.index("جمعه")
        en_order = "سه‌شنبه has stronger"
        assert en_order not in rendered.headline


def test_safety_copy_only_when_safety_codes_present() -> None:
    elevated = render_semantic_explanation(
        explain_assessment(
            _assessment(
                80,
                "action",
                context={"risk_level": "elevated", "risk_domains": ["employment"]},
            )
        ),
        "en",
    )
    assert elevated.safety == ()
    assert CODE_NO_OUTCOME_PREDICTION not in _copy_blob(elevated)

    high = render_semantic_explanation(
        explain_assessment(
            _assessment(
                81,
                "selective",
                context={
                    "risk_level": "high_stakes",
                    "outcome_prediction_prohibited": True,
                    "factual_deadline_priority": True,
                },
            )
        ),
        "en",
    )
    assert EN_GOLDENS["no_outcome"] in high.safety
    assert EN_GOLDENS["high_stakes"] in high.safety
    assert EN_GOLDENS["deadline"] in high.safety
    assert high.headline  # timing copy coexists
    for locale in SUPPORTED_LOCALES:
        item = render_semantic_explanation(
            explain_assessment(
                _assessment(
                    81,
                    "selective",
                    context={
                        "risk_level": "high_stakes",
                        "outcome_prediction_prohibited": True,
                        "factual_deadline_priority": True,
                    },
                )
            ),
            locale,
        )
        gold = SAFETY_GOLDENS[locale]
        assert item.safety == (
            gold["high_stakes"],
            gold["no_outcome"],
            gold["deadline"],
        )


def test_dimension_and_window_copy() -> None:
    expl = explain_assessment(
        _assessment(
            70,
            "selective",
            dimensions={
                "clarity": {
                    "value": 20,
                    "status": "scored",
                    "evidence_strength": 0.6,
                    "dominant_evidence_ids": [],
                    "supportive_evidence_ids": [],
                    "caution_evidence_ids": [],
                    "conflicted": False,
                }
            },
        )
    )
    rendered = render_semantic_explanation(expl, "en")
    assert EN_GOLDENS["low_clarity"] in rendered.cautions
    window = render_semantic_explanation(
        explain_find_window(
            {
                "find_window_kind": "mixed_posture_window",
                "window_id": "w1",
                "dimension_classes": ["action", "selective"],
                "legacy_eligible_high_band": True,
            }
        ),
        "en",
    )
    assert window.headline == EN_GOLDENS["window_mixed"]
    assert window.summary == EN_GOLDENS["window_mixed_summary"]


def test_missing_required_args_fail_or_unavailable() -> None:
    expl = SemanticExplanation(
        headline_code=CODE_MATERIAL_TRADEOFF,
        summary_code=CODE_MATERIAL_TRADEOFF,
        opportunity_code="semantic.higher_score_stronger_opportunity",
        posture_code="semantic.lower_score_cleaner_posture",
        localization_args={},
    )
    with pytest.raises(SemanticRenderError) as caught:
        render_semantic_explanation(expl, "en", strict=True)
    assert caught.value.code == UNAVAILABLE_MISSING_ARGS
    unavailable = render_semantic_explanation(expl, "en", strict=False)
    assert unavailable.status == "unavailable"
    assert unavailable.unavailable_code == UNAVAILABLE_MISSING_ARGS
    assert unavailable.headline is None


def test_unsupported_locale_does_not_fall_back_to_english() -> None:
    expl = explain_assessment(_assessment(80, "action"))
    with pytest.raises(SemanticRenderError) as caught:
        render_semantic_explanation(expl, "de", strict=True)
    assert caught.value.code == UNAVAILABLE_UNSUPPORTED_LOCALE
    unavailable = render_semantic_explanation(expl, "de", strict=False)
    assert unavailable.status == "unavailable"
    assert unavailable.headline is None


def test_posture_terminology_table_complete() -> None:
    for locale in SUPPORTED_LOCALES:
        for posture_id in POSTURE_IDS:
            term = posture_term(locale, posture_id)
            assert term.strip()
            assert posture_id.replace("_", " ") != term.lower()
            if "_" in posture_id:
                assert posture_id not in term
        if locale != "en":
            assert posture_term(locale, "high_leverage") != posture_term(
                "en", "high_leverage"
            )
    assert posture_term("fa", "high_leverage") == "فرصت قوی برای اقدام"


def test_renderer_does_not_change_ranking_or_codes() -> None:
    ranked = rank_compare_options(
        [
            ScoredCompareOption(
                "a",
                "A",
                "2026-09-10",
                81.0,
                "high",
                assessment={"dimension_classification": {"day_class": "selective"}},
            ),
            ScoredCompareOption(
                "b",
                "B",
                "2026-09-12",
                70.0,
                "high",
                assessment={"dimension_classification": {"day_class": "action"}},
            ),
        ]
    )
    winner = ranked.ranked[0].option_id
    unique = ranked.unique_winner
    codes_before = [item["headline_code"] for item in ranked.explanations]
    rendered = [
        render_semantic_explanation(item, "en", COMPARE_CONTEXT)
        for item in ranked.explanations
    ]
    assert ranked.ranked[0].option_id == winner == "a"
    assert ranked.unique_winner is unique
    assert [item["headline_code"] for item in ranked.explanations] == codes_before
    assert rendered[0].status == "ok"
    assert "command" not in ranked.explanations[0]


def test_renderer_not_wired_into_evaluate_compare_find() -> None:
    from packages.decision_engine.evaluate import (
        find_runtime_common,
        timing_opt_compare,
        visibility_compare,
        visibility_evaluate,
    )
    from packages.decision_engine import compare_dates, find_windows

    for module in (
        visibility_evaluate,
        visibility_compare,
        timing_opt_compare,
        find_runtime_common,
        compare_dates,
        find_windows,
    ):
        source = inspect.getsource(module)
        assert "render_semantic_explanation" not in source
        assert "semantic_render" not in source


def test_required_slots_table_covers_templates() -> None:
    for code, slots in REQUIRED_SLOTS.items():
        assert code in emitted_semantic_codes()
        assert slots == required_slots(code)
