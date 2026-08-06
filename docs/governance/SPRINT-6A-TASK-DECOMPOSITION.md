# Sprint 6A — Task Decomposition

| Field | Value |
|-------|--------|
| **Status** | PROPOSED |
| **Authority** | Operational |
| **Parent** | ADR-0006 — Decision API Contract v1 (LOCKED) |
| **Repository** | `~/planet-life-wsl` |
| **Branch** | `governance-foundation` |
| **HEAD** | `dbcbd7ad` |
| **Working tree** | clean |
| **Local/Remote sync** | `0 / 0` |

**Scope:** Sprint 6A establishes the versioned HTTP Decision API boundary and, under the selected sprint strategy, hardens that boundary and wires the Guided Ready client flow to `POST /api/v1/decision/execute` with mechanical transport mapping only.

**Interpretation note:** The ADR-0006 Implementation Boundary Clarification governs Sprint 6A implementation scope. Context language in ADR-0006 describes implementation intent only and must not be interpreted as expanding Sprint scope beyond the HTTP boundary, hardening, and Guided Flow HTTP wiring defined here.

---

## Task 1 — HTTP Decision Boundary

**Status:** COMPLETE
**Commit:** `da51faf`
**Purpose:** Ratification only. Do not redefine completed work.

### Delivered work summary

Task 1 delivered the Sprint 6A server HTTP boundary:

- `POST /api/v1/decision/execute`
- Transport request/response models
- Request validation and response serialization
- 4-second server execution budget
- `400` / `500` error envelopes
- Request ID propagation
- Route-level HTTP tests
- OpenAPI exposure
- Deterministic boundary executor with no legacy `DecisionRequest` mapping and no legacy engine invocation

### Ratification artifacts

to be confirmed at commit time

### Retrospective Note

Task 1 was committed before the finalized governance approval workflow was in force. The 2026-07-10 governance audit confirmed the technical validity of the delivered boundary against ADR-0006 Implementation Boundary Clarification. Section 8 of `docs/governance/DEVELOPMENT.md` now establishes the permanent Commit Boundary rule for all subsequent work.

### Commit Boundary

Reference: `docs/governance/DEVELOPMENT.md` §8 — Standard Development Workflow.

Future commits require:

Review → **APPROVED TO COMMIT** → Commit

---

## Task 2 — Hardening + Guided Flow HTTP Wiring

**Status:** READY
**Purpose:** Hardening + Guided Flow HTTP wiring only.
**Strategy:** No semantic integration. No legacy mapping. No UI consumption.

---

## Task 2 execution plan

### Step 2.1 — Backend hardening

**Deliverable:** Remove `str(exc)` leakage from HTTP 500 error envelope.

**Commit Boundary:** `DEVELOPMENT.md` §8

---

### Step 2.2 — Guided HTTP client

**Deliverables:**

- HTTP client for `POST /api/v1/decision/execute`
- Request builder
- Mechanical transport mapping only

No semantic transformation.

**Commit Boundary:** `DEVELOPMENT.md` §8

---

### Step 2.3 — Guided Flow wiring

**Deliverables:**

- Connect Guided Ready flow to `POST /api/v1/decision/execute`
- Client timeout contract (5 seconds; abort fetch; treat as transport failure; do not synthesize completed results)
- Deterministic request_id generation and propagation using the ADR-defined source convention.

Client timeout only.
No server timeout changes.
No engine integration.

**Commit Boundary:** `DEVELOPMENT.md` §8

---

### Step 2.4 — Integration

**Deliverables:**

- Integration tests
- Regression tests

No UI consumption.

**Commit Boundary:** `DEVELOPMENT.md` §8

---

### Step 2.5 — Release Gate

**Deliverable:** Local Release Gate PASS (`DEVELOPMENT.md` §9).

**Commit Boundary:** `DEVELOPMENT.md` §8

---

### Step 2.6 — Sprint Close

**Deliverables:**

- Push
- Remote sync
- GitHub Actions PASS
- Sprint closure

**Commit Boundary:** `DEVELOPMENT.md` §8

---

## Explicitly Out of Scope

| Item | Why outside Sprint 6A |
|------|------------------------|
| **Typed flow** | Typed questions remain `unresolved` before any network call; ADR-0006 forbids calling the execute endpoint for unresolved requests, and required transport fields are not available without semantic invention. |
| **UI consumption of decision results** | ADR-0006 assigns first user-visible consumption of `result` to Phase 6B under separate acceptance criteria. |
| **Legacy DecisionRequest mapping** | ADR-0006 Implementation Boundary Clarification defers direct mapping until every required semantic field has an authoritative source. |
| **Legacy scoring engine integration** | Sprint 6A does not establish semantic compatibility with the legacy scoring engine; integration requires a separate reviewed gate. |
| **Semantic compatibility** | Boundary mappers may rename and normalize transport representation only; they may not create domain meaning. |
| **Canonical location representation** | Transport accepts a non-empty string only; engine-compatible location semantics are undefined and deferred. |
| **Automatic client retry implementation** | ADR defines retry behaviour, but Sprint 6A intentionally does not implement automatic client retry. |
| **Client Idempotency-Key implementation** | ADR recommends `Idempotency-Key`, but Sprint 6A intentionally does not implement that header. |

---

## Deferred Contract Obligations

### 1. ADR-0006 L174 cancellation obligation

| Field | Value |
|-------|--------|
| **Obligation** | On server budget expiry (4 seconds), cancel in-flight engine work and return `500` with contract error body (`docs/adr/ADR-0006-Decision-API-Contract-v1.md:174`). |
| **Owner** | API / Decision boundary |
| **Future phase** | Legacy or other long-running engine integration gate, or ADR amendment refining cancelability |
| **Why deferred** | Sprint 6A uses a deterministic boundary executor; true cancel semantics belong with cancellable long-running work. |
| **Implementation constraint** | `asyncio.to_thread` cannot cancel running threads. `asyncio.wait_for` can expire the await and return timeout to the client without stopping the worker thread. |

### 2. Canonical location representation

Transport accepts a non-empty string (`apps/api/src/schemas/decision_execute.py:16`). Canonical engine representation is undefined. Must be specified before semantic engine consumption. Existing frontend string formatting must not be treated as an engine-compatible location contract.

---

## Explicit ADR Terms

ADR-defined behaviour intentionally **not** implemented in Sprint 6A:

| Term | ADR statement | Citation |
|------|---------------|----------|
| **Retry behaviour** | Max 1 automatic retry; only on network failure; use same `Idempotency-Key` | `docs/adr/ADR-0006-Decision-API-Contract-v1.md:175` |
| **Idempotency-Key guidance** | Recommended header `Idempotency-Key: {request_id}` for safe retries | `docs/adr/ADR-0006-Decision-API-Contract-v1.md:56` |

---

## Non-Decisions

| Topic | Evidence |
|-------|----------|
| Authentication and authorization for the Decision API | Not decided by ADR-0006; outside Sprint 6A; requires a separately reviewed security decision (`docs/adr/ADR-0006-Decision-API-Contract-v1.md:60`) |

---

## Acceptance Criteria

1. Guided Ready flow reaches `POST /api/v1/decision/execute`.
2. Mapping is mechanical transport mapping only (no semantic transformation, no legacy engine fields).
3. Deterministic request_id generation and propagation using the ADR-defined source convention.
4. UI does not consume decision `result`.
5. Local Release Gate PASS
6. Push completed
7. Remote sync 0 / 0
8. GitHub Actions push workflow PASS
9. GitHub Actions pull_request workflow PASS

---

**Status:** READY FOR FINAL REVIEW
