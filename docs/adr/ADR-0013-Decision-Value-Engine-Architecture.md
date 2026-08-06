# ADR-0013 — Decision Value Engine Architecture

**Status:** Proposed
**Date:** 2026-07-29
**Decision makers:** Product and Engineering
**Scope:** Future technical architecture boundaries and data flow for a Decision Value Engine
**Coding authorization:** **Not granted.** This ADR does not authorize implementation.

---

## Context

METIORO has locked Decision Value **semantics** and **Producer responsibilities**:

- [PRG-04](../governance/PRG-04-decision-value-semantics.md) — Decision Value = fitness of a specific decision to the current relevant context (Context Fitness).
- [PRG-05](../governance/PRG-05-decision-value-producer-model.md) — Producer inputs, logical outputs, combination boundaries, insufficiency behavior, ownership.
- [PRG-02](../governance/PRG-02-reading-contract-presence-validity-gates.md) Variant A and the [Reading Contract](../architecture/READING-CONTRACT-SPECIFICATION.md) — presence validation and governed Reading envelope.
- Presentation remains a pure consumer.

Without an architecture ADR, future implementation risks:

- collapsing Timing Score into Decision Value;
- inventing numeric weights or probability-like Value;
- treating presentation as a Value calculator;
- creating a parallel Reading schema;
- wiring Ask/Calendar/Today prematurely;
- representing a Timing-only prototype as a complete Decision Value model.

This ADR defines **architecture only**.

---

## Decision

### 1. Sources of truth (unchanged)

| Concern | Authority |
|---------|-----------|
| Meaning of Decision Value | PRG-04 |
| Producer responsibilities and approved logical outputs | PRG-05 |
| Presence validation and Reading envelope | PRG-02 + Reading Contract |
| Presentation | Pure consumer |

This ADR **MUST NOT** modify PRG-04, PRG-05, PRG-02, or the Reading Contract.

### 2. Architecture flow

```
Domain Producers
  → Context Signals
  → Decision Value Engine
  → Producer-owned Decision Value output
  → Reading Contract
  → Consumer surface
```

### 3. Logical components

#### 3.1 Decision Intake

Receives **one specific decision** and identifiable intent.

#### 3.2 Context Resolver

Determines which available context dimensions are relevant to that decision.

#### 3.3 Signal Eligibility Gate

Excludes stale, unauthorized, unavailable, or irrelevant signals.

#### 3.4 Context Conflict Assessor

Identifies material agreement, conflict, and unresolved ambiguity.

#### 3.5 Value Evaluator

Produces only the approved v1 Value Band:

- High
- Moderate
- Low
- Insufficient Context

#### 3.6 Reasoning Composer

Explains current-context fit **without** predicting the outcome.

#### 3.7 Uncertainty Assessor

Preserves uncertainty and missing context.
**MUST NOT** derive Confidence from Score, presence, or completeness.

#### 3.8 Traceability Recorder

Records which context dimensions and Producer outputs materially contributed to the assessment.

#### 3.9 Reading Adapter

Places Producer-owned output into the approved Reading envelope.
**MUST NOT** create, reinterpret, or repair domain meaning.
**MUST** remain subordinate to the Reading Contract.

### 4. Binding architecture rules

1. The Engine evaluates **one specific decision**.
2. The Engine does **not** evaluate generic days, people, places, or charts.
3. Context Producers retain ownership of their signals.
4. The Engine **MUST NOT** silently modify Producer signals.
5. Irrelevant context **MUST** be excluded.
6. Missing required context **MUST NOT** be fabricated.
7. A single favorable signal **MUST NOT** automatically generate High Value.
8. Timing Score **MUST NOT** be mapped directly to Decision Value.
9. Conflicting material context **MUST** remain visible.
10. Insufficient Context is a valid governed outcome.
11. Value Band is **not** Confidence.
12. Value Band is **not** probability.
13. Value Band is **not** outcome prediction.
14. Presentation **MUST NOT** recompute or reinterpret Value.
15. Reading Adapter **MUST** remain subordinate to the Reading Contract.
16. The Engine **MUST** preserve traceability.
17. No numeric weights, thresholds, or calibrated probabilities are authorized by this ADR.

### 5. Fail-closed behavior

| Condition | Behavior |
|-----------|----------|
| No specific decision | No assessment |
| No identifiable intent | Insufficient Context **or** no assessment, according to Producer policy documented later |
| Missing materially required context | Insufficient Context |
| Producer failure | No fabricated fallback |
| Invalid Reading presence | Rejected by the Reading Contract |
| Material conflict | Preserved in reasoning and uncertainty |

### 6. Future reference vertical slice (non-authorization)

Reference path only:

```
Ask
  → explicit decision
  → authorized context inputs
  → Decision Value Engine
  → Reading Contract
  → Ask result
```

Clarify:

- This is a **future architecture reference only**.
- It does **not** authorize Ask integration.
- A Timing-only prototype **MUST NOT** be represented as a complete Decision Value model.
- Timing alone **MUST NOT** automatically produce High Value.
- Insufficient Context remains valid when available context is insufficient.

### 7. Relationship to ADR-0005 / Ask orchestration

- ADR-0005 (Decision Engine Facade) addresses runtime migration of the decision execution facade — **not** Decision Value Context Fitness.
- Ask “orchestration” observability (e.g. P2.2-04) is operational instrumentation — **not** a Decision Value Engine architecture.
- Neither substitutes for this ADR.

---

## Consequences

### Becomes clearer

- Technical component boundaries for a future Value Engine.
- Separation of Context Producers, Value evaluation, Reading envelope, and presentation.
- Fail-closed and insufficiency behavior as architectural constraints.
- Guardrails against Timing→Value collapse and false precision.

### Remains blocked / harder without further authorization

- Any implementation, codebase, types, APIs, schemas, prompts, UI, or surface wiring.
- Numeric scoring, weighting, thresholds, or calibrated probabilities.
- Claiming a Timing-only path as full Decision Value.

---

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Map Timing Score directly to Value Band | Violates PRG-04 / PRG-05; predictive/false composition |
| Presentation computes Value from displayed scores | Violates pure-consumer rule |
| Parallel Value schema outside Reading Contract | Competing specification; architectural drift |
| Require alternatives / Decision Advantage in v1 | Not authorized by PRG-04 |
| Authorize Ask wiring in this ADR | Premature; needs separate implementation approval |

---

## Explicit non-effect

This ADR does **not** authorize:

- implementation
- a Value Engine codebase
- TypeScript or Python types
- APIs
- transport or database schemas
- prompts
- model selection
- numeric scoring
- weighting
- thresholds
- UI
- Ask wiring
- Calendar or Today wiring
- People, Pathfinder, World, Julia, or Vault wiring
- ReadingResult wiring
- Confidence derivation
- outcome prediction
- changes to PRG-04, PRG-05, PRG-02, or the Reading Contract

---

## References

- [PRG-04 — Decision Value Semantics](../governance/PRG-04-decision-value-semantics.md)
- [PRG-05 — Decision Value Producer Model](../governance/PRG-05-decision-value-producer-model.md)
- [PRG-02 — Reading Contract Presence & Validity Gates](../governance/PRG-02-reading-contract-presence-validity-gates.md)
- [READING-CONTRACT-SPECIFICATION.md](../architecture/READING-CONTRACT-SPECIFICATION.md)
- [ADR-0012 — Today and Shared Timing Architecture](./ADR-0012-Today-and-Shared-Timing-Architecture.md) (timing as Context input surface; not Value)
- [ADR-0005 — Decision Engine Facade](./ADR-0005-Decision-Engine-Facade-First-Runtime-Migration.md) (distinct concern)
