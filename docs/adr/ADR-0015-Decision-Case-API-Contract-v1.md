# ADR-0015 — Decision Case API Contract v1

**Status:** **ACCEPTED**
**Date:** 2026-08-04
**Decision makers:** Governance Resolution Board
**Resolves:** EG-03
**Authority:** Level 3 — Engineering Standards (API contract)
**Supersedes:** Nothing. Complements ADR-0014. Does not amend ADR-0006 wire v1.
**Coding authorization:** Granted for EPIC-001 Case routes conforming to this contract only.

---

## Context

EPIC-001 Implementation Plan froze path `/api/v1/decision-cases` without a ratified public contract (EG-03). ACR-0001 / ADR-0014 require Case → Engine → Package but do not freeze HTTP. A minimum public contract is required before engineering may treat the path as frozen. This ADR freezes **only** what EPIC-001 needs. No redesign. No extra endpoints beyond the minimum set required for the EPIC-001 lifecycle.

---

## Decision

### 1. Base path

| Property | Value |
|----------|-------|
| **Base** | `/api/v1/decision-cases` |
| **Content-Type** | `application/json` |
| **SoR** | Decision Case Repository only |

### 2. Endpoints (minimum set — no others in EPIC-001)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/decision-cases` | Create Case (`draft`) |
| `GET` | `/api/v1/decision-cases` | List owner Cases |
| `GET` | `/api/v1/decision-cases/{case_id}` | Get Case (ACR `state` + optional derived `activation_phase`) |
| `POST` | `/api/v1/decision-cases/{case_id}/intake/answers` | Upsert intake slot |
| `POST` | `/api/v1/decision-cases/{case_id}/intake/complete` | Complete intake → `evidence_ready` |
| `POST` | `/api/v1/decision-cases/{case_id}/evaluations` | Run DIE; persist immutable package; → `evaluated` |
| `POST` | `/api/v1/decision-cases/{case_id}/comparisons` | Compare dates when mode allows; → `compared` |
| `POST` | `/api/v1/decision-cases/{case_id}/complete` | Completion composite (LAP-001 §2.4) → `completed` |
| `POST` | `/api/v1/decision-cases/{case_id}/archive` | Archive composite (LAP-001 §2.5) → `archived` |
| `GET` | `/api/v1/decision-cases/{case_id}/evaluations` | List immutable evaluation versions |
| `GET` | `/api/v1/decision-cases/{case_id}/evaluations/{evaluation_id}` | Get `DecisionEvaluationPackage` |
| `GET` | `/api/v1/decision-cases/{case_id}/history` | Append-only history (reconstructs versions) |

No additional routes in EPIC-001.

### 3. Create body (minimum)

```json
{
  "decision_type_id": "string",
  "title": "string",
  "entry_mode": "structured | natural_language",
  "classification_text": "string|null"
}
```

Rules:

- `decision_type_id` required for `structured`.
- For `natural_language`, server classifies to a registry type (or returns `400` / clarification payload without creating an evaluable Case missing type).
- Unknown `decision_type_id` → `400`.

### 4. Case resource (minimum fields)

```json
{
  "case_id": "uuid",
  "owner_subject_id": "string",
  "decision_type_id": "string",
  "family_id": "string",
  "title": "string",
  "state": "<ACR state>",
  "activation_phase": "draft|intake|evidence_ready|evaluated|compared|completed|archived",
  "mode": "none|evaluate_date|compare_dates",
  "precision_level": "L1|L2|L3|L4|L5|L6|L7",
  "case_version": 1,
  "created_at": "iso-8601",
  "updated_at": "iso-8601"
}
```

Rules:

- `state` is System of Record (ACR).
- `activation_phase` is derived only (LAP-001 §2.7).
- Clients MUST NOT PATCH `state` directly; only command routes above.

### 5. Evaluation response

Successful `POST .../evaluations` and `GET .../evaluations/{id}` return envelope + **full** `DecisionEvaluationPackage` v1 module set per ACR-0001 §B3 (no reduced module set).

### 6. Errors (minimum)

| HTTP | When |
|------|------|
| `400` | Validation / unknown type / incomplete intake complete |
| `403` | Owner isolation failure |
| `404` | Unknown case_id |
| `409` | Illegal state transition (including LAP-001 composite preconditions) |
| `422` | Package/DQS hard-gate failure (Case remains prior state) |

### 7. Relationship to ADR-0006 / ADR-0007

- This contract is the **Case SoR HTTP API**.
- ADR-0006 `/api/v1/decision/execute` may receive **lossy projections** only (ACR M1); it is not Case SoR.
- ADR-0007 Conversation MUST NOT evaluate Cases; may assist intake text only.

### 8. Out of scope

Auth scheme details beyond owner isolation; pagination shape beyond “supported”; webhooks; batch; Find Best Window; graph; non-EPIC-001 routes.

---

## Consequences

- EG-03 resolved: path freeze is now contract-backed.
- Engineering may implement exactly these routes.
- Adding routes requires a new ADR or amendment — not silent expansion.

---

## References

- ACR-0001
- ADR-0014
- LAP-001
- EPIC-001 Engineering Spec
- GOV-ISSUE-001 Option A (package modules)
