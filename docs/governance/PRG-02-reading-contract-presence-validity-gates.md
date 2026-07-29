# PRG-02 — Reading Contract Presence & Validity Gates

| Field | Value |
|-------|-------|
| **Document ID** | PRG-02 |
| **Title** | Reading Contract Presence & Validity Gates |
| **Status** | **Accepted** (Variant A) |
| **Date** | 2026-07-29 |
| **Authority** | Product / Reading Contract governance |
| **Branch** | `governance-foundation` |
| **Normative reference** | [READING-CONTRACT-SPECIFICATION.md](../architecture/READING-CONTRACT-SPECIFICATION.md) |
| **Coding authorization** | **Not granted.** Acceptance of Variant A does **not** authorize Reading producers, consumers, UI wiring, scoring changes, or runtime implementation. |

---

## Decision

The Reading Contract adopts **Variant A**.

- **Presence** is enforced by the Reading Contract using a **fail-closed** policy.
- **Semantic validity**, calibration, and correctness remain the responsibility of the **producing domain service**.

---

## Rules

1. Required fields **MUST** be present before a Reading is considered valid for presentation.
2. Missing required fields **MUST NOT** be inferred, synthesized, or replaced by fallback values.
3. Presentation layers **MUST NOT** reinterpret producer output.
4. Consumers **MUST NOT** derive Confidence from Score.
5. Consumers **MUST NOT** derive Confidence from Presence or completeness.
6. Score and Confidence are **independent** concepts.
7. Value **MUST NOT** be represented with false precision outside approved semantics.
8. Any future validity procedure belongs to **Producer** implementations and calibration policy, **not** to the Reading Contract.

---

## Notes

- Presence validation is part of the Reading Contract.
- Semantic validation belongs to Producers.
- Presentation remains a pure consumer.
- Reading Contract defines **structure**, not meaning.
- Producer owns meaning.

---

## Explicit non-authorizations

This Accepted decision does **not**:

- Accept the full Reading Contract Specification for coding
- Authorize Calendar, Today, Ask, Vault, or any surface to emit or consume `ReadingResult` at runtime
- Authorize mapping Score → Confidence
- Authorize UI invention of missing Reading fields
- Change score engines, thresholds, transport, or APIs

---

## Traceability

| Concern | Owner after PRG-02 |
|---------|-------------------|
| Required-field presence / fail-closed envelope | Reading Contract |
| Meaning, calibration, semantic correctness of field values | Producer domain service |
| Layout, collapse, label simplification without reinterpretation | Presentation |
| Score timing estimates (Calendar / Today) | Existing timing producers — **not** Reading Confidence |
