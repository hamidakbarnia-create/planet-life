"""Shadow / Communication Risk presentation: symbolic labels, no engine change."""
from __future__ import annotations

from packages.astro_engine.vault_templates import (
    render_cheating_radar_reading,
    render_communication_risk_reading,
)

REPAIR = {
    "en": "Symbolic repair difficulty",
    "ru": "Символическая трудность восстановления",
    "fa": "وزن نمادین سختی برگشتن به گفت‌وگو",
    "ar": "رمزية: صعوبة العودة إلى الحوار",
}

HEADLINE = {
    "en": "Communication Risk themes",
    "ru": "Темы риска общения",
    "fa": "مضمون‌های ریسک ارتباط",
    "ar": "موضوعات مخاطر التواصل",
}

SYNASTRY = {
    "en": "two-chart comparison (synastry)",
    "ru": "сравнения двух карт (синастрия)",
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
        assert SYNASTRY[lang] in reading["headline"]
        assert repair in blob
        if lang == "en":
            assert "Symbolic repair difficulty" in blob
            assert "moderate level" in blob
        if lang == "ru":
            assert "умеренный уровень" in blob
            assert "деловые" not in reading["headline"]
        if lang == "ar":
            assert "مستوى متوسط" in blob
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

