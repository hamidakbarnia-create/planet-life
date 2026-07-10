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

Without a locked contract, client and server could diverge on unresolved semantics, timeout handling, and field ownership. ADR-0005 established the facade migration **pattern** for legacy analyze routes; this ADR establishes the **new decision evaluate contract** for FTUE-ready requests.

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
| **Path** | `/api/v1/decision/evaluate` |
| **Content-Type** | `application/json` |
| **Auth** | Required — same session identity model as other authenticated experience APIs (future JWT; current FTUE session gate) |
| **Idempotency** | Recommended header `Idempotency-Key: {request_id}` for safe retries |

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

**Unresolved requests must not be sent.** The client must stop at `prepareDecisionExecution()` and must not call this endpoint when status is `unresolved`.

### Success response — `200 OK`

```json
{
  "status": "completed",
  "request_id": "career-focus-week:career_focus",
  "result": {
    "source": "decision_engine",
    "recommendation_summary": "…",
    "confidence_rating": "good",
    "uncertainty_disclosed": true,
    "correlation_id": "corr_01H…"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `status` | Yes | Always `"completed"` for success |
| `request_id` | Yes | Echo request ID |
| `result.source` | Yes | `"decision_engine"` for real engine; distinguishes from client placeholder |
| `result.recommendation_summary` | Yes | Human-readable summary; Phase 6A may be discarded by UI |
| `result.confidence_rating` | Yes | Engine rating band — opaque string at v1 |
| `result.uncertainty_disclosed` | Yes | Must be `true` when confidence limits apply (Brand Constraint 4a readiness) |
| `result.correlation_id` | Yes | Support and audit trace |

Phase 6A **must not** require the UI to consume `result`. Phase 6B introduces first user-visible consumption under separate acceptance criteria.

### Unresolved response — `422 Unprocessable Entity`

When the server receives a structurally incomplete or policy-blocked request:

```json
{
  "status": "unresolved",
  "reason": "incomplete_execution_metadata",
  "correlation_id": "corr_01H…"
}
```

| `reason` value | Meaning |
|----------------|---------|
| `typed_question_unresolved` | Typed questions are not evaluable at v1 |
| `legacy_suggestion_id` | Legacy suggestion IDs are not evaluable at v1 |
| `unknown_suggestion_id` | Unknown suggestion IDs are not evaluable at v1 |
| `missing_suggestion_id` | Missing suggestion ID |
| `missing_question_text` | Missing display text |
| `incomplete_execution_metadata` | Ready-contract validation failed server-side |

Reason strings align with `DecisionExecutionUnresolvedReason` on the client. The server must not invent new public reason codes without a contract version bump.

### Error responses

| HTTP | When | Body |
|------|------|------|
| `400` | Malformed JSON or missing required fields | `{ "detail": "…", "correlation_id": "…" }` |
| `401` | Unauthenticated | `{ "detail": "Unauthorized", "correlation_id": "…" }` |
| `403` | Authenticated but not entitled | `{ "detail": "Forbidden", "correlation_id": "…" }` |
| `408` | Server timeout exceeded | `{ "detail": "Decision evaluation timed out", "correlation_id": "…" }` |
| `500` | Unexpected server failure | `{ "detail": "Internal decision evaluation error", "correlation_id": "…" }` |
| `503` | Engine unavailable | `{ "detail": "Decision engine unavailable", "correlation_id": "…" }` |

Every error response includes `correlation_id`.

### Timeout semantics

| Layer | Limit | Behavior |
|-------|-------|----------|
| **Client** | 30 seconds | Abort fetch; treat as transport failure; **do not** synthesize completed results |
| **Server** | 25 seconds | Cancel engine work; return `408` with `correlation_id` |
| **Retry** | Max 1 automatic retry | Only on network failure or `503`; use same `Idempotency-Key` |

### Responsibilities

| Actor | Responsibility |
|-------|----------------|
| **Client pipeline** | Produce `ExecutableDecisionRequest` only when `prepareDecisionExecution()` returns `ready`; never call evaluate for `unresolved` |
| **Client UI (Phase 6A)** | May ignore `result`; must preserve existing user-visible behavior |
| **Client UI (Phase 6B+)** | Must consume real `result` with mandatory uncertainty disclosure |
| **API route** | Validate ready contract; map to `DecisionRequest`; call `generate_decision_outcome()`; map to response contract |
| **Decision Engine** | Produce advisory outcome; never claim decision authority |
| **API route** | Must not convert unresolved client states into `completed` by inferring `action_type` |

### Change rules

1. **v1 is LOCKED** — field additions may be optional-only; no breaking renames or semantic inversions.
2. **Breaking changes** require `Decision API Contract v2` as a new ADR and index entry.
3. **Reason code additions** require minor contract revision or v2 ADR.
4. **UI consumption of `result`** requires Phase 6B governance acceptance — not a silent v1 change.
5. Implementation PRs must cite this ADR and demonstrate contract tests before merge.

---

## Consequences

### Positive

- Phase 6A can proceed with a frozen boundary
- Client and server unresolved semantics stay aligned
- Phase 6B has a stable contract to consume

### Negative

- v1 locked before implementation — mismatches require v2 ADR
- Server must reject unresolved cases explicitly rather than best-effort scoring

---

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Reuse `/api/business/analyze` shape | Couples FTUE decision pathway to legacy activity scoring response |
| Unversioned `/api/decision/evaluate` | Violates API Strategy URL versioning policy |
| Allow typed questions with inferred `action_type` | Violates intent-classification boundary and Rule 0 product honesty |

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
