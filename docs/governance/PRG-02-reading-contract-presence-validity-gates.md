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

---

## Post-ratification verification evidence

**Verified:** 2026-07-29  
**Purpose:** Confirm the Accepted PRG-02 claim of no competing Reading validation contract with search evidence (not assertion-only).

### Command

```bash
grep -ri "reading contract\|reading schema\|confidence.*validation" \
  docs/ apps/ packages/ \
  --include=*.md \
  --include=*.ts \
  --include=*.py \
  -l
```

### Results

| Path | Classification |
|------|----------------|
| `docs/architecture/READING-CONTRACT-SPECIFICATION.md` | Canonical Reading Contract source of truth |
| `docs/governance/PRG-02-reading-contract-presence-validity-gates.md` | Accepted PRG-02 governance decision |
| `docs/governance/DECISION_LOG.md` | Official decision record |
| `docs/adr/ADR-0012-Today-and-Shared-Timing-Architecture.md` | Reference to possible Reading Contract governance only — does **not** define a competing Reading schema or validation contract |

### Conclusion

No competing Reading Contract, Reading schema, or Reading confidence validation contract was found using the approved verification search.

This evidence supports the existing Accepted PRG-02 decision. It does **not** restate, amend, or reopen Variant A semantics. It does **not** authorize Reading implementation.

---

## Non-blocking semantic debt (adjacent; not a competing Reading Contract)

`apps/web/lib/intelligence/` defines `InsightConfidence` and `validatePersonalIntelligenceProfile`.

- This is **not** a competing Reading Contract, Reading schema, or Reading confidence validation contract under the search above.
- Its confidence semantics **MUST** later be reconciled with the locked rule that Score, presence, completeness, and Confidence are distinct concepts.
- Tracking this debt does **not** change PRG-02 Accepted status and does **not** authorize remediation coding.
