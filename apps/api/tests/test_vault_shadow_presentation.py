"""Shadow / Communication Risk presentation: symbolic labels, no engine change."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.astro_engine.vault_templates import (
    render_cheating_radar_reading,
    render_communication_risk_reading,
    trust_reflections,
)
from services.vault_readings import _comm_risk_questions, _radar_questions

REPAIR = {
    "en": "Symbolic repair difficulty",
    "ru": "Символическая трудность восстановления",
    "fa": "وزن نمادین سختی برگشتن به گفت‌وگو",
    "ar": "رمزية: صعوبة العودة إلى الحوار",
}

HEADLINE = {
    "en": "Communication themes",
    "ru": "Темы общения",
    "fa": "موضوع‌های گفت‌وگو",
    "ar": "موضوعات التواصل",
}

SYNASTRY = {
    "en": "two-chart comparison (synastry)",
    "ru": "сравнение двух карт (синастрия)",
    "fa": "مقایسهٔ دو نمودار (سیناستری)",
    "ar": "مقارنة الرسمين (السيناستري)",
}

FRIEND_CHEATING = (
    "cheating",
    "fidelity",
    "loyalty",
    "خیانت",
    "وفاداری",
    "измен",
    "верность",
    "خيانة",
    "الوفاء",
)

def _signals(band: str = "moderate"):
    keys = (
        "clarity_risk",
        "misunderstanding_risk",
        "emotional_reactivity",
        "avoidance_silence",
        "escalation_risk",
        "repair_capacity",
    )
    return {key: {"band": band, "layer": "inferred", "score": 50} for key in keys}

def test_communication_risk_labels_are_symbolic_themes():
    for lang, repair in REPAIR.items():
        reading = render_communication_risk_reading(
            lang=lang,
            mode="synastry",
            relationship_type="friendship",
            signals=_signals(),
        )
        blob = " ".join(
            str(reading.get(key) or "")
            for key in ("headline", "executive", "strategic", "interpretation")
        )
        assert HEADLINE[lang] in reading["headline"]
        assert SYNASTRY[lang] not in reading["headline"]
        assert SYNASTRY[lang] in reading["technical"]
        assert repair in blob
        if lang == "en":
            assert "Symbolic repair difficulty" in blob
            assert "moderate level" in blob
        if lang == "ru":
            assert "умеренный уровень" in blob
            assert "деловые" not in reading["headline"]
        if lang == "ar":
            assert "مستوى متوسط" in blob
        if lang == "fa":
            assert "نقشه ریسک گفت‌وگو" in reading["strategic"]
            assert "نقشه ریسک ارتباط" not in reading["strategic"]
            assert "عجله نکنید" in reading["action"]
            assert "عجله نکن؛" not in reading["action"]
    business = render_communication_risk_reading(
        lang="ru", mode="synastry", relationship_type="business", signals=_signals()
    )
    assert "деловые отношения" in business["headline"]
    assert " · деловые · " not in business["headline"]

def test_communication_risk_limitation_does_not_cover_predictive_validity():
    evidence = {
        "en": "Predictive validity has not been established.",
        "ru": "Предсказательная достоверность не подтверждена.",
        "fa": "اعتبار پیش‌بینی تأیید نشده است.",
        "ar": "لم تثبت صلاحية هذه القراءة للتنبؤ.",
    }
    for lang, phrase in evidence.items():
        reading = render_communication_risk_reading(lang=lang, signals=_signals())
        assert phrase not in (reading.get("limitation") or "")

def test_friend_radar_limitation_avoids_cheating_framing():
    for lang in ("en", "ru", "fa", "ar"):
        reading = render_cheating_radar_reading(
            lang=lang, relationship_type="friendship"
        )
        text = f"{reading['limitation']} {reading['headline']}".lower()
        for banned in FRIEND_CHEATING:
            assert banned.lower() not in text, (lang, banned)
        romantic = render_cheating_radar_reading(
            lang=lang, relationship_type="romantic"
        )
        assert romantic["limitation"] != reading["limitation"]


def test_business_radar_limitation_avoids_fidelity_framing():
    for lang in ("en", "ru", "fa", "ar"):
        reading = render_cheating_radar_reading(
            lang=lang, relationship_type="business"
        )
        text = f"{reading['limitation']} {reading['headline']}".lower()
        for banned in FRIEND_CHEATING:
            assert banned.lower() not in text, (lang, banned)
        romantic = render_cheating_radar_reading(
            lang=lang, relationship_type="romantic"
        )
        assert romantic["limitation"] != reading["limitation"]
        assert "business" in reading["limitation"].lower() or "работ" in reading["limitation"].lower() or "کاری" in reading["limitation"] or "عمل" in reading["limitation"]


def test_radar_renderer_keeps_supplied_unknowns_and_does_not_copy_limitation():
    supplied = ["partner synastry trust signals — unknown without second chart"]
    reading = render_cheating_radar_reading(
        lang="en",
        mode="self",
        relationship_type="romantic",
        unknown=supplied,
        missing_inputs=["partner_birth_date"],
    )
    assert reading["unknown"] == supplied
    assert reading["limitation"] not in reading["unknown"]
    assert "actual behavior and fidelity are unknown" in reading["limitation"].lower()

    empty = render_cheating_radar_reading(
        lang="en",
        mode="synastry",
        relationship_type="romantic",
        unknown=[],
    )
    assert empty["unknown"] == []
    assert "actual behavior and fidelity are unknown" in empty["limitation"].lower()


EXPLANATION = {
    "en": "These scores are optional symbolic comparison weights, not behavioral evidence.",
    "fa": "این امتیازها وزن مقایسهٔ نمادین اختیاری‌اند، نه شاهد رفتار.",
    "ru": "Эти оценки — необязательные символические веса сравнения, а не свидетельство поведения.",
    "ar": "هذه الدرجات أوزان مقارنة رمزية اختيارية، وليست دليلاً سلوكياً.",
}

THEME_LABELS = {
    "en": "Boundaries",
    "fa": "مرزها",
    "ru": "границы",
    "ar": "الحدود",
}

ACTION_FA = "برداشت خود را با رفتار قابل مشاهده و گفت‌وگوی مستقیم و آرام بررسی کنید"


def test_radar_themes_questions_and_shared_explanation_all_langs():
    questions = {
        "en": ["What would help you feel safer telling me hard things?"],
        "fa": ["چه چیزی گفتن حرف سخت را برای شما امن‌تر می‌کند؟"],
        "ru": ["Что поможет тебе безопаснее говорить трудное?"],
        "ar": ["ما الذي يساعدك على قول الصعب بأمان أكثر؟"],
    }
    signals = {
        "trust_pressure": {"band": "moderate", "layer": "inferred", "score": 41, "hits": 1},
        "communication_ambiguity": {"band": "unknown", "layer": "unknown", "score": None, "hits": 0},
        "emotional_withdrawal": {"band": "moderate", "layer": "inferred", "score": 55, "hits": 2},
        "secrecy_avoidance": {"band": "unknown", "layer": "unknown", "score": None, "hits": 0},
    }
    for lang, explanation in EXPLANATION.items():
        reading = render_cheating_radar_reading(
            lang=lang,
            mode="synastry",
            relationship_type="romantic",
            signals=signals,
            questions=questions[lang],
            behaviors=["Consistency between words and follow-through over 2–3 weeks"]
            if lang == "en"
            else [],
        )
        blob = " ".join(
            str(reading.get(key) or "")
            for key in ("executive", "strategic", "interpretation")
        )
        assert reading["interpretation"] == explanation
        assert blob.count(explanation) == 2  # strategic + interpretation
        assert "Optional reflection" not in blob
        assert "تأمل اختیاری" not in blob
        labels = [row["label"] for row in reading["details"]]
        values = [row["value"] for row in reading["details"]]
        assert THEME_LABELS[lang] in labels
        assert "41/100" in values
        assert "55/100" in values
        assert values.count("41/100") == 1
        assert "Clarifying expectations" not in labels
        assert questions[lang][0] in values
        assert any(label.startswith({"en": "Question", "fa": "پرسش", "ru": "Вопрос", "ar": "سؤال"}[lang]) for label in labels)
        if lang == "fa":
            assert reading["action"] == ACTION_FA
            assert "برداشتت" not in reading["action"]
            assert not reading["action"].endswith("بررسی کن")


def test_radar_does_not_invent_theme_rows_without_scores():
    reading = render_cheating_radar_reading(
        lang="en",
        mode="self",
        relationship_type="romantic",
        unknown=["partner synastry trust signals — unknown without second chart"],
        questions=["What feels unclear between us right now?"],
        behaviors=["Warmth returning after distance — or staying flat"],
    )
    labels = [row["label"] for row in reading["details"]]
    values = [row["value"] for row in reading["details"]]
    assert "Boundaries" not in labels
    assert not any(value.endswith("/100") for value in values)
    assert "partner synastry trust signals — unknown without second chart" in values
    assert "What feels unclear between us right now?" in values
    assert reading["unknown"] == [
        "partner synastry trust signals — unknown without second chart"
    ]
    assert reading["limitation"] not in reading["unknown"]
    assert reading["interpretation"] == EXPLANATION["en"]


def test_radar_preserves_trust_reflections_fractional_score_display():
    signals = {
        "trust_pressure": {"band": "moderate", "layer": "inferred", "score": 41.5, "hits": 1},
    }
    reading = render_cheating_radar_reading(
        lang="en",
        mode="synastry",
        relationship_type="romantic",
        signals=signals,
    )
    values = [row["value"] for row in reading["details"]]
    assert "41.5/100" in values
    assert "41/100" not in values
    legacy = trust_reflections(signals, "en")
    assert "41.5/100" in legacy[0]
    assert all("41/100" not in item for item in legacy)


def test_communication_risk_themes_and_questions_are_detail_rows():
    questions = ["Ask about one recent example.", "Ask how to return to the talk."]
    reading = render_communication_risk_reading(
        lang="en",
        mode="synastry",
        relationship_type="business",
        signals=_signals(),
        questions=questions,
    )
    labels = [row["label"] for row in reading["details"]]
    values = [row["value"] for row in reading["details"]]
    assert "Symbolic repair difficulty" in labels
    assert "Question 1" in labels
    assert questions[0] in values
    assert questions[1] in values
    assert " · " not in reading["interpretation"]
    assert reading["interpretation"] == (
        "Symbolic prompts for a conversation, not observed communication behavior."
    )


FORMAL_FA_TRUST = (
    "بر گفت‌وگوی مستقیم و رفتار قابل مشاهده تکیه کنید؛ بر این اساس اتهام، نظارت یا مقابله نکنید."
)
FORMAL_FA_BUSINESS = (
    "بر گفت‌وگوی مستقیم و کار قابل مشاهده تکیه کنید؛ بر این اساس اتهام، نظارت یا مقابله نکنید."
)


def test_trust_limitations_use_formal_persian_address():
    for relationship, expected in (
        ("romantic", FORMAL_FA_TRUST),
        ("marriage", FORMAL_FA_TRUST),
        ("friendship", FORMAL_FA_TRUST),
        ("business", FORMAL_FA_BUSINESS),
    ):
        reading = render_cheating_radar_reading(
            lang="fa", relationship_type=relationship
        )
        assert expected in reading["limitation"]
        assert "تکیه کن؛" not in reading["limitation"]
        assert "مقابله نکن." not in reading["limitation"]


def test_marriage_shadow_questions_are_natural_localized_equivalents():
    trust_fa = _radar_questions("marriage", "fa")
    assert trust_fa == [
        "کدام عادت‌ها به تقویت اعتماد بین ما کمک می‌کنند؟",
        "صحبت‌کردن دربارهٔ کدام موضوع برای ما دشوارتر است؟",
        "بعد از یک هفته فاصلهٔ عاطفی، چطور دوباره ارتباطمان را بهتر کنیم؟",
    ]
    comm_fa = _comm_risk_questions("marriage", "fa")
    assert comm_fa == [
        "کدام موضوع به گفت‌وگویی آرام‌تر و باحوصله‌تر نیاز دارد؟",
        "چطور گفت‌وگوی تندشونده را بدون فاصله‌گرفتن از هم متوقف کنیم؟",
        "بعد از گفت‌وگو چه اقدام مشخصی به رفع ابهام کمک می‌کند؟",
    ]
    comm_fa_friend = _comm_risk_questions("friendship", "fa")
    assert comm_fa_friend == [
        "در تبادل آخر چه چیزی مبهم بود؟",
        "بعد از فاصله چطور دوباره خبری از هم بگیریم؟",
        "با چه لحنی راحت‌تر می‌توانیم گفت‌وگو را ادامه دهیم؟",
    ]
    comm_ru = _comm_risk_questions("marriage", "ru")
    assert comm_ru == [
        "Какая тема нуждается в более спокойном и неспешном разговоре?",
        "Как остановить обостряющийся разговор, не закрываясь друг от друга?",
        "Какой конкретный шаг после разговора вернёт ясность?",
    ]
    assert _radar_questions("marriage", "en") == [
        "Which habits help strengthen trust between us?",
        "Which topic is harder for us to talk about?",
        "After a cold week, how do we reconnect?",
    ]
    assert _comm_risk_questions("marriage", "en") == [
        "Which topic needs a slower, calmer conversation?",
        "How can we pause an escalating conversation without shutting each other out?",
        "What concrete follow-through would restore clarity?",
    ]

