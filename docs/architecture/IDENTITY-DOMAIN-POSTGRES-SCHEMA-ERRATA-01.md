# Identity Domain PostgreSQL Schema — Errata 01

**Status:** Accepted  
**Date:** 2026-08-03  
**Ratified:** 2026-08-03 — explicit Product Owner approval of proposed resolutions §5.1–§5.6  
**Amends:** [IDENTITY-DOMAIN-POSTGRES-SCHEMA.md](./IDENTITY-DOMAIN-POSTGRES-SCHEMA.md) §§4–5 only  
**Inputs:** Identity Domain Design · Guest-to-User Migration State Machine · Identity PostgreSQL Schema · EPIC-01 Implementation Charter  

---

## 1. Status

**Accepted.**  
This errata is explicitly ratified. It authorizes DDL for `guest_claim_conflicts` and `guest_claim_audit` only, under DB-003 versioned SQL migrations.

It does **not** redesign Identity, the state machine, migration strategy, or previously implemented tables (`users`, `auth_identities`, `guest_installations`, `guest_claim_token_nonces`).

---

## 2. Scope

| In scope | Out of scope |
|---|---|
| Canonical stored `event_type` vocabulary | Claim transaction / orchestration |
| Conflict `status` / `resolved_at` CHECK | Resource ownership transfer |
| Audit UPDATE / DELETE database guards | Clerk / JWT / auth routes |
| `delivery_state` / `published_at` CHECK | Repositories, services, UI, billing |
| Authorization for conflicts + audit DDL only | New columns or tables |

---

## 3. Facts already ratified before this errata (unchanged)

| Fact | Source |
|---|---|
| PostgreSQL is canonical; FastAPI is Domain Authority | Identity Design; EPIC-01 Charter |
| Guests ≠ users | Identity Design |
| `guest_claim_conflicts.status` vocabulary: `open` \| `resolved` \| `cancelled` | Postgres Schema §Other vocabularies |
| Conflict columns as listed (no extra policy/resource columns) | Postgres Schema §4 |
| `(conflict_classes_redacted = true) = (scrubbed_at IS NOT NULL)` | Postgres Schema §4 |
| UNIQUE one `open` per guest; UNIQUE `idempotency_key` | Postgres Schema §4 |
| Audit columns as listed; no FK from audit to guest | Postgres Schema §5; S-INV-11 |
| `delivery_state`: `pending` \| `published` \| `not_required` | Postgres Schema §Other vocabularies |
| `pii_state`: `present` \| `redacted` | Postgres Schema §Other vocabularies |
| PII redaction CHECK on audit | Postgres Schema §5 |
| `guest_claimed` requires `user_id` | Postgres Schema §5 |
| Partial unique one `guest_claimed` per guest | Postgres Schema §5 |
| BEFORE INSERT state-guard for listed terminal/choice events | Postgres Schema §5 |
| Skeleton not rewritten except delivery + PII scrub (principle) | Postgres Schema §5 |
| Prefer scrub over dropping audit skeletons | Postgres Schema retention / S-INV-10 |

---

## 4. Contradictions / gaps this errata closed

| ID | Gap | Fragments in tension |
|---|---|---|
| G1 | Complete stored `event_type` set missing | Schema ellipsis; SM `identity.*`; TR12 `claim_idempotent` vs E2 `guest_claim_idempotent` |
| G2 | Conflict “status rules as before” undefined | Schema §4 |
| G3 | Audit UPDATE column permissions underspecified | Schema §5 prose |
| G4 | Audit DELETE predicate missing | Retention prose without DB rule |
| G5 | `delivery_state` ↔ `published_at` relationship missing | Vocabulary only |

---

## 5. Ratified resolutions

### 5.1 Canonical stored `event_type` vocabulary

**Accepted:** store **bare** snake_case strings in PostgreSQL. Treat `identity.*` as application/event-bus naming only.

**Closed CHECK set:**

```text
event_type IN (
  'guest_created',
  'claim_token_issued',
  'claim_started',
  'claim_choice_required',
  'claim_choice_submitted',
  'guest_claimed',
  'guest_claim_failed',
  'guest_claim_idempotent',
  'guest_discarded',
  'guest_expired',
  'guest_purged',
  'transition_rejected'
)
```

| Stored value | Mandatory? | Traceability |
|---|---|---|
| `guest_created` | Yes, on guest create | SM TR1; schema ellipsis start |
| `claim_token_issued` | Yes, when token issued | SM TR4 |
| `claim_started` | Optional | SM E2 optional |
| `claim_choice_required` | Yes, in awaiting_choice short TX | SM TR8b; schema state-guard |
| `claim_choice_submitted` | Yes, when choices persist | SM TR9; SM E2 |
| `guest_claimed` | Yes, with CLAIMED commit | SM TR7; schema state-guard; S-INV-5 |
| `guest_claim_failed` | Yes, in claim_failed short TX | SM TR11b; schema state-guard |
| `guest_claim_idempotent` | Yes, when that audit is written | SM E2 / I1; rejects alias `claim_idempotent` |
| `guest_discarded` | Yes, when discard persists | SM TR14; schema state-guard |
| `guest_expired` | Yes, when expiry persists | SM TR15; schema state-guard |
| `guest_purged` | Yes, when purge marks purged | SM TR16; schema state-guard |
| `transition_rejected` | Optional | SM TR21 / E2 optional; schema ellipsis end |

**Rejected aliases:** `identity.*` stored forms; `claim_idempotent`; bare `expired` / `purged` as event types.

---

### 5.2 Conflict status / `resolved_at` predicate

**Accepted:**

```text
status IN ('open','resolved','cancelled')
AND (status = 'open') = (resolved_at IS NULL)
AND (status IN ('resolved','cancelled')) = (resolved_at IS NOT NULL)
```

| status | resolved_at |
|---|---|
| `open` | MUST be NULL |
| `resolved` | MUST be NOT NULL |
| `cancelled` | MUST be NOT NULL |

Unchanged: `(conflict_classes_redacted = true) = (scrubbed_at IS NOT NULL)`; UNIQUE one `open` per guest; UNIQUE `(idempotency_key)`.

---

### 5.3 Audit UPDATE permissions

**Accepted (append-oriented, fail-closed):**

**Immutable (any change fails):**  
`id`, `event_type`, `guest_installation_id`, `user_id`, `claim_token_nonce`, `idempotency_key`, `created_at`, `retention_until`

**Mutable delivery group:** `delivery_state`, `published_at`  
- Only transition: `pending` → `published` (once)  
- Inserted `not_required` remains `not_required` forever  
- After publish: both fields immutable  

**Mutable PII-scrub group:** `payload_pii`, `pii_state`, `scrubbed_at`  
- Only transition: `present` → `redacted` (once), with `scrubbed_at` set and payload cleared to NULL/`{}`  
- Parent redaction CHECK unchanged  
- After redacted: scrub fields immutable  

Event identity and payload meaning must never be rewritten.

---

### 5.4 Audit DELETE policy

**Accepted:**  
**Direct `DELETE` on `guest_claim_audit` is always forbidden at the database level.**  
Retention uses scrub-in-place only. Any future hard-delete policy requires a separate ratified schema amendment.

---

### 5.5 `delivery_state` / `published_at` transition policy

**Accepted:**

```text
delivery_state IN ('pending','published','not_required')
AND (delivery_state = 'published') = (published_at IS NOT NULL)
AND (delivery_state <> 'published') = (published_at IS NULL)
```

| From | To | Allowed? |
|---|---|---|
| `pending` | `published` | Yes, once; must set `published_at` |
| `published` | anything | No |
| `not_required` | anything | No |

Delivery transitions are monotonic. `published_at` is immutable once set.

---

### 5.6 Schema scope confirmation

**Accepted:** no additional columns. Do not add `conflict_policy`, `resource_key`, `transaction_correlation`, `external_event_id`, or new payload fields. Existing ratified columns remain the complete schema scope. Correlation remains via `claim_token_nonce` and `idempotency_key` only.

---

## 6. Ratification record

Explicit Product Owner approval recorded 2026-08-03 for resolutions §5.1–§5.6:

1. Canonical bare `event_type` closed set and alias rejections  
2. Conflict `status` / `resolved_at` CHECK  
3. Audit UPDATE immutability / once-only delivery & scrub rules  
4. Forbid `DELETE` on `guest_claim_audit`  
5. Delivery/published CHECK and monotonic publish  
6. No new columns  

---

## 7. Implementation authorization

Engineering is authorized to implement **only**:

1. `guest_claim_conflicts` DDL + schema tests  
2. `guest_claim_audit` DDL + schema tests  

via next versioned SQL migrations under DB-003, citing this Accepted errata and the parent schema.

**Still forbidden:**

- claim transaction / orchestration  
- resource ownership transfer  
- merge execution  
- claim APIs / routes  
- Clerk / JWT / authentication middleware  
- repositories / services / UI / billing  
- ORM / migration-runner changes  
- any new runtime product behavior  
- any table beyond the two named above  

**Expected post-implementation status:**

- conflict evidence schema: implemented  
- audit evidence schema: implemented  
- claim transaction: not implemented  
- resource transfer: not implemented  
- runtime enforcement: not implemented  

---

## 8. Explicit non-changes

This Accepted errata does not change migrations `0001`–`0006`, Identity Design, state-machine transitions, Strategy Freeze topics, or previously implemented Identity tables.
