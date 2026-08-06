# PRG-05 — Decision Value Producer Model

| Field | Value |
|-------|-------|
| **Document ID** | PRG-05 |
| **Title** | Decision Value Producer Model |
| **Status** | **Accepted** |
| **Date** | 2026-07-29 |
| **Authority** | Product / Producer responsibility |
| **Branch** | `governance-foundation` |
| **Semantics SoT** | [PRG-04 — Decision Value Semantics](./PRG-04-decision-value-semantics.md) (**Accepted**) |
| **Related** | [PRG-02](./PRG-02-reading-contract-presence-validity-gates.md) (Variant A); [READING-CONTRACT-SPECIFICATION.md](../architecture/READING-CONTRACT-SPECIFICATION.md) |
| **Coding authorization** | **Not granted.** Acceptance of PRG-05 does **not** authorize a Value Engine, algorithm, API, schema, UI, prompts, ReadingResult wiring, or application code. |

---

## Purpose

Define the **minimum producer inputs**, **output responsibilities**, **combination boundaries**, **insufficiency behavior**, **reasoning ownership**, and **uncertainty ownership** required to produce Decision Value.

PRG-05 defines **Producer responsibilities**. It does **not** redefine Decision Value semantics, create a Reading schema, or authorize implementation.

---

## Semantics source of truth (unchanged)

[PRG-04](./PRG-04-decision-value-semantics.md) remains the source of truth:

**Decision Value** is the **fitness of a specific decision to the current relevant context**.

PRG-05 **MUST NOT** modify PRG-04 semantics.

---

## Required semantic basis

A Producer Value assessment requires:

- a **specific decision**
- identifiable **intent or purpose**
- **currently relevant context**
- applicable **producer signals**
- known **constraints**

---

## Potential context inputs

Potential context inputs **MAY** include:

- Timing Context
- Relationship Context
- Location Context
- World Context
- Personal Context
- Vault-derived context, when authorized and relevant

These are **inputs only**. None is independently Decision Value.

---

## Approved v1 producer output

Logical producer output fields for v1 (names are logical; not a transport or database schema):

| Field | Role |
|-------|------|
| `value_band` | Top-level Decision Value Band |
| `reasoning` | Producer-owned explanation of the assessment |
| `relevant_context` | Context dimensions actually used |
| `uncertainty` | Producer-owned uncertainty disclosure |
| `missing_context` | Material context that was needed but unavailable |

### Approved `value_band` values

- **High**
- **Moderate**
- **Low**
- **Insufficient Context**

Numeric Value, percentages, decimals, and probability-like Value representations remain **not authorized** (PRG-04).

---

## Binding rules

1. Producer evaluates **one specific decision** against relevant current context.
2. Producer **MUST** identify which available context dimensions are relevant.
3. Irrelevant context **MUST NOT** influence the Value assessment.
4. A single favorable signal **MUST NOT** automatically produce High Value.
5. A favorable Timing Score **MUST NOT** automatically produce High Value.
6. Conflicting context **MUST NOT** be hidden.
7. Material conflict **MUST** appear in reasoning and uncertainty.
8. Missing required context **MUST NOT** be inferred, synthesized, or replaced with fallback content.
9. When available context is insufficient for an honest assessment, `value_band` **MUST** be **Insufficient Context**.
10. **Insufficient Context** is a governed outcome, not an error to conceal.
11. Producer owns Value semantics, context selection, reasoning, uncertainty, and future calibration policy.
12. Reading Contract owns presence validation and the governed envelope.
13. Presentation remains a **pure consumer**.
14. Presentation **MUST NOT** calculate, infer, upgrade, downgrade, reinterpret, or fabricate Value.
15. Value Band is **not** Confidence.
16. Value Band is **not** outcome probability.
17. Raw context scores **MUST NOT** be exposed as an implied Value formula unless separately authorized.
18. Producer **MUST** preserve traceability to the context dimensions actually used in the assessment.

---

## Combination boundaries

- Context dimensions may be combined only as **Producer-owned judgment** of contextual fit for the specific decision.
- PRG-05 does **not** define weights, formulas, thresholds, or aggregation algorithms.
- Favorable inputs do not compose into High Value by default.
- Conflict and insufficiency remain first-class Producer responsibilities.

---

## Insufficiency behavior

When the Producer cannot honestly assess Context Fitness:

1. `value_band` **MUST** be **Insufficient Context**.
2. `missing_context` **MUST** identify what was needed and unavailable (to the extent known).
3. Reasoning and uncertainty **MUST NOT** invent missing evidence.
4. Presentation **MUST NOT** substitute fallback Value content.

---

## Ownership

| Concern | Owner |
|---------|--------|
| Decision Value meaning | PRG-04 (Producer semantics SoT) |
| Context selection, combination judgment, reasoning, uncertainty, missing_context | Producer (PRG-05) |
| Future calibration policy | Producer (future; **not authorized** by PRG-05) |
| Presence / fail-closed envelope | Reading Contract + PRG-02 Variant A |
| Presentation | Pure consumer |

---

## Explicitly not defined

PRG-05 does **not** define:

- numeric weights
- scoring formulas
- numeric thresholds
- calibrated probabilities
- model-selection policy
- machine-learning architecture
- prompt implementation
- API schemas
- transport schemas
- database models
- application types
- UI
- Ask integration
- Calendar or Today integration
- People, Pathfinder, World, Julia, or Vault integration

---

## Explicit non-effect

PRG-05 does **not**:

- authorize a Value Engine or any application coding
- modify PRG-04 semantics
- modify the Reading Contract
- authorize numeric Value
- authorize Decision Advantage
- authorize Confidence derivation from Value, Score, presence, or completeness

---

## Traceability notes

- Programme IDs **PRG-03** (News Provider Evaluation) and historical **PRG-02** overload remain out of scope.
- Logical field names (`value_band`, etc.) are documentation aids only — **not** an authorized schema.
