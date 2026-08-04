# ADR-0015 Wire Supplement 01 — E5 Activation Contract

| Field | Value |
|-------|-------|
| **ID** | ADR-0015-WS-01 |
| **Status** | **RATIFIED** |
| **Date** | 2026-08-04 |
| **Ratified** | 2026-08-04 — Owner decision DEC-0020 (**ACCEPTED**) |
| **Parent** | [ADR-0015](./ADR-0015-Decision-Case-API-Contract-v1.md) (**ACCEPTED**) |
| **Resolves** | GOV-ISSUE-003 / GOV-API-01 … GOV-API-06 |
| **Authority** | Level 3 — Engineering Standards (wire clarification) |
| **Amends** | Nothing in ACR-0001 / ADR-0014. **Supplements** ADR-0015 for E5 activation only |
| **Does not authorize** | Intake logic, NL classification, DIE scoring, package generation, Identity/Auth runtime |

---

## 0. Purpose

Provide the minimum deterministic wire contract so EPIC-001 **E5** can implement an honest HTTP surface over committed **E3** + **E4** without inventing later-task behavior.

ADR-0015 path/method matrix remains the epic route freeze. This supplement classifies which routes are **active in E5** and freezes their request/response/error/concurrency rules.

---

## 1. E5 route activation matrix (GOV-API-06)

| Method | Path | Classification | Owning task | Registered in E5 OpenAPI | Functional in E5 |
|--------|------|----------------|-------------|--------------------------|------------------|
| `POST` | `/api/v1/decision-cases` | **ACTIVE_IN_E5** | E5 | Yes | Yes (structured create only) |
| `GET` | `/api/v1/decision-cases` | **ACTIVE_IN_E5** | E5 | Yes | Yes |
| `GET` | `/api/v1/decision-cases/{case_id}` | **ACTIVE_IN_E5** | E5 | Yes | Yes |
| `POST` | `/api/v1/decision-cases/{case_id}/complete` | **ACTIVE_IN_E5** | E5 | Yes | Yes (LAP composite via repository; 409 if preconditions unmet) |
| `POST` | `/api/v1/decision-cases/{case_id}/archive` | **ACTIVE_IN_E5** | E5 | Yes | Yes (LAP composite via repository; 409 if preconditions unmet) |
| `GET` | `/api/v1/decision-cases/{case_id}/evaluations` | **ACTIVE_IN_E5** | E5 | Yes | Yes (read-only; may be empty) |
| `GET` | `/api/v1/decision-cases/{case_id}/evaluations/{evaluation_id}` | **ACTIVE_IN_E5** | E5 | Yes | Yes (read-only) |
| `GET` | `/api/v1/decision-cases/{case_id}/history` | **ACTIVE_IN_E5** | E5 | Yes | Yes |
| `POST` | `/api/v1/decision-cases/{case_id}/intake/answers` | **RESERVED_FOR_E6** | E6 | **No** | No |
| `POST` | `/api/v1/decision-cases/{case_id}/intake/complete` | **RESERVED_FOR_E6** | E6 | **No** | No |
| `POST` | `/api/v1/decision-cases/{case_id}/evaluations` | **RESERVED_FOR_E10_PLUS** | E10+ | **No** | No |
| `POST` | `/api/v1/decision-cases/{case_id}/comparisons` | **RESERVED_FOR_E10_PLUS** | E10+ | **No** | No |

### 1.1 Create entry-mode split

| `entry_mode` | E5 behavior |
|--------------|-------------|
| `structured` | **ACTIVE** — requires `decision_type_id` |
| `natural_language` | **RESERVED_FOR_E8** — request rejected with `400` / `ENTRY_MODE_UNAVAILABLE` (no classification; no Case created) |

### 1.2 Rules

- Reserved routes **MUST NOT** appear in E5 OpenAPI.  
- Reserved routes **MUST NOT** be registered as handlers that return placeholder/fake success.  
- Hitting a non-registered path → framework `404` (not a Case domain success).  
- No new routes. No aliases. No DELETE.

---

## 2. Optimistic concurrency (GOV-API-02) — Option A

**Canonical rule:** `expected_case_version` is a **required JSON body field** on every **material write** active in E5.

| Property | Normative value |
|----------|-----------------|
| JSON name | `expected_case_version` |
| Type | integer |
| Allowed | ≥ 1 |
| Create Case | **Exempt** (no body field) |
| Read routes | **Exempt** |
| Active writes requiring it | `POST .../complete`, `POST .../archive` |
| Missing | `422` / `VALIDATION_ERROR` |
| Malformed (non-integer / < 1) | `422` / `VALIDATION_ERROR` |
| Stale (≠ current) | `409` / `VERSION_CONFLICT` |
| Header alias | **Forbidden** — no `Expected-Case-Version` header |

No other concurrency mechanism in E5.

---

## 3. Request schemas — ACTIVE_IN_E5 (GOV-API-01)

### 3.1 `POST /api/v1/decision-cases`

| Field | Type | Required | Nullable | Validation | Default |
|-------|------|----------|----------|------------|---------|
| `decision_type_id` | string | Required when `entry_mode=structured` | No | Must be one of epic-frozen allowlist (§3.1.1) | — |
| `title` | string | Yes | No | Non-empty after trim; max 200 chars | — |
| `entry_mode` | string | Yes | No | `structured` \| `natural_language` | — |
| `classification_text` | string \| null | No | Yes | Ignored in E5; if `entry_mode=natural_language` → error before create | `null` |
| `expected_case_version` | — | **Must not be sent** | — | Extra field → `422` | — |
| `activation_phase` | — | **Must not be sent** | — | Extra field → `422` | — |
| `state` | — | **Must not be sent** | — | Extra field → `422` | — |

Unknown fields → `422` / `VALIDATION_ERROR`.

#### 3.1.1 Decision type allowlist (E5)

Until E2 registry file is loaded as runtime authority, E5 MUST accept **only**:

| `decision_type_id` | Derived `family_id` | Default `mode` on create |
|--------------------|---------------------|--------------------------|
| `tim-compare-three` | `timing_opt` | `none` |
| `car-interview` | `visibility` | `none` |
| `mar-wedding-date` | `timing_opt` | `none` |

Unknown `decision_type_id` → `400` / `UNKNOWN_DECISION_TYPE`.  
When E2 lands, loader becomes sole allowlist; this table remains the epic freeze set.

`entry_mode=natural_language` → `400` / `ENTRY_MODE_UNAVAILABLE` (E8).

### 3.2 `POST /api/v1/decision-cases/{case_id}/complete`

| Field | Type | Required | Nullable | Validation |
|-------|------|----------|----------|------------|
| `expected_case_version` | integer | **Yes** | No | ≥ 1; CAS against repository |

Path: `case_id` UUID. No other body fields. Unknown fields → `422`.

### 3.3 `POST /api/v1/decision-cases/{case_id}/archive`

| Field | Type | Required | Nullable | Validation |
|-------|------|----------|----------|------------|
| `expected_case_version` | integer | **Yes** | No | ≥ 1; CAS against repository |

Path: `case_id` UUID. No other body fields. Unknown fields → `422`.

### 3.4 Read routes

`GET` list / get / evaluations / evaluation by id / history — **no request body**.  
Query parameters: **none** in E5 (no pagination params).

### 3.5 Reserved routes (E6 / E10+)

No wire schema is **activated** in E5. Future request contracts remain under ADR-0015 parent + later task supplements. E5 MUST NOT publish or accept those bodies.

---

## 4. Response schemas (GOV-API-03)

### 4.1 Shared formats

| Concern | Rule |
|---------|------|
| UUID | RFC 4122 string lowercase hex with hyphens |
| Timestamps | ISO-8601 UTC with `Z` suffix (from `timestamptz`) |
| `activation_phase` | One of `draft\|intake\|evidence_ready\|evaluated\|compared\|completed\|archived`, **or JSON `null`** when derivation is `NO_ACTIVE_PHASE` |
| No internal fields | No SQL names, no `paused_prior_state` unless later ADR adds it |

### 4.2 `DecisionCaseResource`

Returned by create, get, complete, archive.

| Field | Type | Notes |
|-------|------|-------|
| `case_id` | string (uuid) | |
| `owner_subject_id` | string | Server-attributed (§6) |
| `decision_type_id` | string | |
| `family_id` | string | Derived on create |
| `title` | string | |
| `state` | string | ACR CaseState value |
| `activation_phase` | string \| null | Derived only |
| `mode` | string | `none\|evaluate_date\|compare_dates` |
| `precision_level` | string | `L1`…`L7` |
| `case_version` | integer | Maps from repository `current_case_version` |
| `created_at` | string (iso-8601) | |
| `updated_at` | string (iso-8601) | |

### 4.3 Create success

| Property | Value |
|----------|-------|
| HTTP status | **`201`** |
| Body | `DecisionCaseResource` |
| `Location` header | Optional; if present `/api/v1/decision-cases/{case_id}` |

### 4.4 `DecisionCaseListEnvelope` — `GET /api/v1/decision-cases`

```json
{
  "cases": [ /* DecisionCaseResource... */ ]
}
```

| Rule | Value |
|------|-------|
| Empty list | `{ "cases": [] }` with `200` |
| Ordering | `updated_at` descending, then `case_id` ascending |
| Pagination | **None in E5** — full owner list |
| HTTP | `200` |

### 4.5 Get Case — `GET /api/v1/decision-cases/{case_id}`

| HTTP | Body |
|------|------|
| `200` | `DecisionCaseResource` |
| `404` | Error envelope |

### 4.6 Complete / Archive success

| HTTP | Body |
|------|------|
| `200` | `DecisionCaseResource` (post-transition state) |

### 4.7 `DecisionEvaluationListEnvelope` — `GET .../evaluations`

```json
{
  "evaluations": [
    {
      "evaluation_id": "uuid",
      "case_id": "uuid",
      "case_version": 1,
      "evaluation_version": 1,
      "package_contract_version": "string",
      "engine_id": "string",
      "dq_status": "pass|blocked",
      "created_at": "iso-8601"
    }
  ]
}
```

| Rule | Value |
|------|-------|
| Empty | `{ "evaluations": [] }` / `200` |
| Ordering | `evaluation_version` descending |
| Package body | **Omitted** from list items (E5) |

### 4.8 `DecisionEvaluationResource` — `GET .../evaluations/{evaluation_id}`

```json
{
  "evaluation_id": "uuid",
  "case_id": "uuid",
  "case_version": 1,
  "evaluation_version": 1,
  "package_contract_version": "string",
  "engine_id": "string",
  "dq_status": "pass|blocked",
  "created_at": "iso-8601",
  "package": { }
}
```

| Rule | Value |
|------|-------|
| `package` | Full stored JSON object as persisted (may be empty object if none yet — E5 does not generate packages) |
| Unknown id | `404` / `EVALUATION_NOT_FOUND` |
| HTTP success | `200` |

### 4.9 `DecisionHistoryEnvelope` — `GET .../history`

```json
{
  "events": [
    {
      "history_id": "uuid",
      "case_id": "uuid",
      "at": "iso-8601",
      "actor": "string",
      "event": "string",
      "from_state": "string|null",
      "to_state": "string|null",
      "case_version": "integer|null",
      "payload": { }
    }
  ]
}
```

| Rule | Value |
|------|-------|
| Empty | `{ "events": [] }` / `200` |
| Ordering | `at` ascending, then `history_id` ascending |
| `event` values | Engineering Spec HistoryEventType set |
| HTTP | `200` |

### 4.10 Version resource

**Not exposed** as a standalone E5 route. `case_version` appears on `DecisionCaseResource` only.

---

## 5. Error envelope (GOV-API-04)

Reuse ADR-0006 contract error *shape* (Case API does not amend ADR-0006 semantics):

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "requestId": "string",
    "details": {}
  }
}
```

| Field | Rule |
|-------|------|
| `code` | Stable SCREAMING_SNAKE string from table below |
| `message` | Safe human-readable; no SQL/table/stack/exception class |
| `requestId` | **Required**; server-generated UUID string for every error |
| `details` | Object; may be `{}`; structured field errors under `details.fields` when validation |

### 5.1 Error table

| Situation | HTTP | `code` | `details` |
|-----------|------|--------|-----------|
| Malformed JSON / unknown fields / type errors | `422` | `VALIDATION_ERROR` | `{ "fields": { "<name>": "<reason>" } }` |
| Semantic client error (unknown type, NL mode unavailable, incomplete meaning) | `400` | `UNKNOWN_DECISION_TYPE` / `ENTRY_MODE_UNAVAILABLE` / `VALIDATION_ERROR` | optional |
| Owner isolation (Identity/Auth active — **not E5**) | `403` | `FORBIDDEN` | `{}` |
| Unknown `case_id` | `404` | `CASE_NOT_FOUND` | `{}` |
| Unknown `evaluation_id` | `404` | `EVALUATION_NOT_FOUND` | `{}` |
| Duplicate Case ID (if client-supplied id ever allowed — E5 server-generates; unused) | `409` | `DUPLICATE_CASE` | `{}` |
| Stale `expected_case_version` | `409` | `VERSION_CONFLICT` | `{ "expected_case_version": n, "current_case_version": m }` |
| Illegal lifecycle / composite precondition | `409` | `ILLEGAL_TRANSITION` | `{ "state": "<current>" }` |
| Package/DQS hard-gate (POST evaluations — **not E5**) | `422` | `DQS_BLOCKED` | reserved |
| Repository / unexpected failure | `500` | `INTERNAL_ERROR` | `{}` |

E5 **MUST NOT** emit `403` while owner isolation is deferred (§6).

---

## 6. Owner isolation without Auth runtime (GOV-API-05) — Option A

| Rule | Normative value |
|------|-----------------|
| Choice | **A — deferred** |
| E5 owner context | Single internal subject: configuration key `METIORO_E5_OWNER_SUBJECT_ID`, default `"e5-dev-owner"` for local/test |
| Client-supplied owner | **Forbidden** in E5 (no owner header/body field) |
| Attribution | Every create/list/get/write uses the configured subject |
| `403` | **Not active in E5**; documented in OpenAPI as reserved until Identity/Auth reactivation |
| Cross-owner attempts | Not expressible; foreign cases appear as `404` / `CASE_NOT_FOUND` if id unknown to this owner |

OpenAPI: document `403` on Case routes as **“Reserved — Identity/Auth”** with description that E5 does not emit it. Tests assert E5 handlers do not return `403`.

---

## 7. OpenAPI activation rule

| Content | E5 OpenAPI |
|---------|------------|
| ACTIVE_IN_E5 routes | **Included** with schemas from this supplement |
| RESERVED routes | **Excluded** |
| `activation_phase` write | **Excluded** |
| Direct `state` write / PATCH | **Excluded** |
| Error schema | Included per §5 |
| `403` responses | Documented as reserved; not asserted as emitted |

Contract tests MUST fail if OpenAPI gains a path outside the ACTIVE_IN_E5 set.

---

## 8. Transport path (normative)

```
HTTP → validation (this supplement) → DecisionCaseRepository → response mapping
```

- No route SQL.  
- No direct E3 calls when repository already coordinates transitions (`complete_case_composite` / `archive_case_composite` / create).  
- `activation_phase` derived via E3 `activation_phase()` at response map time only.

---

## 9. Documents

| Document | Role |
|----------|------|
| This file | Normative E5 wire law |
| GOV-ISSUE-003 | Issue record |
| DEC-0020 | Ratification |

ADR-0015 parent text is **not** rewritten; this supplement is binding for E5.

---

## 10. Consequences

- **RATIFIED** via DEC-0020 (2026-08-04). E5 may implement the ACTIVE subset.  
- E6/E8/E10+ activate reserved routes via later supplements/tasks without inventing E5 stubs.  
- Repository and lifecycle remain unchanged.

---

**End of ADR-0015 Wire Supplement 01**
