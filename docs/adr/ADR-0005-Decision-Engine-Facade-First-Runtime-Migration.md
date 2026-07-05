# ADR-0005: Decision Engine Facade — First Runtime Migration

**Status:** Accepted  
**Date:** 2026-07-05  
**Decision makers:** METIORO Platform Engineering  
**Milestone:** M1 — First Runtime Migration

---

## Purpose

Record the first production runtime migration of an HTTP route from the legacy scoring call chain to the **Decision Intelligence Engine facade**, establishing a repeatable pattern for Phase 3 without altering user-visible behavior.

This ADR closes Milestone M1 by documenting:

- What was migrated (`POST /api/finance/analyze` only)
- How behavioral parity was preserved
- What evidence validates the migration
- What risks were intentionally deferred to later milestones

---

## Context

METIORO's Phase 3 architecture introduces a single **Decision Pathway** orchestrated by the Decision Intelligence Engine ([DECISION_INTELLIGENCE_ENGINE.md](../architecture/DECISION_INTELLIGENCE_ENGINE.md)). Before M1, the engine existed only as a library facade (`packages/decision_engine/`) and an internal service entry point (`apps/api/src/services/decision_engine.py`). All HTTP routes still called the legacy pipeline directly:

```
score_with_context(...) → build_scoring_response(...)
```

The platform had multiple analyze endpoints (business, finance, real estate, calendar batch, pathfinder) sharing the same scoring and reasoning implementations but with no unified orchestration boundary. Migrating all routes at once would carry high regression risk and make rollback difficult.

Finance was selected as the first runtime migration because:

1. **Lower traffic surface** — consumed primarily by the legacy dashboard analyzer, not primary consumer navigation flows.
2. **Narrow action set** — six validated finance actions under `CONTEXT_ASK_ELECTIONAL`.
3. **Isolated rollback** — a single route file change can be reverted independently.
4. **Representative pattern** — finance shares the Ask/Electional scoring context with business while omitting `location_context` in its legacy response, exercising route-specific parity requirements.

The migration had to occur without modifying scoring logic (`packages/astro_engine/scoring.py`), reasoning logic (`packages/astro_engine/reasoning.py`), the scoring pipeline (`apps/api/src/services/scoring_pipeline.py`), API request/response schemas, or frontend consumers.

---

## Decision

Migrate **`POST /api/finance/analyze`** to call `generate_decision_outcome()` and return `outcome.source_activity_response`, replacing the direct legacy call chain inside the route handler only.

### Route change (conceptual)

**Before:**

```
FinanceAnalysisRequest
  → score_with_context(...)
  → build_scoring_response(...)
  → ActivityScoreResponse
```

**After:**

```
FinanceAnalysisRequest
  → DecisionRequest(module_origin="finance", include_location_context=False)
  → generate_decision_outcome(...)   [DecisionEngineFacade]
  → outcome.source_activity_response
  → ActivityScoreResponse
```

### Supporting facade adjustment

To preserve byte-level response parity, `DecisionRequest` gained an optional field:

| Field | Default | Finance value | Purpose |
|-------|---------|---------------|---------|
| `include_location_context` | `true` | `false` | Legacy finance route never passed `location_context` to `build_scoring_response`; business route does |

The facade continues to delegate to unchanged implementations:

- `services.scoring_pipeline.score_with_context`
- `schemas.score_breakdown.build_scoring_response`
- `packages.decision_engine.mapper.map_activity_response_to_decision_outcome`

No other HTTP routes were modified in M1.

---

## Architecture Before

```
┌─────────────────────────────────────────────────────────────┐
│  Experience Layer (Dashboard, Ask, Calendar, …)           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP
┌───────────────────────────▼─────────────────────────────────┐
│  FastAPI Routes                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ /business    │  │ /finance     │  │ /real-estate     │ │
│  │ /analyze     │  │ /analyze     │  │ /analyze         │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                    │           │
│         └─────────────────┼────────────────────┘           │
│                           │ direct calls                    │
│                           ▼                                 │
│              score_with_context()                           │
│                           ▼                                 │
│              build_scoring_response()                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Astro Engine (scoring.py, reasoning.py) — unchanged        │
└─────────────────────────────────────────────────────────────┘

DecisionEngineFacade existed but was not on the runtime path.
```

---

## Architecture After

```
┌─────────────────────────────────────────────────────────────┐
│  Experience Layer — unchanged                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (identical contracts)
┌───────────────────────────▼─────────────────────────────────┐
│  FastAPI Routes                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ /business    │  │ /finance ★   │  │ /real-estate     │ │
│  │ /analyze     │  │ /analyze     │  │ /analyze         │ │
│  │  (legacy)    │  │  (facade)    │  │  (legacy)        │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                    │           │
│         │ direct          │ generate_decision_outcome()   │
│         ▼                 ▼                    ▼           │
│  score_with_context   DecisionEngineFacade    (legacy)     │
│         │                 │                                 │
│         │                 ├─ score_with_context (same)      │
│         │                 ├─ build_scoring_response (same)  │
│         │                 └─ map → DecisionOutcome          │
│         ▼                 ▼                                 │
│  build_scoring_response   return source_activity_response   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Astro Engine — unchanged                                   │
└─────────────────────────────────────────────────────────────┘

★ = M1 migration boundary
```

---

## Why the Strangler Pattern Was Chosen

A **Strangler Fig** migration was chosen over a big-bang rewrite because:

1. **Incremental risk reduction** — one route at a time limits blast radius; a failed parity check triggers immediate single-commit rollback.
2. **Parallel operation** — legacy and facade-backed routes coexist; business and real-estate continue unchanged while finance proves the pattern.
3. **No dual scoring systems** — the facade is a thin orchestration wrapper, not a second engine; scoring and reasoning remain single-source in the astro engine.
4. **Governance alignment** — the Decision Intelligence Engine specification requires a single decision pathway; strangler migration is the lowest-risk path to that end state without service disruption.
5. **Test-driven confidence** — each route migration adds explicit legacy-vs-facade parity tests before the next route is touched.

Alternatives rejected:

| Alternative | Why rejected |
|-------------|--------------|
| Migrate all analyze routes simultaneously | High regression risk; difficult rollback; obscures route-specific response differences (e.g. `location_context`) |
| Replace scoring engine during migration | Violates Phase 1 constraint: no scoring or reasoning changes |
| Introduce new API response shape now | Violates frontend and contract stability requirements |
| Feature flag inside route | Adds runtime complexity without reducing migration scope |

---

## Why Behavioral Parity Was Required

METIORO's [Trust Architecture](../governance/TRUST_ARCHITECTURE.md) requires **consistency** and **transparency**. Users and downstream consumers (dashboard analyzer, score breakdown parsers) must not observe silent changes to scores, recommendations, reasoning, or HTTP semantics during an internal orchestration migration.

Parity requirements for M1:

| Dimension | Requirement |
|-----------|-------------|
| Response JSON | Identical keys and values vs legacy pipeline |
| HTTP status codes | 422 validation, 503 computation — unchanged |
| Validation | `FINANCE_ACTIONS` gate and Pydantic request patterns — unchanged |
| Exceptions | Same `ValueError` → 422, generic → 503 mapping |
| Scoring output | Same executive, strategic, technical, and reasoning layers |
| Frontend | No changes; continues consuming `ActivityScoreResponse` |

Parity was enforced by returning `outcome.source_activity_response` — the preserved legacy payload inside `DecisionOutcome` — rather than exposing new conceptual fields to HTTP consumers.

The `include_location_context=False` flag exists solely because legacy finance omitted the `location_context` response field while the facade default matches business route behavior (`include_location_context=True`).

---

## Testing Evidence

M1 is validated by **14 passing parity tests** across three layers:

### Layer 1 — Finance route parity (7 tests)

File: `apps/api/tests/test_finance_route_parity.py`

| Test | Coverage |
|------|----------|
| `test_finance_route_facade_matches_legacy_pipeline[investment]` | Full pipeline equality with evaluation coords |
| `test_finance_route_facade_matches_legacy_pipeline[finance_transaction]` | Same |
| `test_finance_route_facade_matches_legacy_pipeline[negotiation]` | Same |
| `test_finance_route_facade_matches_legacy_pipeline[contract_signing]` | Same |
| `test_finance_route_facade_matches_legacy_pipeline[invest]` | Same |
| `test_finance_route_facade_matches_legacy_pipeline[contract]` | Same |
| `test_finance_route_facade_matches_legacy_without_evaluation_coords` | Parity without evaluation location |

Each test asserts `facade_payload == legacy_payload`, validates against `ActivityScoreResponse`, and confirms `"location_context" not in response`.

### Layer 2 — Facade integration parity (2 tests)

| File | Test |
|------|------|
| `apps/api/tests/test_decision_engine_facade.py` | `test_facade_matches_existing_pipeline_recommendation_and_reasoning` |
| `packages/decision_engine/tests/test_facade.py` | `test_facade_delegates_without_transforming_score` |
| `packages/decision_engine/tests/test_facade.py` | `test_facade_omits_location_context_when_disabled` |

### Layer 3 — Outcome mapping integrity (4 tests)

File: `packages/decision_engine/tests/test_mapper.py`

| Test | Coverage |
|------|----------|
| `test_mapper_preserves_recommendation_and_score` | Executive layer mapping |
| `test_mapper_preserves_reasoning_confidence_and_evidence` | Reasoning and evidence mapping |
| `test_mapper_attaches_request_metadata` | Provenance metadata |
| `test_mapper_preserves_source_payload` | Full `source_activity_response` preservation |

### Regression suites (unchanged, re-run on migration)

- `apps/api/tests/test_score_breakdown_contract.py` — component breakdown API contract
- `apps/api/tests/test_reasoning_api.py` — reasoning payload contract

---

## Risks Intentionally Deferred

The following were explicitly out of scope for M1 and remain open:

| Risk / debt | Rationale for deferral |
|-------------|------------------------|
| `include_location_context` route-compat flag | Temporary shim until each route migrates with its own legacy response profile |
| Business route still on legacy pipeline | Next migration candidate; requires `include_location_context=True` |
| Real-estate route still on legacy pipeline | Likely requires `include_location_context=False` (matches current legacy) |
| Calendar batch / hourly routes | Higher volume; different response shapes (batch, hourly entries) |
| Pathfinder `/best-times` | Separate aggregated score model; not `ActivityScoreResponse` |
| Evidence Pipeline integration | Phase 3 downstream; facade currently wraps inline chart scoring |
| Explainability Engine integration | Phase 3 downstream; explanation mapped from existing reasoning only |
| Frontend migration to `DecisionOutcome` | Experience layer continues consuming legacy shapes |
| Removal of direct `score_with_context` imports from routes | Requires all routes migrated first |
| Public `DecisionOutcome` HTTP endpoints | Not until frontend and governance approve new contract |

---

## Future Migration Strategy

M1 establishes the repeatable migration playbook for M2+:

### Per-route migration checklist

1. **Identify legacy call profile** — document exact `score_with_context` and `build_scoring_response` arguments (especially `location_context`, `target_time`, house system).
2. **Map to `DecisionRequest`** — set `module_origin`, `decision_intent`, `context`, and route-compat flags.
3. **Add parity tests** — legacy pipeline vs `generate_decision_outcome().source_activity_response` for all action types.
4. **Migrate route handler only** — replace internal call chain; preserve validation and exception mapping.
5. **Run full regression** — score breakdown contract, reasoning API, facade, and route parity suites.
6. **Single-commit rollback** — each migration isolated to one revertible commit.

### Recommended migration order

| Milestone | Route | Notes |
|-----------|-------|-------|
| **M1 (complete)** | `POST /api/finance/analyze` | `include_location_context=False` |
| M2 | `POST /api/real-estate/analyze` | Same response profile as finance |
| M3 | `POST /api/business/analyze` | `include_location_context=True`; includes chart endpoint separately |
| M4 | Calendar batch / hourly | Batch response shapes; higher traffic |
| M5 | Pathfinder | Different score model — requires ADR extension |
| M6 | Remove legacy direct imports; deprecate route-compat flags | Final strangler completion |

### Rollback procedure

If parity fails post-deploy, revert the single finance route migration commit. The facade and `DecisionRequest` extensions are backward-compatible (`include_location_context` defaults to `true`) and do not require rollback unless a facade bug is discovered.

---

## Consequences

### Positive

- First HTTP route now flows through the Decision Intelligence Engine facade, validating the Phase 3 orchestration boundary in production.
- Repeatable migration pattern with explicit parity testing is established.
- `DecisionOutcome` and provenance metadata are now produced for finance requests (available for future observability and governance audit, even though not yet exposed via HTTP).
- Rollback is a single-commit revert.

### Negative / trade-offs

- Temporary dual-path architecture: finance uses facade; other routes use legacy direct calls.
- `include_location_context` adds conceptual surface area until all routes migrate.
- Facade unit tests require mock delegates that mirror `build_scoring_response` location-context semantics.

---

## Alternatives Considered

See [Why the Strangler Pattern Was Chosen](#why-the-strangler-pattern-was-chosen).

---

## References

- [DECISION_INTELLIGENCE_ENGINE.md](../architecture/DECISION_INTELLIGENCE_ENGINE.md) — canonical engine specification
- [PHASE3_ARCHITECTURE_BLUEPRINT.md](../architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md) — platform evolution context
- [TRUST_ARCHITECTURE.md](../governance/TRUST_ARCHITECTURE.md) — consistency and transparency requirements
- `packages/decision_engine/README.md` — facade implementation and mapping table
- `apps/api/src/routes/finance.py` — migrated route
- `apps/api/src/services/decision_engine.py` — internal `generate_decision_outcome()` entry point
- `apps/api/tests/test_finance_route_parity.py` — M1 parity test suite
