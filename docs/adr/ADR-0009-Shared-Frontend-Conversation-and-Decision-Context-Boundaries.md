# ADR-0009: Shared Frontend Conversation and Decision Context Boundaries

**Status:** Accepted
**Date:** 2026-07-21
**Decision makers:** METIORO Platform Engineering / Frontend Governance
**Scope:** Frontend module ownership for ADR-0007 Conversation client, Personal Intelligence Core decision-history input, and Ask timing adapter imports
**Normative language:** `MUST`, `MUST NOT`, `SHALL`, `MAY`

---

## Lifecycle

ADR-0009 entered the repository as a Proposed architecture decision documenting frontend ownership boundaries required for independent P1-T14 / P1-T15 commits.

Status advanced from Proposed to **Accepted** on **2026-07-21** by Product Owner ratification under the ADR_INDEX template lifecycle (`Proposed | Accepted | Deprecated | Superseded`). LOCKED is not required for this ownership ADR; LOCKED remains reserved for contract ADRs that the repository explicitly locks (for example ADR-0006 and ADR-0007).

**Owner ratification record**

| Field | Value |
|-------|-------|
| Ratifying authority | Product Owner |
| Ratification date | 2026-07-21 |
| Decisions accepted | D1, D2, D3 |
| Public API impact | None — does not amend ADR-0007 or Amendment A1 |
| Implementation commits | Not claimed; source remains uncommitted at ratification |

---

## Context

Ask Decision Intelligence V3 (P1-T13) depends on Personal Intelligence Core (P1-T14) and a shared Conversation / timing surface (P1-T15). Two inverted ownership problems blocked independent commits:

1. `apps/web/lib/intelligence/source-profile.ts` imported Pathfinder `listSavedDecisions` via the Pathfinder package barrel, making Intelligence Core depend on Pathfinder workflow storage.
2. The ADR-0007 frontend execute client lived under `apps/web/lib/pathfinder-decision/conversation-client.ts` even though Ask and Pathfinder both require the same public HTTP contract.

These are durable, cross-module ownership decisions. They do **not** change the public Conversation HTTP contract.

---

## Decision

### D1. Decision-history input is optional injected enrichment (A1)

Personal Intelligence Core `MUST` accept an optional neutral `DecisionHistorySummary` (`{ count: number }`) supplied by the product layer.

Core `MUST NOT` import Pathfinder modules or read Pathfinder localStorage keys.

When decision history is omitted, Core `MUST` treat count as `0` and remain deterministic.

Product adapters (for example Pathfinder) `MAY` adapt local saved decisions into `DecisionHistorySummary` outside the Core package.

### D2. Canonical frontend Conversation client is shared and neutral (B1)

The canonical ADR-0007 frontend client `SHALL` live under:

`apps/web/lib/conversation-client/`

It owns only transport types and `postConversationExecute` for `POST /api/v1/conversation/execute`.

Ask `MUST` import the client from `@/lib/conversation-client`.

Pathfinder `MAY` re-export for compatibility but `MUST NOT` be the ownership home of the shared client.

Pathfinder-specific prompt assembly (`buildSynthesisMessages`) `MUST` remain Pathfinder-owned.

### D3. Timing adapter stays co-located; Ask uses direct imports (C)

Ask-required timing (`loadPathfinderTiming` and supporting timing types/helpers) `MAY` remain under `apps/web/lib/pathfinder-decision/` for calendar reuse without algorithm duplication.

Ask `MUST` import timing via direct module paths (for example `@/lib/pathfinder-decision/timing`) and `MUST NOT` import the Pathfinder workflow barrel for conversation or timing.

Ask `MUST NOT` transitively require Pathfinder adaptive questions, analysis, or storage for the Ask runtime path.

---

## Alternatives considered

| Option | Result |
|---|---|
| A2 Neutral decision repository extraction | Rejected for this change — only Pathfinder currently owns saved-decision localStorage; injection is smaller and sufficient |
| Retain Intelligence → Pathfinder storage import | Rejected — inverted dependency; blocks independent P1-T14 ownership |
| B2 Keep client under pathfinder-decision as “shared” | Rejected as primary — naming/ownership ambiguity remains; temporary re-exports allowed for Pathfinder compatibility |
| Duplicate Ask-specific Conversation client | Rejected — one canonical ADR-0007 frontend client |

---

## Dependency direction

```
Ask → Personal Intelligence Core → optional DecisionHistorySummary only
Ask / Pathfinder → @/lib/conversation-client → POST /api/v1/conversation/execute
Ask → pathfinder-decision/timing (direct) → calendar timing sources
```

Forbidden:

```
Intelligence Core → Pathfinder workflow / storage / barrel
Ask → @/lib/pathfinder-decision (workflow barrel) for client or timing
```

---

## Public-contract impact

**None.** `POST /api/v1/conversation/execute` request and response envelopes remain governed solely by ADR-0007 and Amendment A1.

---

## Compatibility

- Pathfinder `conversation-client.ts` re-exports the shared client and keeps `buildSynthesisMessages`.
- Pathfinder barrel may continue re-exporting `postConversationExecute` for Pathfinder callers.
- Existing AskDecisionResult schema and scoring algorithms are unchanged.

---

## Migration / commit order

Ratified commit sequence:

1. Governance / ADR records (this ADR and task registration)
2. **P1-T14** — Personal Intelligence Core and Ask-safe Context
3. **P1-T15** — Shared Conversation Client and Timing Adapter
4. **P1-T13** clean-head re-verification
5. **P1-T13** commit review (only after T14 and T15 are in HEAD)

Each source commit still requires explicit **APPROVED TO COMMIT** after final staged-diff review (`DEVELOPMENT.md` §8).

---

## Implementation relationship

| Task | Relationship |
|------|----------------|
| **P1-T14** | Implements D1 (injected `DecisionHistorySummary`; no Pathfinder Core imports) |
| **P1-T15** | Implements D2 and D3 (shared `conversation-client/`; Ask direct timing imports) |
| **P1-T13** | Remains **blocked** until P1-T14 and P1-T15 are committed into HEAD and P1-T13 is re-tested against that clean dependency base |

This ADR does **not** claim that P1-T14 / P1-T15 implementation commits have occurred.

---

## Non-goals

- Pathfinder UI redesign
- Intelligence UI redesign
- Backend Vault / new persistence API
- Provider-side JSON schema
- Changing Conversation HTTP contract
- Unblocking P1-T13 without dependency verification and commits in HEAD

---

## Consequences

**Easier:** Independent ownership and staging for P1-T14 / P1-T15; clear Ask import boundaries.

**Harder:** Product layers that want decision-history enrichment must inject it explicitly; Pathfinder callers should migrate toward `@/lib/conversation-client` over time.

---

## References

- ADR-0007 Conversation API Contract v1.0 (LOCKED)
- ADR-0007 Amendment A1
- `docs/governance/SPRINT-P1-TASK-DECOMPOSITION.md` (P1-T13, P1-T14, P1-T15)
- `docs/governance/ASK-DECISION-INTELLIGENCE-V3-RECONCILIATION.md`
