# ADR-0006: Decision API Contract v1

**Status:** LOCKED
**Date:** 2026-07-10
**Decision makers:** METIORO Platform Engineering
**Authority:** Level 3 — Engineering Standards (API contract)

---

## Purpose

Define the **frozen HTTP contract v1** between the web client decision pipeline and the FastAPI decision boundary for Phase 6A (Backend Bridge).

This ADR specifies endpoint shape, request and response semantics, timeout behavior, unresolved handling, responsibilities, and change rules. **No runtime implementation is required by this ADR alone.**

---

## Context

Phase 1 FTUE infrastructure established a pure client-side pipeline:

```text
resolveAskQuestion()
  → resolveDecisionRequest()
  → prepareDecisionExecution()
  → executePreparedDecision()   [placeholder facade]
```

Phase 6A will connect the **ready** execution boundary to FastAPI while keeping the **real decision response unused by UI** until Phase 6B.

Without a locked contract, client and server could diverge on unresolved semantics, timeout handling, and field ownership. ADR-0005 established the facade migration **pattern** for legacy analyze routes; this ADR establishes the **new decision execute contract** for FTUE-ready requests.

**Governing types (client, existing):**

- `ExecutableDecisionRequest` — [decision-execution/types.ts](../../apps/web/lib/decision-execution/types.ts)
- `DecisionExecutionUnresolvedReason` — same module
- `DecisionEngineResponse` — [decision-engine-facade/types.ts](../../apps/web/lib/decision-engine-facade/types.ts) (placeholder reference shape)

**Governing engine (server, existing):**

- `packages/decision_engine` facade via `generate_decision_outcome()` — [decision_engine.py](../../apps/api/src/services/decision_engine.py)

---

## Decision

Adopt **Decision API Contract v1** as defined below. Status **LOCKED** — the contract is frozen until superseded by an ADR declaring v2.

### Endpoint

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/decision/execute` |
| **Content-Type** | `application/json` |
| **Idempotency** | Recommended header `Idempotency-Key: {request_id}` for safe retries |

> The `execute` verb mirrors `executePreparedDecision()` and preserves contract-code naming symmetry. `evaluate` is not a separate operation.

Authentication and authorization for the Decision API are not decided by this ADR and are outside Sprint 6A. Any new authentication requirement requires a separately reviewed security decision.

### Wire-schema naming

The HTTP boundary may use explicitly named transport models, such as:

- `DecisionExecuteRequest`
- `DecisionExecuteResponse`
- `DecisionApiErrorResponse`

These transport models must map between the frozen frontend request contract and the existing backend engine model. Frontend, wire, and engine models are **not** literally the same Python or TypeScript type; boundary mappers translate between them.

Boundary mappers must not invent domain-semantic defaults. In particular, values such as `target_date` may only be populated from an authoritative existing request field or an already locked rule. Defaulting to the current date is forbidden unless separately approved.

### Request body

The client sends a **ready executable decision** plus **profile context** required for engine evaluation. The server must reject requests that are not structurally ready.

```json
{
  "request_id": "career-focus-week:career_focus",
  "display_text": "What should I focus on in my career this week?",
  "action_type": "career_focus",
  "guided_question_id": "career-focus-week",
  "category_id": "career-work",
  "needs_time": false,
  "locale": "en",
  "profile": {
    "birth_date": "1990-06-15",
    "birth_time": "14:30",
    "location": "New York",
    "latitude": 40.7128,
    "longitude": -74.006,
    "action_type": "business_launch"
  }
}
```

| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| `request_id` | Yes | Client deterministic ID (`{guidedQuestionId}:{actionType}`) | Stable retry key |
| `display_text` | Yes | `ExecutableDecisionRequest.displayText` | Audit/display only; server must not rewrite |
| `action_type` | Yes | `ExecutableDecisionRequest.execution.actionType` | Engine routing input |
| `guided_question_id` | Yes | `ExecutableDecisionRequest.execution.guidedQuestionId` | Traceability |
| `category_id` | Yes | `ExecutableDecisionRequest.execution.categoryId` | Traceability |
| `needs_time` | Yes | `ExecutableDecisionRequest.execution.needsTime` | Boolean, not optional |
| `locale` | Yes | Active app locale | `en` \| `ru` \| `fa` \| `ar` |
| `profile` | Yes | Profile repository record | Birth and location context for engine |
| `profile.action_type` | Yes | Profile record | Chart/scoring module default — **not** overridden by question `action_type` unless a future ADR explicitly changes this |

### Unresolved semantics

> `unresolved` is frontend-only. It is produced before any network call. An unresolved decision request never reaches this endpoint. The backend does not return an unresolved response.

The client must stop at `prepareDecisionExecution()` and must not call this endpoint when status is `unresolved`. Ordinary FastAPI/Pydantic request-shape rejection is not the domain state `unresolved`.

### Success response — `200 OK`

Maps to the completed branch of `DecisionEngineResponse` / `DecisionExecuteResponse`:

```json
{
  "status": "completed",
  "result": {
    "requestId": "career-focus-week:career_focus",
    "actionType": "career_focus",
    "guidedQuestionId": "career-focus-week",
    "categoryId": "career-work",
    "needsTime": false,
    "summary": "…",
    "source": "decision_engine"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `status` | Yes | Always `"completed"` for success |
| `result.requestId` | Yes | Echo request ID |
| `result.actionType` | Yes | From request |
| `result.guidedQuestionId` | Yes | From request |
| `result.categoryId` | Yes | From request |
| `result.needsTime` | Yes | From request |
| `result.summary` | Yes | Human-readable summary; Phase 6A may be discarded by UI |
| `result.source` | Yes | `"decision_engine"` for real engine; distinguishes from client placeholder |

Phase 6A **must not** require the UI to consume `result`. Phase 6B introduces first user-visible consumption under separate acceptance criteria.

### Error responses

| HTTP | When | Body |
|------|------|------|
| `400` | Request contract validation failure | See below |
| `500` | Internal execution failure | See below |

Body for both:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "requestId": "string"
  }
}
```

Do not use `{ "detail": ..., "correlation_id": ... }` as the v1 contract error shape.

### Timeout semantics

| Layer | Limit | Behavior |
|-------|-------|----------|
| **Client** | 5 seconds | Abort fetch; treat as transport failure; **do not** synthesize completed results |
| **Server** | 4 seconds | Cancel engine work; return `500` with contract error body |
| **Retry** | Max 1 automatic retry | Only on network failure; use same `Idempotency-Key` |

> These values are contract budgets, not measured engine-performance claims. Longer budgets require an ADR amendment backed by measured engine latency.

### Responsibilities

| Actor | Responsibility |
|-------|----------------|
| **Client pipeline** | Produce `ExecutableDecisionRequest` only when `prepareDecisionExecution()` returns `ready`; never call execute for `unresolved` |
| **Client UI (Phase 6A)** | May ignore `result`; must preserve existing user-visible behavior |
| **Client UI (Phase 6B+)** | Must consume real `result` with mandatory uncertainty disclosure |
| **API route** | Validate ready contract; map to engine `DecisionRequest`; call `generate_decision_outcome()`; map to response contract |
| **Decision Engine** | Produce advisory outcome; never claim decision authority |
| **API route** | Must not convert unresolved client states into `completed` by inferring `action_type` |

### Change rules

1. **v1 is LOCKED** — field additions may be optional-only; no breaking renames or semantic inversions.
2. **Breaking changes** require `Decision API Contract v2` as a new ADR and index entry.
3. **UI consumption of `result`** requires Phase 6B governance acceptance — not a silent v1 change.
4. Implementation PRs must cite this ADR and demonstrate contract tests before merge.

---

## Implementation Boundary Clarification

**Date:** 2026-07-10
**Scope:** Sprint 6A backend bridge — implementation interpretation only. Does not modify the v1 HTTP request, success response, error response, endpoint, timeout, unresolved, or authentication terms above.

> A boundary mapper may translate representation, but it may not create domain meaning. Forcing the new Decision API contract through a legacy scoring model would conceal semantic invention behind an adapter.

Sprint 6A establishes the versioned HTTP boundary only. The current legacy scoring model must not be forced behind the new Decision API contract until every required semantic input has an authoritative source.

### Sprint 6A scope

Sprint 6A establishes:

- `POST /api/v1/decision/execute`
- Explicit transport request and response models
- Request validation
- Response serialization
- 5-second client timeout contract
- 4-second server execution budget
- `400`/`500` error envelope
- Request ID propagation
- Route-level HTTP tests
- OpenAPI exposure of the versioned contract

Sprint 6A does **not** establish semantic compatibility with the legacy scoring engine.

### Legacy engine integration deferred

`packages.decision_engine.DecisionRequest` is a legacy internal scoring model. It is **not** itself the Decision API v1 wire contract.

Direct mapping to the current legacy scoring model is deferred because that model requires semantic fields not supplied or governed by ADR-0006, including:

- `target_date`
- `ScoringContext`
- `module_origin`
- a single collapsed `action_type`

Legacy integration may begin only after each required field has an authoritative source defined by governance or by an approved domain contract.

Sprint 6A is not required to delegate to the legacy engine facade when doing so would require invented semantic values. The backend may use a dedicated deterministic boundary implementation to return a contract-valid `DecisionExecuteResponse` while full engine integration remains deferred.

### No semantic defaults

The implementation must not invent or infer domain meaning merely to satisfy the legacy engine.

Explicitly prohibited defaults or guesses include:

- using today's date as `target_date`
- constructing a default `ScoringContext`
- assigning a default `module_origin`
- collapsing distinct profile and question `action_type` values into one legacy field
- inferring `target_time` from `needs_time` alone
- deriving missing semantic fields from transport structure alone

`needs_time` may be validated and preserved in the v1 transport response, but it must not be converted into an invented date or time.

Question `action_type` and `profile.action_type` remain distinct at the HTTP boundary. They must not be collapsed into one legacy engine field without a separately reviewed mapping decision.

The boundary implementation must not fabricate:

- `target_date`
- `target_time`
- `ScoringContext`
- `module_origin`
- `include_location_context`
- collapsed action-type semantics
- any other domain-semantic input absent from the HTTP request

### Boundary mapper rule

Boundary mappers may:

- rename fields
- normalize transport representation
- validate shape
- convert equivalent data formats
- serialize and deserialize contract-valid values

Boundary mappers may not:

- create missing domain facts
- select business meaning without an authoritative source
- silently substitute legacy requirements
- weaken the public API contract to match internal legacy models

### Sprint 6A response boundary

Until legacy scoring integration is separately approved, the endpoint must return a contract-valid `DecisionExecuteResponse` produced within the Decision API boundary.

The clarification does not prescribe fabricated scores, outcomes, recommendations, or astrological conclusions. Any temporary boundary response must be deterministic, explicitly governed, transport-valid, and semantically honest. Do not describe placeholder or boundary-only data as real legacy engine output.

### Future integration gate

Legacy engine integration requires a separate reviewed task or ADR clarification that identifies authoritative sources for every required semantic field and defines the mapping without invented defaults.

---

## Consequences

### Positive

- Phase 6A can proceed with a frozen boundary
- Client unresolved semantics remain client-only; server contract stays simple
- Phase 6B has a stable contract to consume

### Negative

- v1 locked before implementation — mismatches require v2 ADR
- Server must reject malformed requests explicitly rather than best-effort scoring

---

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Reuse `/api/business/analyze` shape | Couples FTUE decision pathway to legacy activity scoring response |
| Unversioned `/api/decision/execute` | Violates API Strategy URL versioning policy |
| Allow typed questions with inferred `action_type` | Violates intent-classification boundary and Rule 0 product honesty |
| Server-side `422 unresolved` | Unresolved is frontend-only; backend never returns unresolved |

---

## References

| Document | Role |
|----------|------|
| [ADR-0005](./ADR-0005-Decision-Engine-Facade-First-Runtime-Migration.md) | Facade migration pattern |
| [API_STRATEGY.md](../architecture/API_STRATEGY.md) | Versioning and API classes |
| [DECISION_INTELLIGENCE_ENGINE.md](../architecture/DECISION_INTELLIGENCE_ENGINE.md) | Engine semantics |
| [MASTER_STATUS.md](../MASTER_STATUS.md) | Phase 6 sequencing |
| [GOVERNANCE.md](../governance/GOVERNANCE.md) | Sprint Protocol |

---

## Version history

| Date | Status | Notes |
|------|--------|-------|
| 2026-07-10 | LOCKED | Initial Decision API Contract v1 |
| 2026-07-10 | LOCKED | Governance correction: restored approved draft after Sprint 6A Step 0 drift from commit `973ce88` (endpoint `evaluate`→`execute`, timeout budgets, frontend-only unresolved, error shape, auth deferred) |
| 2026-07-10 | LOCKED | Implementation boundary clarification: Sprint 6A HTTP boundary only; legacy engine mapping deferred; no semantic defaults |
