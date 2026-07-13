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
| ADR-0006 | Decision API Contract v1 | LOCKED | 2026-07-10 |
| ADR-0007 | Conversation API Contract v1 | LOCKED | 2026-07-13 |
| ADR-0007-A1 | Conversation API Public HTTP Route Clarification | APPROVED TO COMMIT | 2026-07-13 |
| ADR-DS-001 | Design System Architecture v1 | Proposed | 2026-07-07 |
| ADR-DS-002 | Runtime Semantic Token Consumption | Proposed | 2026-07-07 |

**ADR-DS-001 note:** Target architecture for design tokens. Implementation: [design-token-registry.md](../design/system/design-token-registry.md) (DS-01).

**ADR-DS-002 note:** Runtime map consumption contract. Extends ADR-DS-001 Principle 3. Implementation deferred.

**ADR-0001 note:** Superseded by [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (Chapter 0, Chapter 5, Appendix A) and [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md). Governance hierarchy is a constitutional and meta-governance concern, not an architecture decision record.

**ADR-0004 note:** Superseded by [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) (Level 1 governance document). Trust Architecture is not an architecture decision record.

**ADR-0006 note:** LOCKED HTTP contract for `POST /api/v1/decision/execute`. Full text: [ADR-0006-Decision-API-Contract-v1.md](../adr/ADR-0006-Decision-API-Contract-v1.md). Corrected 2026-07-10 after Sprint 6A Step 0 drift from commit `973ce88`. Implementation boundary clarification added 2026-07-10 (Sprint 6A Step 0 — legacy engine mapping deferred). Supersedes requires v2 ADR.

**ADR-0007 note:** ADR-0007 is LOCKED. Full text: [ADR-0007-Conversation-API-Contract-v1.md](../adr/ADR-0007-Conversation-API-Contract-v1.md). Conversation API contract for Sprint P1 Live Conversation MVP: stateless client-supplied history; provider-agnostic generation; derived astrological context (Option B); decision/conversational discriminator with Constraint 4a explainability. Hard ceilings: 20 messages, 32 KiB, 30s timeout. Prompt Governance Spec v1 required (Brand Voice Layer pending). Amendment A1 — method/path/versioning clarification. A1 current status = APPROVED TO COMMIT. A1 has its own lifecycle and MUST NOT be represented as RATIFIED or LOCKED before approval and commit. Decisions D1–D13 remain unchanged. A1: [ADR-0007-Amendment-A1-Public-HTTP-Route.md](../adr/ADR-0007-Amendment-A1-Public-HTTP-Route.md).

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
