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
| ADR-0008 | News Freshness Policy | Accepted | 2026-07-14 |
| ADR-0009 | Shared Frontend Conversation and Decision Context Boundaries | Accepted | 2026-07-21 |
| ADR-0010 | Canonical Memory Graph and Personal Intelligence Memory Boundaries | Accepted | 2026-07-23 |
| ADR-0011 | CMG L1 Client Runtime Authorization | Accepted | 2026-07-24 |
| ADR-0012 | Today and Shared Timing Architecture | Proposed | 2026-07-28 |
| ADR-0013 | Decision Value Engine Architecture | Proposed | 2026-07-29 |
| ADR-0014 | Decision Case System of Record and Pathway Consolidation | RATIFIED | 2026-08-04 |
| ADR-0015 | Decision Case API Contract v1 | ACCEPTED | 2026-08-04 |
| ADR-DS-001 | Design System Architecture v1 | Proposed | 2026-07-07 |
| ADR-DS-002 | Runtime Semantic Token Consumption | Proposed | 2026-07-07 |

**ADR-DS-001 note:** Target architecture for design tokens. Implementation: [design-token-registry.md](../design/system/design-token-registry.md) (DS-01).

**ADR-DS-002 note:** Runtime map consumption contract. Extends ADR-DS-001 Principle 3. Implementation deferred.

**ADR-0001 note:** Superseded by [METIORO_CONSTITUTION.md](./METIORO_CONSTITUTION.md) (Chapter 0, Chapter 5, Appendix A) and [DOCUMENT_HIERARCHY.md](./DOCUMENT_HIERARCHY.md). Governance hierarchy is a constitutional and meta-governance concern, not an architecture decision record.

**ADR-0004 note:** Superseded by [TRUST_ARCHITECTURE.md](./TRUST_ARCHITECTURE.md) (Level 1 governance document). Trust Architecture is not an architecture decision record.

**ADR-0006 note:** LOCKED HTTP contract for `POST /api/v1/decision/execute`. Full text: [ADR-0006-Decision-API-Contract-v1.md](../adr/ADR-0006-Decision-API-Contract-v1.md). Corrected 2026-07-10 after Sprint 6A Step 0 drift from commit `973ce88`. Implementation boundary clarification added 2026-07-10 (Sprint 6A Step 0 — legacy engine mapping deferred). **Superseded in part by [ADR-0014](../adr/ADR-0014-Decision-Case-System-of-Record-and-Pathway-Consolidation.md)** for decision-bearing semantics (Decision Case SoR + Evaluation Package); wire v1 remains until v2. See [ACR-0001](../architecture/ARCHITECTURE_CONSOLIDATION_RESOLUTION.md) §B8.

**ADR-0014 note:** **RATIFIED.** Full text: [ADR-0014-Decision-Case-System-of-Record-and-Pathway-Consolidation.md](../adr/ADR-0014-Decision-Case-System-of-Record-and-Pathway-Consolidation.md). Binds engineering to ACR-0001. Coding authorized for [EPIC-001 Decision Case v1](../architecture/EPIC-001-DECISION-CASE-V1-ENGINEERING-SPEC.md) only.

**ADR-0015 note:** **ACCEPTED.** Full text: [ADR-0015-Decision-Case-API-Contract-v1.md](../adr/ADR-0015-Decision-Case-API-Contract-v1.md). Public HTTP contract for `/api/v1/decision-cases` (EG-03). Complements ADR-0014; does not amend ADR-0006. Lifecycle composites per [LAP-001](./EPIC-001-LIFECYCLE-ACTIVATION-PROFILE.md).

**DEC-0019 note:** **ACCEPTED.** Side-state `*` enumeration + total activation-phase derivation ([GOV-ISSUE-002](./GOV-ISSUE-002-LIFECYCLE-SIDE-STATE-AND-ACTIVATION-CLARIFICATION.md) CLOSED; LAP-001 §2.9–§2.11 binding). Does not amend ACR-0001. Owner Option A: invalid pause metadata → `NO_ACTIVE_PHASE` for `activation_phase()`; resume/repo validators remain fail-loudly. **E3 implementation authorized.**

**DEC-0020 / ADR-0015-WS-01 note:** **ACCEPTED / RATIFIED** (2026-08-04). [Wire Supplement 01](../adr/ADR-0015-WIRE-SUPPLEMENT-01-E5-Activation.md) freezes E5 route activation subset, request/response/error/concurrency wire, deferred owner isolation ([GOV-ISSUE-003](./GOV-ISSUE-003-ADR0015-WIRE-CONTRACT-GAPS.md) CLOSED). Supplements ADR-0015; does not amend ACR/ADR-0014. **E5 implementation authorized** for ACTIVE_IN_E5.

**ADR-0007 note:** ADR-0007 is LOCKED. Full text: [ADR-0007-Conversation-API-Contract-v1.md](../adr/ADR-0007-Conversation-API-Contract-v1.md). Conversation API contract for Sprint P1 Live Conversation MVP: stateless client-supplied history; provider-agnostic generation; derived astrological context (Option B); decision/conversational discriminator with Constraint 4a explainability. Hard ceilings: 20 messages, 32 KiB, 30s timeout. Prompt Governance Spec v1 required (Brand Voice Layer pending). Amendment A1 — method/path/versioning clarification. A1 current status = APPROVED TO COMMIT. A1 has its own lifecycle and MUST NOT be represented as RATIFIED or LOCKED before approval and commit. Decisions D1–D13 remain unchanged. A1: [ADR-0007-Amendment-A1-Public-HTTP-Route.md](../adr/ADR-0007-Amendment-A1-Public-HTTP-Route.md). **Superseded in part by [ADR-0014](../adr/ADR-0014-Decision-Case-System-of-Record-and-Pathway-Consolidation.md):** after migration M2, `type=decision` without Decision Case Evaluation Package reference is forbidden; Conversation is assist transport, not evaluation SoR.

**ADR-0008 note:** Accepted. Full text: [ADR-0008-News-Freshness-Policy.md](../adr/ADR-0008-News-Freshness-Policy.md). Primary ≤7-day freshness window, conditional fallback to the 8–30-day window when recent qualifying coverage is insufficient, hard 30-day cutoff, publication-timestamp authority, mandatory publication-date display, explicit low-signal behaviour, BFF-owned policy enforcement, and implementation-owned relevance ranking. Authorises workstream **PRG-02** in [MASTER_STATUS.md](../MASTER_STATUS.md).

**ADR-0009 note:** Accepted (Product Owner ratification 2026-07-21). Full text: [ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md](../adr/ADR-0009-Shared-Frontend-Conversation-and-Decision-Context-Boundaries.md). Frontend ownership boundaries: optional injected `DecisionHistorySummary` for Personal Intelligence Core (no Pathfinder imports); canonical ADR-0007 client at `apps/web/lib/conversation-client/`; Ask direct timing imports without Pathfinder workflow barrel. Does not amend ADR-0007 HTTP envelopes. Authorises independent P1-T14 / P1-T15 scoped commits; P1-T13 remains blocked until those dependencies are in HEAD.

**ADR-0010 note:** Accepted by explicit Product Owner ratification on 2026-07-23. Full text: [ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md](../adr/ADR-0010-Canonical-Memory-Graph-and-Personal-Intelligence-Memory-Boundaries.md). Companion: [CMG-FINAL-LOCK-REPORT.md](../architecture/CMG-FINAL-LOCK-REPORT.md). Locks the L0 canonical memory ownership, admission, and boundary decisions. Unique ownership (relationship entities vs memory events as separate rows; Search/Timeline/Knowledge = None; AI summaries = no canonical persistence by default). Canonical MemoryRecord Contract `schemaVersion: "1.0.0"` with `MemoryTypeId`/`MemoryDomainId` (taxonomy not frozen). L1 is client runtime role only; L2 does not exist and remains unapproved. Julia is not a producer under P1. Does not authorize implementation. Does not supersede ADR-0007 or ADR-0009. Spec planning: [CMG-SPECIFICATION-DEPENDENCY-MAP.md](../architecture/CMG-SPECIFICATION-DEPENDENCY-MAP.md).

**ADR-0011 note:** Accepted by explicit Product Owner ratification on 2026-07-24. Full text: [ADR-0011-CMG-L1-Client-Runtime-Authorization.md](../adr/ADR-0011-CMG-L1-Client-Runtime-Authorization.md). Defines the CMG L1 client-runtime implementation boundary. Acceptance alone does not authorize coding. Executable repository gate: [CMG-REPOSITORY-CONTRACT-SPECIFICATION.md](../architecture/CMG-REPOSITORY-CONTRACT-SPECIFICATION.md) **Accepted** v0.3.1 (2026-07-24) — acceptance does **not** authorize coding. Executable admission gate: [CMG-ADMISSION-PIPELINE-SPECIFICATION.md](../architecture/CMG-ADMISSION-PIPELINE-SPECIFICATION.md) **Accepted** v0.1.3 (2026-07-24) — acceptance does **not** authorize coding. Implementation remains blocked until required registries/lifecycle/canonicalization (OQ-A2)/proof (OQ-A4)/selection authorities are accepted where applicable, and explicit implementation approval is issued. Does not authorize L2, public memory APIs, semantic search, implicit memory, Julia memory production, auto-save, IA/UI, migration, or cloud sync. Related taxonomy specs remain Proposed: [CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md](../architecture/CMG-MEMORY-TYPE-DOMAIN-REGISTRY.md), [CMG-RELATIONSHIP-EDGE-TAXONOMY.md](../architecture/CMG-RELATIONSHIP-EDGE-TAXONOMY.md).

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

## ADR-0012 — Today and Shared Timing Architecture

- Status: Proposed
- Date: 2026-07-28
- Document: `docs/adr/ADR-0012-Today-and-Shared-Timing-Architecture.md`
- Scope: Today, Calendar, shared timing clients, decision signals, compatibility migration

## ADR-0013 — Decision Value Engine Architecture

- Status: Proposed
- Date: 2026-07-29
- Document: `docs/adr/ADR-0013-Decision-Value-Engine-Architecture.md`
- Scope: Future Decision Value Engine boundaries and data flow; preserves PRG-04/PRG-05/PRG-02/Reading Contract; coding not granted
