# METIORO Architecture Decision Records — Index

> Status: Review

**Version:** 1.0.0

**Authority:** This document derives from [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (governance instrument).

**Purpose:** Index of Architecture Decision Records for structural and cross-cutting technical decisions affecting Level 3 and above.

---

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-0001 | Governance Hierarchy | Superseded | 2026-07-05 |
| ADR-0002 | Navigation Model | Proposed | — |
| ADR-0003 | Logo Selection | Proposed | — |
| ADR-0004 | Trust Architecture | Superseded | 2026-07-05 |
| ADR-0005 | Decision Engine Facade — First Runtime Migration | Accepted | 2026-07-05 |
| ADR-DS-001 | Design System Architecture v1 | Proposed | 2026-07-07 |
| ADR-DS-002 | Runtime Semantic Token Consumption | Proposed | 2026-07-07 |

**ADR-DS-001 note:** Target architecture for design tokens. Implementation: [design-token-registry.md](../design/system/design-token-registry.md) (DS-01).

**ADR-DS-002 note:** Runtime map consumption contract. Extends ADR-DS-001 Principle 3. Implementation deferred.

**ADR-0001 note:** Superseded by [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (Chapter 0, Chapter 5, Appendix A) and [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md). Governance hierarchy is a constitutional and meta-governance concern, not an architecture decision record.

**ADR-0004 note:** Superseded by [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) (Level 1 governance document). Trust Architecture is not an architecture decision record.

---

## ADR Template

Use this template when creating a new ADR. Store ADR files in `docs/adr/` using the naming convention `ADR-NNNN-short-title.md`.

```markdown
# ADR-NNNN: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNNN
**Date:** YYYY-MM-DD
**Decision makers:** [Names or roles]

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

## Alternatives Considered

What other options were evaluated and why were they rejected?

## References

Links to related decisions, documents, PRs, or issues.
```

---

## Rules

1. Every architecture change at Level 3 or above in the [Document Hierarchy](./DOCUMENT_HIERARCHY.md) requires an ADR.
2. ADRs are append-only — status may change but content is not deleted.
3. Superseded ADRs must reference the document that replaces them.
4. New ADRs must be added to the index table above.
5. ADR identifiers use four-digit zero-padded numbering (e.g. `ADR-0001`, not `ADR-001`).
