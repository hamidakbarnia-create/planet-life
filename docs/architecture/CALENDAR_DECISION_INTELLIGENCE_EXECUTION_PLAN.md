# Calendar Decision Intelligence — Execution Plan

Status: ACTIVE

## Product invariant

METIORO Calendar is a projection of Decision Intelligence, not a separate astrology engine.

Canonical flow:

`signals -> evidence -> synthesis -> context -> decision -> action -> explanation`

The LLM may explain an engine-backed recommendation. It must not invent scores, evidence, classifications, commands, confidence, domain states, or power windows.

## Architecture decision

Keep `packages/astro_engine` as the astronomical/scoring evidence foundation. Keep Decision Case as orchestration for Evaluate / Compare / Find. Add one deterministic shared Decision Semantics layer consumed by Calendar and Decision Case.

No Calendar-specific parallel scoring engine is permitted.

## Phase 0 — Baseline and golden fixtures

Goal: freeze current behavior before changing semantics.

Deliverables:
- representative score/evidence fixtures covering supportive, adverse, mixed, angular, retrograde and action-specific cases
- score provenance assertions
- cached/live parity requirements
- documented current scoring limitations

Acceptance:
- existing score behavior is reproducible
- every fixture records action context and personalization inputs
- no production score changes

## Phase 1 — Canonical evidence contract

Goal: normalize scored evidence into stable machine-readable factors.

Target modules:
- `packages/decision_engine/evidence.py`
- `packages/decision_engine/day_intelligence_models.py`

Evidence must support stable factor identity, source kind, polarity, contribution, context/domain tags and technical provenance. Optional future temporal fields include applying/separating, speed/duration and station state.

Acceptance:
- no recommendation is emitted without traceable evidence IDs
- evidence normalization does not rescore astrology
- existing scoring remains source of truth

## Phase 2 — Temporal intelligence

Add applying/exact/separating, speed/duration class and station state using deterministic astronomical evidence. Do not infer unavailable values.

Acceptance:
- fast triggers and structural signals are distinguishable
- exact/applying/separating state is testable
- station handling is separate from retrograde handling

## Phase 3 — Decision dimensions and conflict synthesis

Canonical internal dimensions:
- opportunity
- momentum
- clarity
- stability
- cooperation
- pressure
- reversibility_safety

Acceptance:
- conflicting evidence is preserved rather than averaged into misleading neutrality
- high momentum + low clarity can be represented explicitly

## Phase 4 — Decision semantics

Canonical command vocabulary:
- ACT
- ADVANCE
- NEGOTIATE
- VERIFY
- REVIEW
- WAIT
- PROTECT
- REPAIR
- EXPLORE
- COMMIT_WITH_CAUTION
- AVOID_IRREVERSIBLE_ACTION

Day classifications are deterministic and must not be derived from score alone.

Acceptance:
- identical structured input always produces identical command/classification
- no LLM dependency

## Phase 5 — Independent confidence

Confidence measures evidence quality/coverage/agreement, not opportunity.

Acceptance:
- high opportunity + moderate/low confidence is possible
- low opportunity + high confidence is possible
- incomplete natal inputs reduce personalization confidence honestly

## Phase 6 — Day Intelligence API and cache

Return complete Day Intelligence including score, command, classification, dimensions/domains, confidence, drivers, evidence IDs, temporal/window context and safety metadata.

Acceptance:
- cached and uncached results retain equivalent explainability
- cache never returns a naked score when intelligence was expected

## Phase 7 — Calendar UX

Month cells keep the compact score/index but add semantic state. Day sheet prioritizes classification, command, best moves, cautions, domain intelligence, current window, alternatives and expandable evidence.

Acceptance:
- user can understand what kind of day it is, what to do/avoid and why within ~10 seconds
- astrology terminology is optional detail

## Phase 8 — Power Windows V2

Reuse deterministic `packages/decision_engine/find_windows.py`; evolve its inputs to contextual Day Assessments rather than create another window engine.

Acceptance:
- Best Day, Best Alternative, Peak Window and Caution Window are evidence-backed
- tie handling remains deterministic

## Phase 9 — Ask / Decision Case unification

Calendar actions route to Decision Case Evaluate / Compare / Find using the same assessment semantics.

Acceptance:
- the same decision/date/context cannot receive contradictory recommendations because Calendar and Ask used different scoring logic

## Phase 10 — Localization, safety and rollout

Languages: EN / FA / AR / RU. Localize semantic keys, not generated horoscope paragraphs.

High-stakes invariant: legal, immigration, medical and financial factual outcomes are never predicted from astrology. Hard deadlines override timing preferences.

Acceptance:
- RTL verified for FA/AR
- high-stakes tests prevent deterministic outcome claims and deadline-violating recommendations

## Initial files expected to change

Engine/evidence:
- `packages/astro_engine/scoring.py`
- `packages/astro_engine/reasoning.py`
- `packages/decision_engine/evidence.py`
- `packages/decision_engine/day_intelligence_models.py`
- later: temporal weighting, signal dimensions, semantics, confidence, safety policy

Decision orchestration:
- `packages/decision_engine/find_windows.py`
- Decision Case evaluate/compare/find runtime services as integration proceeds

API:
- scoring pipeline/contracts
- new Day Intelligence schema/service/route

Web:
- `apps/web/lib/calendar-scores.ts`
- `apps/web/lib/calendar-cache.ts`
- `apps/web/lib/calendar-client.ts`
- Calendar page/components
- EN/FA/AR/RU locale catalogs

## Non-goals for P0/P1

- no Calendar redesign yet
- no score recalibration yet
- no LLM-written decision commands
- no parallel astrology engine
- no unsupported applying/separating or station inference
