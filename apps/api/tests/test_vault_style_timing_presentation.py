"""Style Timing presentation copy. Engine scores and windows stay unchanged."""
from packages.astro_engine.vault_templates import (
    render_date_outfit_reading,
    render_todays_perfume_reading,
)


def test_perfume_copy_presents_alternatives_not_one_blend():
    for lang, needle in {
        "en": "not one required blend",
        "ru": "не один обязательный микс",
        "fa": "نه یک ترکیب اجباری",
        "ar": "وليست مزيجاً واحداً مطلوباً",
    }.items():
        reading = render_todays_perfume_reading(
            natal_venus_sign="taurus",
            natal_moon_sign="pisces",
            ascendant_sign="virgo",
            transit_moon_sign="virgo",
            target_date="2026-09-10",
            lang=lang,
        )
        assert needle in reading["interpretation"]
        assert " · " in reading["details"][1]["value"]
        if lang == "ar":
            assert (
                "هذه مجموعات نغمات بديلة للمقارنة، وليست مزيجاً واحداً مطلوباً. "
                "ولا تصف الشخصية."
            ) == reading["interpretation"]
            assert reading["interpretation"].count(
                "هذه مجموعات نغمات بديلة للمقارنة، وليست مزيجاً واحداً مطلوباً"
            ) == 1


def test_outfit_copy_keeps_accessories_optional_and_preserves_window():
    reading = render_date_outfit_reading(
        natal_venus_sign="taurus",
        ascendant_sign="virgo",
        transit_moon_sign="virgo",
        meeting_window="23:00–00:00",
        meeting_score=78,
        meeting_timezone="Europe/London",
        target_date="2026-09-10",
        lang="en",
    )
    assert "Accessories stay optional" in reading["interpretation"]
    assert reading["details"][0]["value"] == "23:00–00:00 · 78/100 · Europe/London"
    assert reading["accessories"] == "fine chain without a pendant"
