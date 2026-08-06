# PRG-04 — Decision Value Semantics

| Field | Value |
|-------|-------|
| **Document ID** | PRG-04 |
| **Title** | Decision Value Semantics |
| **Status** | **Accepted** |
| **Date** | 2026-07-29 |
| **Authority** | Product / domain semantics (Producer-owned meaning) |
| **Branch** | `governance-foundation` |
| **Related** | [PRG-02](./PRG-02-reading-contract-presence-validity-gates.md) (Accepted Variant A — presence gates); [READING-CONTRACT-SPECIFICATION.md](../architecture/READING-CONTRACT-SPECIFICATION.md) (Proposed envelope; coding not granted) |
| **Coding authorization** | **Not granted.** Acceptance of PRG-04 does **not** authorize Value Engine, API, schema, UI, prompts, ReadingResult wiring, or application code. |

---

## Purpose

Define the **domain meaning** of Decision Value for METIORO.

PRG-04 defines **semantics**. It does **not** define a Reading schema, validation contract, algorithm, or presentation system.

---

## Accepted domain decision

**Decision Value** is the **fitness of a specific decision to the current relevant context**.

Decision Value evaluates **present contextual fit**.
It does **not** predict or guarantee the future outcome.

---

## Epistemic boundary

METIORO **MAY** assess how well a specific decision fits the currently available relevant context.

METIORO **MUST NOT** represent that contextual fit as knowledge of the future result.

---

## Decision Value is not

- outcome prediction
- probability of success
- expected outcome
- generic utility
- decision advantage against unobserved alternatives
- confidence
- certainty
- luck
- a timing score
- a relationship score
- a location score
- a world signal
- a guarantee

---

## Approved v1 top-level Value representation

Authorized Value Band labels (v1):

- **High**
- **Moderate**
- **Low**
- **Insufficient Context**

**Not authorized in v1:**

- numeric scores
- percentages
- decimal values
- rankings that imply calibrated precision
- probability-like Value representations

---

## Required semantic basis

A Decision Value assessment requires:

- a **specific decision**
- identifiable **intent or purpose**
- **relevant current context**
- applicable **Producer signals**
- **Producer-owned reasoning**
- **Producer-owned uncertainty** where required by the Reading Contract

**Alternatives are not required** for Context Fitness.

Alternatives would become necessary only for a future comparative concept such as **Decision Advantage**. **Decision Advantage is not authorized by PRG-04.**

---

## Context inputs vs Decision Value

Timing, relationship, world, location, and personal / Vault signals are **Context inputs**.

Decision Value **evaluates a specific decision** against relevant current context. Context inputs are not themselves Decision Value.

---

## Binding rules

1. Decision Value applies to a **specific decision**, not generically to a person, day, relationship, place, or chart.
2. Timing Score is a Context input, not Decision Value.
3. Relationship signals are Context inputs, not Decision Value.
4. Location signals are Context inputs, not Decision Value.
5. World signals are Context inputs, not Decision Value.
6. Personal and Vault context may be inputs, but are not themselves Decision Value.
7. A favorable Context input does **not** automatically produce High Value.
8. Value Band is **not** Confidence.
9. Value Band is **not** outcome probability.
10. Value Band is **not** a guarantee.
11. Presence or completeness **MUST NOT** be converted into Value or Confidence.
12. Presentation **MUST NOT** calculate, infer, upgrade, downgrade, reinterpret, or fabricate Decision Value.
13. Producer owns Value semantics, reasoning, uncertainty, and future calibration policy.
14. Reading Contract owns the governed output envelope.
15. Presentation remains a **pure consumer**.
16. Missing required Producer output **MUST** fail closed according to the Reading Contract and **MUST NOT** receive fallback content.

---

## Relationship to the Reading Contract

- PRG-04 defines the **domain meaning** of Decision Value.
- The Reading Contract defines the governed **Reading envelope**.
- PRG-04 **MUST NOT** create a parallel Reading schema.
- PRG-04 **MUST NOT** modify Variant A ownership boundaries ([PRG-02](./PRG-02-reading-contract-presence-validity-gates.md)).
- Score remains distinct from Confidence.
- Value remains distinct from Confidence.

---

## Ownership summary

| Concern | Owner |
|---------|--------|
| Decision Value meaning (Context Fitness) | Producer (PRG-04) |
| Value Band calibration / thresholds | Producer (future; **not authorized** by PRG-04) |
| Reading envelope / presence fail-closed | Reading Contract + PRG-02 Variant A |
| Presentation layout / labels without reinterpretation | Presentation (pure consumer) |

---

## Explicit non-effect

PRG-04 does **not** authorize:

- a Value Engine
- a Value algorithm
- calibration thresholds
- numeric Value scoring
- a Value API
- a database or transport schema
- ReadingResult wiring
- application code
- prompt changes
- UI changes
- Value integration into Ask
- Value integration into Calendar or Today
- Value integration into People, Pathfinder, World, Julia, or Vault
- Confidence derivation
- outcome prediction
- changes to the Reading Contract

---

## Traceability notes

- Programme ID **PRG-03** remains allocated to Production News Provider Evaluation and is **not** reused here.
- Historical **PRG-02** ID overload (World News Freshness in `MASTER_STATUS` vs Reading Contract presence gates) is pre-existing governance debt and is **out of scope** for PRG-04.
