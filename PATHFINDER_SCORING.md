# Pathfinder Relocation Scoring — methodology, status, and verification

Julia's bar: **errors trend to zero**, and different cities **must** give
different, defensible results. This file is the source of truth for how the
relocation score is built and how to verify it against external references
(astro-seek.com, geocult.ru, astro.com AstroClick Travel).

## Layered model (by driver strength)

A per-life-area score is built as:

```
score = 50 (neutral base)
      + lift     (positive angular planets + significator house placement)
      - penalty  (afflicting angular planets + adverse house placement)
clamped to 0–100
```

Cities diverge because **relocated angles (AC/MC/DC/IC) and house cusps change
with longitude AND latitude**, even though the natal planet zodiac positions are
fixed for the birth instant.

### Implemented buckets (computed correctly today)

1. **Relocated angular planets** — primary driver. A natal planet within 5° of a
   relocated angle. Sharp falloff so cities stop looking alike:
   `falloff = max(0, 1 - (orb/5)^1.7)`.
   - Orb table: Strong 0–1.5°, Moderate 1.5–3°, Weak 3–5°, None >5°.
   - Angle multiplier: AC/MC = 1.0, DC/IC = 0.90.
   - Planet-class multiplier: luminaries 1.0, Mercury/Venus/Mars 0.95,
     Jupiter/Saturn 0.85, outer 0.75, Node 0.55.
   - Preferred-axis boost ×1.15; exact (≤0.5°) boost ×1.15.
   - Per-area benefic/malefic polarity decides lift vs penalty.
2. **Relocated significator house placement** — graded per area (e.g. Love: 7th
   +1.0, 5th +0.85, 6th/12th −0.40). Always evaluated, so every card carries a
   concrete city-specific line (no blank "neutral 50").

### Deferred buckets (NOT shipped — would need altitude/declination-event astronomy)

Shipping these hastily would introduce geometry errors, which violates the
zero-error bar. They slot in later as extra lift/penalty terms:

- Parans at the city latitude (planned weight ~20)
- Great-circle distance to MC/IC/ASC/DESC lines (~15)
- Transits to relocated angles (~10) — note `best_times` already uses transits
- Local-space lines (~5)

When added, rebalance the lift/penalty weights and extend the validation test.

## Verdict bands

Frontend renders `positive | challenging | mixed` (reasons always present):

| Score | Internal band | Frontend verdict |
|------|---------------|------------------|
| 80–100 | Strong+ | positive |
| 65–79 | Supportive | positive |
| 45–64 | Mixed | mixed |
| 25–44 | Caution | challenging |
| 0–24 | Avoid | challenging |

Every verdict names concrete drivers (planet + angle, or significator + house).
There is **no generic "neutral" filler** — neutral cities still state which
significator sits in which relocated house.

## Validation (run on every change)

```
py -3.11 -m pytest apps/api/tests/test_pathfinder_divergence.py -v
# or print the audit table:
py -3.11 apps/api/tests/test_pathfinder_divergence.py
```

Acceptance criteria encoded in the test (sample chart × Tehran/London/Dubai/Omsk):
1. ≥ 4 life areas differ by ≥ 8 points across the four cities.
2. ≥ 2 areas show a verdict-band split across cities.
3. Every card has at least one concrete reason token.

If criteria 1–2 fail, tighten: distance/orb cutoffs (angular weak orb 5°→4°).

## Cross-checking against external references

Verify **geometry, not wording**:

1. Relocated ASC/MC + houses per city → astro-seek relocation chart calculator.
2. Planet→angle lines + nearest-line logic → astro.com AstroClick Travel.
3. Local-space lines → astro-seek Local Space calculator (when that bucket lands).
4. Parans → match only within a strict 1° latitude band (public tools over-list).
5. Raw planet positions → Swiss Ephemeris (our engine already uses this).

Audit sheet columns to reproduce a professional-inspectable trail:
`city, area, factor_type, body/pair, angle_or_house, exact_orb_deg, distance_km, signed_points, kept_or_dropped`
