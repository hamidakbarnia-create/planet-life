# ADR-0014 — Decision Case System of Record and Pathway Consolidation

**Status:** **RATIFIED**
**Date:** 2026-08-04
**Decision makers:** Architecture Consolidation Board → Product Owner
**Coding authorization:** Granted for EPIC-001 Decision Case v1 per engineering execution specification only. No architecture redesign. No scope expansion beyond EPIC-001.
**Supersedes in part:** ADR-0006 (decision-bearing semantics), ADR-0007 (decision-bearing authority without Case package)
**Does not delete:** ADR-0006/0007 wire shapes during migration phases M1–M3

---

## Context

The Architecture Review Board found Implementation Readiness **FAIL** because multiple primary objects and decision-bearing pathways coexist, and locked API contracts cannot carry the Decision Evaluation Contract required by product architecture.

The Architecture Consolidation Resolution ([ACR-0001](../architecture/ARCHITECTURE_CONSOLIDATION_RESOLUTION.md)) consolidates authority, object model, contract, state machine, repository, evidence eligibility, pathway, and migration **without new product features**.

This ADR records the engineering-binding decisions required for that consolidation.

---

## Decision

### 1. Primary object

**Decision Case** is the only system of record for decision work.

### 2. Evaluation pathway

All decision-bearing recommendations MUST be produced by:

```
Decision Case → Decision Intelligence Engine → DecisionEvaluationPackage v1
```

No surface may invent recommendation stance. Conversation, Ask client assembly, Decision Value, and Reading consumers are not evaluators.

### 3. Decision Evaluation Contract v1

Decision-bearing outputs MUST conform to `DecisionEvaluationPackage` module set defined in ACR-0001 §B3. Lossy projections to ADR-0006 `summary` or ADR-0007 `reasoning`/`uncertainty`/`sources` are compatibility-only.

### 4. State machine

Case lifecycle states and transitions are exclusively those in ACR-0001 §B4. API processing success ≠ Case state `completed`.

### 5. Repository

Decision Case Repository owns Case aggregates listed in ACR-0001 §B5. CMG MemoryRecords are not Case SoR.

### 6. Evidence

Evidence eligibility states in ACR-0001 §B6 are normative. After migration phase M2, decision-bearing responses with unsupported/empty evidence claims are rejected.

### 7. Migration

Phased M0–M4 per ACR-0001 §B8. No flag-day rewrite. Dual-write required in M1.

### 8. Supersession

| Prior ADR | Effect |
|-----------|--------|
| ADR-0006 | Remains LOCKED for v1 wire until v2; **decision-bearing semantics** subordinated to this ADR + ACR. v2 MUST carry `case_id` + package or package reference. |
| ADR-0007 | Remains LOCKED for conversational transport; **decision type without Case Evaluation Package** is deprecated and forbidden after M2. |
| ADR-0009 | Must be amended to Case Repository context boundaries (follow-on). |
| ADR-0013 | Decision Value is a context-fitness signal only; not a parallel recommendation engine. |

---

## Consequences

### Positive

- One SoR, one pathway, one contract — ARB implementation blockers B2–B8 addressable.
- Provider/model swap does not redefine recommendation ownership.

### Negative / cost

- Dual-write period increases engineering cost.
- ADR-0006/0007 clients need deprecation window.
- Provisional evidence required until registry populated.

### Neutral

- No new user-facing features mandated by this ADR.

---

## Compliance

Work that emits decision-bearing guidance outside the Case → Engine → Package pathway after M2 is a defect, not a product variant.

---

## References

- [ARCHITECTURE_CONSOLIDATION_RESOLUTION.md](../architecture/ARCHITECTURE_CONSOLIDATION_RESOLUTION.md)
- [METIORO_PRODUCT_CONSTITUTION.md](../governance/METIORO_PRODUCT_CONSTITUTION.md)
- Decision Quality Standard — draft/future artifact; not committed in this repository baseline
- [ADR-0006](./ADR-0006-Decision-API-Contract-v1.md)
- [ADR-0007](./ADR-0007-Conversation-API-Contract-v1.md)
