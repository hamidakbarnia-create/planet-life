# METIORO Decision Intelligence Engine — Facade

**Version:** 1.0.0 (Phase 3, Sprint 1)

## Purpose

This package implements the first **Decision Intelligence Engine facade** — the single public entry point for decision generation in METIORO's Phase 3 architecture.

The facade wraps the existing astrology scoring implementation without changing behavior. It introduces conceptual models (`DecisionRequest`, `DecisionOutcome`) aligned with [DECISION_INTELLIGENCE_ENGINE.md](../../docs/architecture/DECISION_INTELLIGENCE_ENGINE.md).

## Architecture

```
DecisionRequest
    ↓
DecisionEngineFacade.generate()
    ↓
services.scoring_pipeline.score_with_context()   ← unchanged
    ↓
schemas.score_breakdown.build_scoring_response() ← unchanged
    ↓
mapper.map_activity_response_to_decision_outcome()
    ↓
DecisionOutcome
```

| Module | Responsibility |
|--------|----------------|
| `models.py` | Conceptual types — Recommendation, Confidence, EvidenceReference, Explanation, Metadata |
| `mapper.py` | Transform `ActivityScoreResponse` → `DecisionOutcome` (no calculations) |
| `facade.py` | Orchestrate existing pipeline + mapping |

## Current Wrapper Role

Phase 1 is a **pure delegation wrapper**:

- **No new scoring** — `packages/astro_engine/scoring.py` remains the source of truth
- **No new reasoning** — `packages/astro_engine/reasoning.py` remains the source of truth
- **No API contract changes** — existing endpoints are untouched
- **No frontend changes** — UI continues to consume legacy response shapes

Internal integration lives in `apps/api/src/services/decision_engine.py`:

```python
from services.decision_engine import generate_decision_outcome
from packages.decision_engine import DecisionRequest
```

## Mapping Decisions

| DecisionOutcome field | Source |
|-----------------------|--------|
| `recommendation.*` | `executive` layer |
| `confidence.value` | `reasoning.confidence` when present |
| `confidence.rating` | `executive.rating` |
| `evidence_references[]` | `reasoning.reasons[]` |
| `explanation.*` | `reasoning` + `executive.recommendation` |
| `metadata.*` | `DecisionRequest` + `technical` + `component_breakdown` |
| `source_activity_response` | Full preserved payload for traceability |

Values are never invented. Missing reasoning yields empty evidence lists and explanation reasons derived only from executive fields.

## Future Evolution

1. **Route all modules through the facade** — replace direct `score_with_context` calls in API routes
2. **Evidence Pipeline integration** — accept Evidence Bundles at intake instead of inline chart scoring
3. **Explainability Engine integration** — produce Explanation Packages downstream of DecisionOutcome
4. **Additional frameworks** — extend metadata and evidence references beyond `astrology_scoring`
5. **Public API surface** — expose DecisionOutcome via new endpoints once frontend migrates

## Related Documents

- [Decision Intelligence Engine Specification](../../docs/architecture/DECISION_INTELLIGENCE_ENGINE.md)
- [Evidence Pipeline Specification](../../docs/architecture/EVIDENCE_PIPELINE_SPECIFICATION.md)
- [Explainability Engine Specification](../../docs/architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md)
- [Phase 3 Architecture Blueprint](../../docs/architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md)
