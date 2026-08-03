# Identity Domain PostgreSQL Schema — Errata 01

**Status:** Proposed — awaiting explicit ratification
**Date:** 2026-08-03
**Amends (if ratified):** [IDENTITY-DOMAIN-POSTGRES-SCHEMA.md](./IDENTITY-DOMAIN-POSTGRES-SCHEMA.md) §§4–5 only
**Inputs:** Identity Domain Design · Guest-to-User Migration State Machine · Identity PostgreSQL Schema · EPIC-01 Implementation Charter

---

## 1. Status

**Proposed governance clarification.**
This document is **not** ratified and does **not** authorize DDL by itself.

It drafts the smallest fail-closed resolutions needed before `guest_claim_conflicts` and `guest_claim_audit` can be implemented without inventing predicates.

It does **not** redesign Identity, the state machine, migration strategy, or previously implemented tables (`users`, `auth_identities`, `guest_installations`, `guest_claim_token_nonces`).

---

## 2. Scope

| In scope (proposal) | Out of scope |
|---|---|
| Canonical stored `event_type` vocabulary | Claim transaction / orchestration |
| Conflict `status` / `resolved_at` CHECK | Resource ownership transfer |
| Audit UPDATE / DELETE database guards | Clerk / JWT / auth routes |
| `delivery_state` / `published_at` CHECK | Repositories, services, UI, billing |
| Proposed authorization for conflicts + audit DDL only | New columns or tables |

---

## 3. Facts already ratified (unchanged)

These are already locked in committed Identity documents and are **not** reopened:

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

## 4. Contradictions / gaps found

| ID | Gap | Fragments in tension |
|---|---|---|
| G1 | Complete stored `event_type` set missing | Schema: “`guest_created` … `transition_rejected`”; SM E2 uses `identity.*`; TR effects use bare names; TR12 says `claim_idempotent` while E2 says `guest_claim_idempotent` |
| G2 | Conflict “status rules as before” undefined | Schema §4 CHECK points to absent prior text; only vocabulary is locked |
| G3 | Audit UPDATE column permissions underspecified | Schema §5 prose allows delivery + PII scrub updates without exact column sets / once-vs-many rules |
| G4 | Audit DELETE predicate missing | “No delete … before policy allows” without a DB-expressible condition |
| G5 | `delivery_state` ↔ `published_at` relationship missing | Vocabulary locked; pairing/monotonicity not locked |

---

## 5. Proposed resolutions

### 5.1 Canonical stored `event_type` vocabulary

**Proposal (governance choice):** store **bare** snake_case strings in PostgreSQL. Treat `identity.*` as application/event-bus naming only.

**Proposed closed CHECK set:**

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
| `guest_created` | Yes, on guest create | SM TR1 audit `guest_created`; schema ellipsis start |
| `claim_token_issued` | Yes, when token issued | SM TR4 |
| `claim_started` | Optional | SM E2 `identity.claim_started` (optional); no TR mandatory audit |
| `claim_choice_required` | Yes, in awaiting_choice short TX | SM TR8b; schema state-guard row |
| `claim_choice_submitted` | Yes, when choices persist | SM TR9; SM E2 |
| `guest_claimed` | Yes, with CLAIMED commit | SM TR7; schema state-guard; S-INV-5 |
| `guest_claim_failed` | Yes, in claim_failed short TX | SM TR11b; schema state-guard |
| `guest_claim_idempotent` | Yes, when that audit is written | SM E2 / I1; **prefer over** TR12 shorthand `claim_idempotent` |
| `guest_discarded` | Yes, when discard persists | SM TR14; schema state-guard |
| `guest_expired` | Yes, when expiry persists | SM TR15; schema state-guard |
| `guest_purged` | Yes, when purge marks purged | SM TR16; schema state-guard |
| `transition_rejected` | Optional | SM TR21 / E2 optional; schema ellipsis end |

**Proposed rejected aliases:** `identity.*` stored forms; `claim_idempotent`; bare `expired` / `purged` as event types.

**Requires approval:** yes — closed vocabulary + alias rejection.

---

### 5.2 Conflict status / `resolved_at` predicate

**Proposal (governance choice; fail-closed):**

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

**Traceability:** reconciles schema vocabulary (`open|resolved|cancelled`) and §4 “status rules as before” gap; aligns with terminal conflict handling in purge prelude (open → cancelled/resolved).

**Requires approval:** yes — especially cancelled ⇒ `resolved_at NOT NULL`.

---

### 5.3 Audit UPDATE permissions

**Proposal (governance choice; append-oriented, fail-closed):**

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

**Traceability:** refines schema §5 “Skeleton columns are never updated except delivery_state/published_at and PII scrub fields” into exact column sets and once-only limits; keeps fail-closed append posture from S-INV-8 / retention scrub preference.

**Requires approval:** yes — once-only delivery/scrub and `not_required` freeze.

---

### 5.4 Audit DELETE policy

**Proposal (governance choice; strictest fail-closed):**
**Direct `DELETE` on `guest_claim_audit` is always forbidden at database level.**
Retention uses scrub-in-place only.

**Traceability:** chooses a DB-expressible rule where schema only says “No delete of skeleton before policy allows” and “scrub PII instead of dropping rows when possible” / preserve claim skeletons (retention section, S-INV-10). Hard-delete purge condition is **not** defined in ratified text, so proposing forbid-DELETE rather than inventing a purge predicate.

**Requires approval:** yes.

---

### 5.5 `delivery_state` / `published_at` transition policy

**Proposal (governance choice):**

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

`published_at` immutable once set.

**Traceability:** pairs schema vocabulary for `delivery_state` with outbox semantics implied by “Outbox” note on `delivery_state` / `published_at` columns; adds monotonic publish because schema lacked pairing rules.

**Requires approval:** yes.

---

### 5.6 Schema scope confirmation (proposal)

**No new columns.** Do not add `conflict_policy`, `resource_key`, `transaction_correlation`, `external_event_id`, or new payload fields.
Correlation remains via existing `claim_token_nonce` and `idempotency_key` only.

---

## 6. Decisions requiring explicit approval

Before any conflicts/audit DDL PR:

1. Approve bare `event_type` closed set and alias rejections in §5.1
2. Approve conflict `status`/`resolved_at` CHECK in §5.2
3. Approve audit UPDATE immutability / once-only delivery & scrub rules in §5.3
4. Approve forbid-DELETE on `guest_claim_audit` in §5.4
5. Approve delivery/published CHECK and monotonic publish in §5.5

Until those approvals are recorded, this errata remains **Proposed**.

---

## 7. Proposed implementation authorization (only if ratified)

If and when this errata is **explicitly ratified**, engineering would then be authorized to implement **only**:

1. `guest_claim_conflicts` DDL + schema tests
2. `guest_claim_audit` DDL + schema tests

via next versioned SQL migrations under DB-003.

Still forbidden in that PR: claim transaction, resource transfer, merge execution, claim APIs, Clerk/JWT, repositories/services/UI/billing, ORM, migration-runner changes, any additional tables.

**Until ratification:** conflicts/audit schema PR remains **blocked**.

---

## 8. Explicit non-changes

This proposal does not change migrations `0001`–`0006`, Identity Design, state-machine transitions, Strategy Freeze topics, or previously implemented Identity tables.
