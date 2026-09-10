"""Targeted API display contract; legacy calculation enums stay unchanged."""
import json
import pytest
from test_vault_output_safety import client, forbid_side_effects, probe, vr  # noqa: F401

RATINGS = ["Highly Favorable", "Favorable", "Mixed / Proceed with Awareness", "Challenging", "Unfavorable"]
EXPECTED = {
    "en": ["Highly favorable", "Favorable", "Mixed / proceed with awareness", "Challenging", "Unfavorable"],
    "ru": ["Очень благоприятно", "Благоприятно", "Неоднозначно / действуйте осмотрительно", "Непросто", "Неблагоприятно"],
    "fa": ["بسیار مساعد", "مساعد", "ترکیبی؛ با دقت پیش بروید", "چالش‌برانگیز", "نامساعد"],
    "ar": ["ملائم جداً", "ملائم", "متباين؛ المتابعة بحذر", "صعب", "غير ملائم"],
}
@pytest.mark.parametrize("lang", EXPECTED)
@pytest.mark.parametrize("rating", RATINGS)
def test_yes_api_localizes_display_without_changing_calculated_slot(client, monkeypatch, lang, rating):
    def windows(*, action_type, **kwargs):
        return [dict(date="2026-09-10", score=57, rating=rating, confidence="low", action_type=action_type)]
    monkeypatch.setattr(vr, "_calendar_day_windows", windows)
    data = probe(client, "yes-day", lang)
    for key in ("ask", "commit", "sign"):
        slot = data["verdict"][key]
        assert slot["date"] == "2026-09-10" and slot["score"] == 57
        assert slot["rating"] == rating
        assert slot["rating_label"] == EXPECTED[lang][RATINGS.index(rating)]
        if lang != "en":
            assert not any(token in slot["rating_label"] for token in RATINGS)
    assert data["verdict"]["window_relationship"] == "independent"

@pytest.mark.parametrize("lang", EXPECTED)
def test_real_synthetic_yes_api_has_localized_display_labels(client, lang):
    data = probe(client, "yes-day", lang)
    for key in ("ask", "commit", "sign"):
        slot = data["verdict"][key]
        assert slot["rating_label"] == EXPECTED[lang][RATINGS.index(slot["rating"])]

def test_arabic_communication_questions_do_not_assume_gender(client):
    data = probe(client, "communication-risk", "ar")
    text = json.dumps(data, ensure_ascii=False)
    assert "كيف يمكن تلخيص الطلب كما وصل إلى الطرف الآخر؟" in text
    assert "كيف يمكن توضيح الحاجة إلى استراحة" in text
    assert "سمعتِ" not in text and "تصمتين" not in text
