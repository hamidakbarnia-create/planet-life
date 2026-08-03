# Identity Domain PostgreSQL Schema — Errata 01

**Status:** Ratified (schema clarification only)
**Date:** 2026-08-03
**Amends:** [IDENTITY-DOMAIN-POSTGRES-SCHEMA.md](./IDENTITY-DOMAIN-POSTGRES-SCHEMA.md) §§4–5 only
**Inputs:** Identity Domain Design · Guest-to-User Migration State Machine · Identity PostgreSQL Schema · EPIC-01 Implementation Charter

---

## 1. Status

This errata resolves **documentation blockers** that prevented implementing `guest_claim_conflicts` and `guest_claim_audit` without inventing predicates.

It does **not** redesign Identity, the state machine, migration strategy, or previously implemented tables (`users`, `auth_identities`, `guest_installations`, `guest_claim_token_nonces`).

---

## 2. Scope

| In scope | Out of scope |
|---|---|
| Canonical `guest_claim_audit.event_type` vocabulary | Claim transaction / orchestration |
| Conflict `status` / `resolved_at` CHECK | Resource ownership transfer |
| Audit UPDATE / DELETE database guards | Clerk / JWT / auth routes |
| `delivery_state` / `published_at` CHECK | Repositories, services, UI, billing |
| Authorization for conflicts + audit DDL only | New columns or tables |

---

## 3. Exact ambiguities resolved

| ID | Prior ambiguity | Resolution |
|---|---|---|
| A1 | `event_type` listed as `guest_created … transition_rejected` without a complete set; SM used both bare and `identity.*` names; TR12 used `claim_idempotent` vs E2 `guest_claim_idempotent` | One bare-string vocabulary in PostgreSQL; `identity.*` is application/event-bus naming only; canonical idempotent event is `guest_claim_idempotent` |
| A2 | Conflict “status rules as before” unspecified | Explicit `status` ∈ {open,resolved,cancelled} and `resolved_at` pairing CHECK |
| A3 | Audit “skeleton never updated except …” without column lists | Exact immutable vs mutable column sets and transition limits |
| A4 | “No delete … before policy allows” without a DB predicate | Direct `DELETE` forbidden at database level; retention via scrub-in-place only |
| A5 | `delivery_state` / `published_at` relationship unspecified | Explicit CHECK + monotonic publish rule |

---

## 4. Canonical `event_type` list

### Naming rule

- **Stored in PostgreSQL `guest_claim_audit.event_type`:** bare snake_case strings below.
- **`identity.` prefix:** application / event-bus display only — **not** stored in the column.
- Example: bus may emit `identity.guest_claimed`; row stores `guest_claimed`.

### Complete vocabulary (closed set)

| Stored `event_type` | SM / effect correspondence | Mandatory? | Notes |
|---|---|---|---|
| `guest_created` | TR1 · `E_GUEST_CREATED` | **Mandatory** on guest row creation | |
| `claim_token_issued` | TR4 · `E_CLAIM_TOKEN_ISSUED` | **Mandatory** when a claim token is issued | |
| `claim_started` | E2 optional · claim attempt metadata persisted (enter/resume claim path) | **Optional** | Must not imply `CLAIMED` |
| `claim_choice_required` | TR8b · short TX persisting `awaiting_choice` + conflict | **Mandatory** in that short TX | State-guarded |
| `claim_choice_submitted` | TR9 · `E_CHOICE_SUBMITTED` | **Mandatory** when choices persist | |
| `guest_claimed` | TR7 · `E_CLAIM_COMMIT` success | **Mandatory** with CLAIMED commit | State-guarded; ≤1 per guest |
| `guest_claim_failed` | TR11b · persist `claim_failed` | **Mandatory** in that short TX | State-guarded |
| `guest_claim_idempotent` | I1 / E2 · already CLAIMED same user | **Mandatory** when idempotent success audit is written | **Rejects alias** `claim_idempotent` |
| `guest_discarded` | TR14 · `E_DISCARD_REQUESTED` | **Mandatory** when discard persists | State-guarded |
| `guest_expired` | TR15 · `E_TTL_ELAPSED` | **Mandatory** when expiry persists | State-guarded |
| `guest_purged` | TR16 · `E_PURGE_RUN` success | **Mandatory** when purge marks purged | State-guarded |
| `transition_rejected` | TR21 · undefined/invalid transition | **Optional** | No domain mutation |

**Rejected aliases (must not be stored):**

- `identity.*` prefixed forms
- `claim_idempotent` (use `guest_claim_idempotent`)
- `expired` / `purged` as standalone event types (use `guest_expired` / `guest_purged`)

### CHECK (normative)

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

State-coupling trigger requirements in the parent schema remain in force for the guarded event types listed there (using these bare names).

---

## 5. Conflict status predicate

### Values

`guest_claim_conflicts.status ∈ {'open','resolved','cancelled'}`
Default remains `'open'`.

### `resolved_at` pairing (normative CHECK)

```text
(status = 'open') = (resolved_at IS NULL)
AND
(status IN ('resolved','cancelled')) = (resolved_at IS NOT NULL)
```

Meaning:

| status | resolved_at |
|---|---|
| `open` | **MUST** be NULL |
| `resolved` | **MUST** be NOT NULL |
| `cancelled` | **MUST** be NOT NULL |

Unchanged from parent schema:
`(conflict_classes_redacted = true) = (scrubbed_at IS NOT NULL)`
UNIQUE one `open` per guest; UNIQUE `(idempotency_key)`.

---

## 6. Audit UPDATE guard rules

Default: **append-oriented, fail-closed**.

### Immutable columns (any UPDATE that changes these **MUST** fail)

- `id`
- `event_type`
- `guest_installation_id`
- `user_id`
- `claim_token_nonce`
- `idempotency_key`
- `created_at`
- `retention_until`

Event identity and skeleton correlation **must never** be rewritten.

### Mutable delivery columns

- `delivery_state`
- `published_at`

Rules:

1. Allowed delivery transitions only:
   - `pending` → `published`
   - no other delivery_state changes
   - rows inserted as `not_required` remain `not_required` forever
2. Transition `pending` → `published` may occur **once**.
3. After `delivery_state = 'published'`, both `delivery_state` and `published_at` are **immutable**.

### Mutable PII-scrub columns

- `payload_pii`
- `pii_state`
- `scrubbed_at`

Rules:

1. Allowed scrub transition **once**:
   - `pii_state`: `present` → `redacted`
   - `scrubbed_at`: NULL → non-NULL
   - `payload_pii`: any → NULL or `'{}'::jsonb`
2. Parent CHECK remains:
   `(pii_state = 'redacted') = (scrubbed_at IS NOT NULL AND (payload_pii IS NULL OR payload_pii = '{}'::jsonb))`
3. After `pii_state = 'redacted'`, scrub columns are **immutable** (no second scrub, no restore).

### Forbidden

- Rewriting `event_type`, bindings, or `idempotency_key`
- Any UPDATE outside the delivery and scrub groups above

---

## 7. Audit DELETE rule

**Direct `DELETE` on `guest_claim_audit` is always forbidden at the database level.**

Retention and purge of personal data **MUST** use scrub-in-place (`pii_state` / `payload_pii` / `scrubbed_at`) per the parent schema. Hard deletion of audit skeletons is **not** authorized by this errata.

---

## 8. `delivery_state` / `published_at` predicate

### Values

`delivery_state ∈ {'pending','published','not_required'}`
Default remains `'not_required'`.

### CHECK (normative)

```text
delivery_state IN ('pending','published','not_required')
AND
(delivery_state = 'published') = (published_at IS NOT NULL)
AND
(delivery_state <> 'published') = (published_at IS NULL)
```

### Transition / immutability

| From | To | Allowed? |
|---|---|---|
| `pending` | `published` | Yes, once; must set `published_at` |
| `published` | anything | No |
| `not_required` | anything | No |
| `pending` | `not_required` | No |
| `published` | clear `published_at` | No |

`published_at` is immutable once set (same moment as publish).

---

## 9. Explicit non-changes

This errata does **not**:

- Add columns such as `conflict_policy`, `resource_key`, `transaction_correlation`, `external_event_id`, or new payload fields
- Change `guest_installations`, `guest_claim_token_nonces`, `users`, or `auth_identities`
- Authorize claim transaction, resource transfer, merge execution, APIs, Clerk, JWT, or runtime auth
- Reopen Strategy Freeze topics or EPIC-05+ work
- Alter migration runner mechanics

`claim_token_nonce` and `idempotency_key` remain the ratified correlation fields already on `guest_claim_audit`.

---

## 10. Implementation authorization

**After this errata is committed**, engineering is authorized to implement **only**:

1. `guest_claim_conflicts` DDL + schema tests
2. `guest_claim_audit` DDL + schema tests

via the next versioned SQL migrations under DB-003, citing this errata and the parent schema.

**Still forbidden in that PR:**

- claim transaction / orchestration
- resource ownership transfer
- merge execution
- claim APIs / routes
- Clerk / JWT / auth middleware
- repositories / services / UI / billing / product logic
- ORM / migration-runner changes
- any table beyond the two named above

**Expected post-implementation status:**

- conflict evidence schema: implemented
- audit evidence schema: implemented
- claim transaction: not implemented
- resource transfer: not implemented
- runtime enforcement: not implemented

---

## Ratification

| Gate | Status |
|---|---|
| Vocabulary closed and alias-free | Yes |
| Conflict status predicate exact | Yes |
| Audit UPDATE/DELETE expressible as triggers/CHECKS | Yes |
| delivery/published predicate exact | Yes |
| No new columns | Yes |
| Conflicts + audit DDL authorized | **Yes** (only) |
