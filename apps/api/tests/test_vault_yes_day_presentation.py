"""Yes Day presentation: short independent headline, dates stay on slots."""
from __future__ import annotations

import re

from packages.astro_engine.vault_templates import render_yes_day_reading

HEADLINES = {
    "en": "Independent symbolic windows, not a sequence",
    "fa": "پنجره‌های نمادین مستقل، نه یک توالی",
    "ru": "Независимые символические окна, не последовательность",
    "ar": "نوافذ رمزية مستقلة، وليست تسلسلاً",
}

DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")


def _slots():
    ask = {"date": "2026-07-26", "score": 80, "confidence": "high", "action_type": "negotiation"}
    commit = {
        **ask,
        "action_type": "negotiation+contract_signing",
        "date": "2026-07-28",
        "score": 76,
    }
    sign = {**ask, "action_type": "contract_signing", "date": "2026-07-29"}
    return ask, commit, sign


def test_yes_day_headline_is_short_and_has_no_dates():
    ask, commit, sign = _slots()
    for lang, expected in HEADLINES.items():
        reading = render_yes_day_reading(ask=ask, commit=commit, sign=sign, lang=lang)
        assert reading["headline"] == expected
        assert DATE_RE.search(reading["headline"]) is None
        assert reading["window_relationship"] == "independent"
        assert DATE_RE.search(reading["technical"])


def test_yes_day_intensity_thresholds_unchanged():
    high = render_yes_day_reading(
        ask={"date": "d1", "score": 90, "action_type": "negotiation"},
        commit={"date": "d2", "score": 88, "action_type": "negotiation+contract_signing"},
        sign={"date": "d3", "score": 86, "action_type": "contract_signing"},
        lang="en",
    )
    low = render_yes_day_reading(
        ask={"date": "d1", "score": 40, "action_type": "negotiation"},
        commit={"date": "d2", "score": 42, "action_type": "negotiation+contract_signing"},
        sign={"date": "d3", "score": 38, "action_type": "contract_signing"},
        lang="en",
    )
    assert high["intensity"] == "strong"
    assert low["intensity"] == "subtle"
    assert high["headline"] == HEADLINES["en"]
    assert low["headline"] == HEADLINES["en"]
