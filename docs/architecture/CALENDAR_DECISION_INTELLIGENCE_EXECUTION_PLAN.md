# Calendar Decision Intelligence — Execution Plan (Phase 0 + Phase 1)

| Field | Value |
|-------|-------|
| **Status** | Phase 0/1 + 2A (shadow classification) + 2B (dimensions) on `feat/calendar-decision-intelligence-p0-p1` |
| **Invariant** | Astronomical signals → scored evidence → **normalized evidence** → decision synthesis → context → decision command → explanation |
| **Non-goals (this phase)** | Calendar UI redesign, semantic commands, replacing 2A classification, domain scores, Power Window changes, Ask UI, LLM prose, production score recalibration, second scoring engine |

This document is the Phase 0 audit plus the Phase 1 adapter contract, with Phase 2A (provisional shadow classification) and Phase 2B (decision dimensions) recorded below. Calendar, Evaluate, Compare, and Find must consume the same Decision Intelligence semantics; Phase 0/1 only delivers the **normalized evidence** seam.

---

## Phase 0 — Current calculation path

### Calendar `/api/batch` → score

```
apps/web/lib/calendar-scores.ts  fetchMonthScores
  → POST /api/batch              apps/api/src/main.py  batch_score
    → _score_one (thread pool)
      → services.scoring_pipeline.score_with_context
           CONTEXT_CALENDAR_DAY
           resolve_transit_time → 12:00 local (never birth time)
           services.chart_data.build_chart_payload
             natal at birth loc/time
             transit at evaluation loc + noon
           packages.astro_engine.scoring.calculate_activity_score
      → schemas.score_breakdown.build_scoring_response
           validate component_breakdown
           packages.astro_engine.reasoning.build_reasoning
  → client extracts executive.score, breakdown, reasoning
  → month cache stores numeric scores only
```

Hourly `/api/batch-hourly` uses `CONTEXT_CALENDAR_HOURLY` (explicit hour required) and **does not** attach reasoning (natal/transit omitted in `build_scoring_response`).

Find windows (`packages/decision_engine/find_windows.py`) consume **score + candidate band only**. They do not yet read DecisionEvidence.

Evaluate / Compare runtimes already map Package drivers from reasoning evidence via `evaluate.factor_keys` / `evaluate.driver_assembly`. Phase 1 reuses `build_factor_key` so Calendar identity cannot drift from Ask.

### Exact current score formula

From `packages/astro_engine/scoring.py` `calculate_activity_score`:

```
final_score = clamp_0_100(round(
    50
    + Σ aspect_contribution
    + natal_house_bonus          # if scoring_context.include_natal_house_bonus
    + transit_house_score        # if include_transit_house_score
    + transit_angular_score      # if include_transit_angular_score
    + retrograde_penalty         # stored as a negative number
))
```

`location_component_score = transit_house_score + transit_angular_score`.

**Calendar day context (`CONTEXT_CALENDAR_DAY`):**

| Flag | Value |
|------|-------|
| `location_mode` | `currentLiving` |
| `include_natal_house_bonus` | **False** |
| `include_transit_house_score` | True |
| `include_transit_angular_score` | True |
| default transit time | `12:00` local at evaluation location |

### Every component that can change the 0–100 score

| Component | How it is computed | Calendar day? |
|-----------|--------------------|---------------|
| Base | constant `50` | yes |
| Aspects | For each transit–natal pair within orb: `polarity × orb_strength × relevance × 18`. Polarity from aspect type (conjunction pair-sensitive). Relevance = mean of activity-profile planet weights. Orb table is `DEFAULT_ORBS` unless overridden. | yes |
| Natal house bonus | `+1.5` per natal body in profile `supportive_houses`, capped at `+8` | **no** (flag off) |
| Transit local houses | `+2.2 × weight` supportive house/planet, `-2.0 × weight` caution house/planet; extra `-1.5 × weight` if Mercury/Venus/Mars retrograde in a caution house. Clamped `[-15, +15]`. | yes |
| Transit angular | Benefic near favored ASC/MC(/DSC/IC): `+3.5 × band × weight`. Pressure planet near pressure angle: `-3.0 × band × weight`. Bands: strong ≤3°, medium ≤6°, weak ≤10°. Clamped `[-12, +12]`. | yes |
| Retrograde penalty | `-2.5` per **primary-profile** transiting planet with `retrograde=True`, capped at `-10`. | yes |
| Activity / action_type | Selects `ACTIVITY_PROFILES` (or alias map): planet weights, supportive houses, transit-house rule set, favored angles. | yes |
| Natal chart | Birth date/time/location, house system, zodiac → natal longitudes (and natal houses when bonus is on). | yes (aspects) |
| Evaluation location | Transit houses + ASC/MC/DSC/IC at evaluation coordinates/timezone. | yes |
| Clock time | Calendar date-only = noon local. Hourly = explicit hour. | yes |
| Custom orbs | Optional `transit_data["orbs"]`. Calendar pipeline does not pass custom orbs. | no (default) |

Inputs that **do not** change the numeric score: locale, language, UI presentation, LLM text, reasoning titles.

---

## Phase 1 — Normalized evidence

Adapter: `packages/decision_engine/evidence.py`
Carrier: `packages/decision_engine/day_intelligence_models.py`
`DayIntelligenceSnapshot.final_score` is copied from the engine. Normalization does not recompute it.

Identity:

- `factor_key` via existing `evaluate.factor_keys.build_factor_key` (never titles)
- `evidence_id = ev.{factor_key}` when the key exists
- Polarity: `contribution > 0 → supportive`, `< 0 → caution`, `0 → neutral`
  (Package drivers still use `cautionary` for the same negative sign)

---

## Completion report

### A. Files changed

| Path | Role |
|------|------|
| `packages/decision_engine/evidence.py` | **new** DecisionEvidence + adapter |
| `packages/decision_engine/day_intelligence_models.py` | **new** score+evidence snapshot |
| `packages/decision_engine/__init__.py` | exports |
| `packages/decision_engine/tests/fixtures/calendar_score_cases.py` | synthetic engine inputs |
| `packages/decision_engine/tests/fixtures/generate_calendar_score_goldens.py` | regenerate goldens from engine |
| `packages/decision_engine/tests/fixtures/calendar_goldens/*.json` | committed engine goldens |
| `packages/decision_engine/tests/unit/test_evidence_normalization.py` | adapter tests |
| `packages/decision_engine/tests/unit/test_calendar_score_goldens.py` | golden regression |
| `apps/api/tests/test_calendar_decision_evidence_adapter.py` | live `/api/batch` pipeline path |
| `apps/web/lib/calendar-cache.ts` | document scores-only cache contract |
| `apps/web/lib/calendar-cache.test.ts` | lock scores-only payload |
| `apps/web/lib/calendar-scores.ts` | document cache-hit gap |
| `apps/web/lib/calendar-scores.transport.test.ts` | cache hit vs live breakdown |
| `docs/architecture/CALENDAR_DECISION_INTELLIGENCE_EXECUTION_PLAN.md` | this file |

Unrelated dirty files on the working tree (`DECISION_INTELLIGENCE_ENGINE.md`, `EVIDENCE_REGISTRY.md`, deployment note) were **not** modified for this phase.

### B. Tests added

- `test_evidence_normalization.py` — polarity, deterministic IDs, aspect/house/angular/retrograde provenance, unknown temporal fields, score immutability, natal-house when context includes it, reasoning fallback, Calendar natal-house exclusion
- `test_calendar_score_goldens.py` — 13 engine-generated goldens covering the required scenarios
- `test_calendar_decision_evidence_adapter.py` — live SwissEph calendar day path
- cache contract tests — `CALENDAR_CACHE_STORES_DAY_INTELLIGENCE === false`; cache hit returns empty breakdowns/reasoning; live batch still extracts them

### C. Test results

| Suite | Result |
|-------|--------|
| Focused: `test_evidence_normalization.py` + `test_calendar_score_goldens.py` | **18 passed** |
| `packages/decision_engine/tests` | **363 passed** |
| API: adapter + score breakdown contract + reasoning | **24 passed** |
| Web: `calendar-cache.test.ts` + `calendar-scores.transport.test.ts` | **32 passed** |
| `git diff --check` on Phase 0/1 files | clean |

Unrelated pre-existing dirty docs (`DECISION_INTELLIGENCE_ENGINE.md`, `EVIDENCE_REGISTRY.md`, provider-hardening note) were left untouched and still fail `--check` on their own trailing whitespace.

### D. Exact current score formula / components

See Phase 0 above. Canonical string already emitted by the engine:

`score = clamp(50 + aspects + natal_house_bonus? + transit_house_score? + transit_angular_score? - retrograde_penalty)`

(`retrograde_penalty` in `component_breakdown` is already signed negative.)

### E. Evidence fields available today

| Field | Source |
|-------|--------|
| `evidence_id`, `factor_key` | structured identity |
| `kind` | `aspect` / `house` / `angular` / `retrograde` |
| `polarity`, `contribution` | signed engine contribution |
| `transit_body`, `natal_target` | aspect + house/angular/retro bodies |
| `aspect_type`, `orb` | `technical.aspects_evaluated` |
| `house`, `house_scope` | natal/transit house reasons |
| `angle`, `orb_band` | angular contact (`strong`/`medium`/`weak`) |
| `retrograde` | primary-ruler penalty and house-retro extra |
| `source_engine`, `source_layer` | provenance path |

### F. Evidence fields still unavailable (left unknown)

The engine does not emit these. Phase 1 **does not invent them**:

| Field | Status |
|-------|--------|
| applying / separating | unknown |
| station state | unknown |
| speed class | unknown |
| duration class | unknown |
| orb strength (internal `_orb_strength`) | unknown — used inside scoring, not on output records |
| moon void-of-course, speed, latitudinal info | unknown |
| per-aspect applying motion | unknown |

`orb_band` is **not** orb strength; it is the existing angular band already used by scoring.

### G. Technical debt discovered

1. **Month cache is scores-only.** Fingerprint schema is already `v2`, but `MonthCacheRecord` has no breakdown, reasoning, or evidence. Cache hits force Calendar insight surfaces to empty maps. Full content migration is Phase 2+ (do not confuse with scoring-identity `v2`).
2. **Hourly batch omits reasoning** (and therefore omits structured house/angular/retro unless charts are passed to the adapter).
3. **Component clamps vs per-item evidence.** Natal house bonus cap `8`, transit house `±15`, angular `±12`, retro `10` apply to totals. Per-item evidence can sum past the clamp. Evidence is explanatory, not a rescoring.
4. **Polarity vocabulary split.** Package drivers: `cautionary`. Calendar DecisionEvidence: `caution` (this phase’s spec). Unify in Phase 2.
5. **FIND/COMPARE/EVALUATE do not yet consume DecisionEvidence.** FIND uses score+band; Evaluate maps a truncated driver list from facade evidence references (titles still in driver labels).
6. **Reasoning electional_timing** is not a score component (location-mode metadata and timing notes). Adapter excludes it from scored evidence.
7. **Prose notes** (`transit_house_notes`, opportunity/risk factor strings) must not become identity.
8. Adapter currently imports private `reasoning.py` helpers so contribution math cannot drift. A later scoring-engine iterator would be cleaner than private imports.

### H. Recommendation for Phase 2

1. Attach `DayIntelligenceSnapshot` (or its evidence tuple) to Calendar live `/api/batch` payloads **without** changing `executive.score`.
2. Cache **content** migration: persist breakdown + reasoning + evidence beside scores, new content version, keep fingerprint identity. Tiny P1 did not do this.
3. Day classification and semantic commands must read **normalized evidence**, not raw scores or LLM text. No second astrology engine.
4. Domain scores, if any, compose from the same evidence — do not rescore transits.
5. Teach FIND/COMPARE/EVALUATE to accept DecisionEvidence so Calendar and Ask share polarity/factor_key semantics. Unify `caution` vs `cautionary`.
6. Do not expand applying/separating/stations until ephemeris actually emits them.
7. Do not recalibrate production weights as a side effect of classification work.

---

## Cache audit (Phase 0/1 — no content migration)

| Behavior | Result |
|----------|--------|
| Identity | Fingerprint over birth, evaluation coords/tz, house system, zodiac, action_type, month dates (`CALENDAR_CACHE_VERSION = v2`) |
| Stored payload | `scores: Record<date, number>` only |
| Cache hit | `{ scores, breakdowns: {}, reasoning: {}, dayIntelligence: {} }` — **documented and tested** |
| Live miss | Breakdown + reasoning + day intelligence extracted from `/api/batch` |
| Persist rule | Complete month only; empty `{}` is a miss |

`CALENDAR_CACHE_STORES_DAY_INTELLIGENCE = false` locks this contract until a dedicated content migration.

---

## Phase 2 gate

Phase 2 (commands, classification, domain scores) may start **only if**:

- Goldens still match `calculate_activity_score`
- Adapter never changes `final_score`
- Unknown temporal fields stay unknown
- Cache scores-only behavior remains explicit until content migration

---

## Phase 2A — Day classification (complete)

**Scope:** Decision synthesis from normalized evidence + existing score bands. No semantic commands, domain scores, cache content migration, Calendar UI redesign, or production weight changes.

### Rules

1. `rating` is always `astro_engine.scoring._rating(final_score)` (80 / 65 / 45 / 30).
2. Material evidence uses the existing ±4.0 opportunity/risk magnitude.
3. No evidence → `insufficient`.
4. Material supportive **and** material caution → `mixed` (`conflict=true`), even if the net score is Favorable+.
5. Otherwise map score bands: ≥80 `strongly_supportive`, ≥65 `supportive`, ≥45 `mixed`, ≥30 `caution`, else `adverse`.
6. Classification never changes `final_score`. No `command` field.

### Wiring

- Live Calendar `/api/batch` date-only payloads gain additive `day_intelligence`.
- Hourly `/api/batch-hourly` and Ask `build_scoring_response` are unchanged.
- Web `fetchMonthScores` extracts `dayIntelligence` on live miss; cache hits remain empty.

### Explicitly deferred

- Semantic commands (GO / WAIT / …)
- Domain scores
- Cache content migration
- FIND/COMPARE consuming DecisionEvidence
- Calendar UI presentation of `day_class`
- Unifying Package `cautionary` vs Calendar `caution`

**Status after 2B:** this classifier is **PROVISIONAL SHADOW LOGIC**. It remains attached for regression and for Phase 2C comparison. It is **not** the canonical basis for commands, Find, Compare, Evaluate conclusions, or user-visible Calendar semantics.

---

## Phase 2B — Decision dimensions (experimental shadow)

**Scope:** Deterministic `DecisionEvidence[] → DecisionDimensions`. Parallel to 2A. No commands, no score recalibration, no Find/Compare/Evaluate semantic changes, no Calendar UI, no LLM.

**Status:** `mapping_version = dimensions.v1-shadow`, `semantic_status = experimental_shadow`. Not canonical classification or command semantics.

### Model

`DecisionDimension`: `value` 0–100, `evidence_strength` 0–1 or `null`, `status` `scored` | `insufficient`, `supportive_evidence_ids`, `caution_evidence_ids`, `dominant_evidence_ids`, `conflicted`.

`evidence_strength` is normalized evidence mass (`min(1, Σ|delta| / 18)`). It is **not** prediction confidence, certainty, or probability. Null iff `status=insufficient`.

`DecisionDimensions`: seven canonical keys plus `mapping_version`, `semantic_status`, `baseline`, `action_type`.

### Mapping (`dimensions.v1-shadow`)

Language-neutral table in `packages/decision_engine/dimension_mapping.py`. Bodies reuse `PLANETS` / BENEFICS / MALEFICS / PRESSURE_TRANSIT.

**Routing:** generic body→dimension rows apply to `transit_body` only. Kind overlays still apply (`retrograde` → reversibility_safety + clarity; `angular` → momentum). `natal_target` does **not** inherit generic body mappings. Natal-target effects require an explicit `NATAL_TARGET_DIMENSION_WEIGHTS` row (empty in this version). Contribution already includes activity-profile planet weights — they are not applied again.

**Baseline 50** is a numeric midpoint. With `status=insufficient` it is **unknown**, not neutral evidence. It is not a probability and is not `executive.score`.

**Pressure is inverted:** caution raises pressure, support lowers it. Provenance lists still follow evidence polarity.

Unsupported temporal fields (`applying_or_separating`, `station_state`, `speed_class`, `duration_class`, `orb_strength`) are not read.

### Mapping table (`dimensions.v1-shadow`, transit_body)

| Body / kind | opportunity | momentum | clarity | stability | cooperation | pressure | reversibility_safety |
|-------------|-------------|----------|---------|-----------|-------------|----------|----------------------|
| sun | 1.0 | 0.8 | | | | | |
| moon | | | | 1.0 | 0.6 | | |
| mercury | | | 1.0 | | | | 0.5 |
| venus | 0.6 | | | | 1.0 | | |
| mars | 0.5 | 1.0 | | | | 0.8 | |
| jupiter | 1.0 | 0.8 | | | 0.4 | | |
| saturn | | | 0.4 | 1.0 | | 0.8 | 0.5 |
| uranus | | 0.4 | | 0.7 | | 0.8 | |
| neptune | | | 1.0 | | | | 1.0 |
| pluto | | | | 0.5 | | 1.0 | 0.8 |
| north_node | 1.0 | | | | | | |
| chiron | | | | 0.5 | | | 0.4 |
| kind:retrograde | | | 0.4 | | | | 1.0 |
| kind:angular | | 0.8 | | | | | |

Weights scale existing signed `contribution`. They do not invent new astronomical facts.

### Calculation

1. Sort evidence by `evidence_id` (order independence).
2. Union `transit_body` weights + explicit natal-target weights (none in v1-shadow) + kind overlays.
3. `delta = contribution × weight` (negated for pressure).
4. `value = clamp(round(50 + Σ delta), 0, 100)`.
5. No mapped evidence → `value=50`, `evidence_strength=null`, `status=insufficient` (unknown, not neutral).
6. `conflicted` if material (±4.0) supportive **and** material caution both mapped to that dimension.
7. Dominant IDs: top 3 by `|contribution|`, tie-break `evidence_id`.
8. `evidence_strength = min(1, Σ|delta| / 18)` — evidence mass only.

### Wiring

- Computed in `build_day_intelligence_snapshot` in parallel with 2A classification.
- Added to Calendar `day_intelligence.dimensions` with `semantic_status=experimental_shadow`. Frontend parser ignores unknown keys; Calendar UI unchanged.
- Score goldens untouched. Separate `dimension_goldens/`.
