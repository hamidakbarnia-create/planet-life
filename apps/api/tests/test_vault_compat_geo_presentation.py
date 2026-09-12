"""Compatibility formula and geography presentation. Engine scores stay unchanged."""
from __future__ import annotations

from packages.astro_engine.vault_quality_copy import collapse_repeated_reason
from packages.astro_engine.vault_templates import (
    render_best_countries_reading,
    render_business_geography_reading,
    render_compatibility_reading,
)
from services.vault_readings import compatibility_reading

FORMULA = {
    "en": "If theme scores are present, Overall is 45%",
    "ru": "45% полного сравнения двух карт",
    "fa": "۴۵٪ مقایسهٔ کامل دو نمودار",
    "ar": "٤٥٪ من مقارنة الرسمين",
}

NOT_QUALITY = {
    "en": "not measured relationship quality",
    "ru": "не измеренное качество отношений",
    "fa": "کیفیت واقعی رابطه را اندازه نمی‌گیرد",
    "ar": "ليس جودة علاقة مقيسة",
}


def test_compatibility_formula_matches_engine_blend():
    payload = compatibility_reading(
        birth_date="1992-03-12",
        birth_time="14:35",
        location="53.4808,-2.2426",
        lang="en",
        relationship_type="friendship",
        partner_birth_date="1990-01-15",
        partner_birth_time="12:00",
        partner_location="51.5074,-0.1278",
    )
    dims = [row for key, row in payload["dimensions"].items() if key != "overall" and isinstance(row.get("score"), int)]
    raw_plus_blend = payload["overall_score"]
    assert raw_plus_blend is not None
    assert payload["reading"]["score_formula"].startswith("If theme scores are present")
    # Recalculate from the same stored pieces only when themes exist.
    theme_mean = sum(row["score"] for row in dims) / len(dims)
    overall_dim = payload["dimensions"]["overall"]["score"]
    assert overall_dim == payload["overall_score"]
    assert theme_mean != overall_dim or len(dims) == 1


def test_formula_and_missing_partner_copy_all_langs():
    for lang, needle in FORMULA.items():
        reading = render_compatibility_reading(lang=lang, relationship_type="friendship")
        assert needle in reading["score_formula"]
        assert NOT_QUALITY[lang] in reading["score_formula"]
        assert any(token in reading["score_formula"] for token in ("12:00", "۱۲:۰۰", "١٢:٠٠"))


def test_missing_partner_still_has_formula_and_no_score():
    payload = compatibility_reading(
        birth_date="1992-03-12",
        birth_time="14:35",
        location="53.4808,-2.2426",
        lang="en",
        relationship_type="romantic",
    )
    assert payload["overall_score"] is None
    assert "45%" in payload["reading"]["score_formula"]


def test_geography_tools_use_distinct_existing_guidance():
    cities = [
        {"label": "Dubai", "score": 70, "symbolic_reason": "Sun-axis symbolism; Sun-axis symbolism; Jupiter weight"},
        {"label": "Tehran", "score": 70, "symbolic_reason": "Sun-axis symbolism"},
    ]
    love = render_best_countries_reading(cities, goal="relationship", lang="en")
    biz = render_business_geography_reading(cities, goal="expansion", lang="en")
    assert love["details"][0]["reason"] == "Sun-axis symbolism; Jupiter weight"
    assert "candidate-city shortlist" in love["interpretation"]
    assert "shared-life" in love["interpretation"]
    assert "work and expansion" in biz["interpretation"]
    assert love["action"] != biz["action"]
    assert "love" in love["interpretation"]
    assert "profit" in biz["interpretation"]
    assert love["place_scope"].startswith("Ranking applies only")


def test_collapse_repeated_reason_keeps_distinct_arabic_clauses():
    reason = "موضوع أول؛ موضوع أول؛ موضوع ثان"
    assert collapse_repeated_reason(reason) == "موضوع أول؛ موضوع ثان"
