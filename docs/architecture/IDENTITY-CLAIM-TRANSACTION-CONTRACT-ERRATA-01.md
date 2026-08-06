# Identity Claim Transaction Contract — Errata 01

**Status:** Proposed — awaiting explicit ratification
**Date:** 2026-08-03
**Amends (if ratified):** claim-transaction implementation contract only
**Does not amend:** Identity Domain Design principals · Guest-to-User Migration State Machine modes/events · Accepted Schema Errata 01 DDL predicates · migrations `0001`–`0008`
**Inputs:** Identity Domain Design §§7–9 · Guest-to-User Migration State Machine §§3–10, TR7–TR21 · Identity PostgreSQL Schema · Schema Errata 01 · EPIC-01 Implementation Charter · claim-transaction readiness review

---

## 1. Status

**Proposed governance clarification.**
This document is **not** ratified and does **not** authorize claim-transaction code by itself.

It drafts the smallest fail-closed contract needed before a **zero-resource claim transaction core** can be implemented without inventing entrypoint, lock-order, token-outcome, audit-coupling, or idempotency predicates.

It does **not** redesign Identity, reopen Strategy Freeze topics, authorize Clerk/JWT/APIs, authorize resource transfer, or authorize a resource policy registry.

---

## 2. Scope

| In scope (proposal) | Out of scope |
|---|---|
| Zero-resource claim TX core contract | Product-resource transfer |
| Internal Domain Authority entrypoint shape | HTTP routes / request DTOs / UI |
| Canonical lock order for this slice | Clerk / JWT verification |
| Token validation outcome matrix | Concrete resource registry entries |
| Audit coupling for this slice | Conflict UX / choice submission flow |
| Idempotency key derivation | Migrations / ORM / repositories |
| Failure / retry observation rules | Billing, merge execution, purge jobs |

---

## 3. Ratified facts (unchanged)

These are already locked and are **not** reopened:

| Fact | Source |
|---|---|
| FastAPI is Domain Authority; PostgreSQL is canonical | Identity Design; EPIC-01 Charter |
| Guests ≠ users; guest = `guest_installations` only | Identity Design |
| Claim and purge fence on `guest_installations` `FOR UPDATE` | SM E4; Schema S-INV-7 |
| No TX/lock held across user choice UX | SM E1 |
| Choice/failure durable state uses short TX after claim-TX rollback | SM §4.2–§4.3 |
| Token binds guest + user + `purpose=guest_claim` + nonce + exp; single-use | SM E3 |
| `guest_claimed` audit only with persisted `CLAIMED`/`claimed` | SM E2; Schema audit state guard |
| Bare stored `event_type` vocabulary (no `identity.` prefix in DB) | Schema Errata 01 |
| Canonical event includes `guest_claim_idempotent` (not `claim_idempotent`) | Schema Errata 01 |
| No production business table currently has XOR ownership columns | Readiness review / migrations `0001`–`0008` |
| No concrete guest-capable resource registry is ratified | Identity Design §Out of scope |
| Resource policy vocabulary exists; registry entries deferred | Identity Design §8 |

---

## 4. Proposed zero-resource claim contract

### 4.1 First executable slice

**Proposal:** the first claim implementation supports only:

1. Trusted internal caller supplies already-resolved `user_id` (no Clerk/JWT in this slice)
2. `guest_installation_id`
3. Claim-token nonce + binding validation against `guest_claim_token_nonces`
4. **Empty product-resource transfer plan** (zero rows transferred)
5. Guest transition to `lifecycle_state = claimed` / `claim_state = claimed`
6. Exactly-once nonce consumption (`issued` → `consumed`) in the same successful claim TX
7. `guest_claimed` audit in that same TX
8. Idempotent same-user repeat behavior

**Explicitly deferred:** all product-resource transfer, merge, park, drop, prefer_*, conflict-choice UX, Clerk/JWT, HTTP claim APIs.

### 4.2 Zero-resource claim rule

**Proposal:** a guest with **no transferable product resources** may complete a **full successful claim**.

| Rule | Statement |
|---|---|
| ZR-1 | Empty transfer set does **not** create a conflict |
| ZR-2 | Empty transfer set does **not** require a resource policy registry |
| ZR-3 | Claim continues through nonce consume + `CLAIMED` + `guest_claimed` audit |
| ZR-4 | Successful zero-resource claim is a **complete** claim, not partial or degraded |
| ZR-5 | This slice **never** produces `awaiting_choice` (no conflict classes exist yet) |

**Traceability:** Design §9.2 “guest empty for class → continue claim”; SM T6–T10 become no-ops; T11–T14 remain mandatory.

---

## 5. Internal entrypoint contract

**Proposal:** one internal Domain Authority operation (conceptual; not an HTTP route):

```text
claim_guest_installation_zero_resource(
  guest_installation_id,
  user_id,                 -- trusted pre-resolved users.id
  claim_token_nonce,
  client_request_key?      -- optional caller correlation; see §9
) -> ClaimResult
```

### 5.1 Minimum inputs

| Input | Required | Notes |
|---|---|---|
| `guest_installation_id` | Yes | Target guest principal |
| `user_id` | Yes | Existing `users.id`; not a Clerk `sub` |
| `claim_token_nonce` | Yes | Ledger nonce value |
| `client_request_key` | No | Caller correlation only; **not** the DB audit UNIQUE key |

Domain Authority **derives** all `guest_claim_audit.idempotency_key` / conflict keys (§9). Callers do not invent schema keys.

### 5.2 Result categories

| Result | Meaning in this slice |
|---|---|
| `claimed` | First successful zero-resource claim committed |
| `already_claimed_idempotent` | Guest already `CLAIMED` by same `user_id`; no re-consume; no re-transfer |
| `awaiting_choice` | **Reserved / unreachable** in this slice (ZR-5) |
| `rejected` | Validation or authorization failure; guest claim state unchanged by the failed attempt |
| `failed` | Attempt entered mutate path and was durably recorded as `claim_failed` via short TX after rollback |

No routes, DTOs, Clerk claims, or UI are defined here.

---

## 6. Lock order

### 6.1 Canonical order (zero-resource slice)

**Proposal — single canonical order:**

1. `BEGIN`
2. **Validate** `users` row exists for `user_id` — **shared/read only, no row lock**
3. `SELECT … FOR UPDATE` **`guest_installations`** by `guest_installation_id`
4. Re-check guest preconditions under that lock (SM P3–P5, P8–P10 as applicable)
5. `SELECT … FOR UPDATE` **`guest_claim_token_nonces`** by `nonce`
6. Validate nonce binding / status / expiry under that lock (SM P6, E3)
7. Apply guest state mutation (to `pending_claim`/`claim_in_progress` then `claimed`/`claimed`, or observe already `claimed`)
8. Apply nonce terminal mutation when required by §7 (`consumed` on success path only)
9. Insert `guest_claim_audit` row(s) required by §8
10. `COMMIT`

### 6.2 Tables locked only when needed

| Object | Lock in this slice? | Why |
|---|---|---|
| `guest_installations` | Always (`FOR UPDATE`) | Claim/purge fence (SM E4; S-INV-7) |
| `guest_claim_token_nonces` | Yes, on the target nonce (`FOR UPDATE`) | Exactly-once consume; avoid concurrent consume races |
| `users` | No write lock | This slice does not mutate `users`; existence + later FK `RESTRICT` suffice |
| `guest_claim_conflicts` | **Not locked / not written** in happy or reject paths of this slice | ZR-5; no conflict classes yet |
| `guest_claim_audit` | Insert only (no `FOR UPDATE`) | Append-only skeleton; uniqueness via `idempotency_key` / partial unique |
| Product resource rows | **None** | No guest-capable tables exist; deferred |

### 6.3 Extensibility note (not authorized yet)

When resource transfer is later ratified, resource row locks MUST be taken **after** guest + nonce locks and **before** guest `CLAIMED` commit, in a stable global order (`table_name ASC`, `primary_key ASC`) to prevent deadlocks. That ordering is **not** authorized by this proposal.

---

## 7. Token outcome matrix

### 7.1 Resolution of S5 vs I4

Ratified tension:

- SM S5 / TR20: missing/invalid token → reject; **no mutation**
- SM I4: binding mismatch → reject; **revoke token**; no **guest** mutation

**Proposal:**

- **Guest claim state never mutates** on validation failure.
- **Nonce mutation is allowed only** for a found ledger row still in `issued` that fails binding or expiry checks, and only as `issued → revoked` or `issued → expired` in a **dedicated short TX** that does not mutate the guest.
- Missing nonce, already-terminal nonce, or revoke/expire short-TX failure → **reject** without pretending success.
- Validation failure is never silently converted into guest `CLAIMED` / `CLAIM_FAILED` / `AWAITING_CHOICE`.

### 7.2 Outcomes

| Outcome | Guest state change | Nonce state change | Audit | Result |
|---|---|---|---|---|
| Nonce not found | None | None | Forbidden | `rejected` |
| Binding mismatch (row found, still `issued`) | None | Short TX: `issued → revoked` | Optional `transition_rejected` in that short TX or none | `rejected` |
| Token expired (row found, still `issued`, `expires_at` past) | None | Short TX: `issued → expired` | Optional `transition_rejected` or none | `rejected` |
| Token already `consumed` + guest `CLAIMED` by same user | None | None | Mandatory `guest_claim_idempotent` if absent; else no new audit | `already_claimed_idempotent` |
| Token already `consumed` + guest not `CLAIMED` by same user | None | None | Forbidden | `rejected` |
| Token `revoked` | None | None | Forbidden | `rejected` |
| Token `expired` (already terminal) | None | None | Forbidden | `rejected` |
| Guest already `CLAIMED` by same user (any valid observe path) | None | None (do not re-consume) | Mandatory `guest_claim_idempotent` if absent | `already_claimed_idempotent` |
| Guest already `CLAIMED` by another user | None | None | Forbidden | `rejected` |
| Claim already in progress (`pending_claim`/`claim_in_progress` held by another live TX / observed under lock) | None | None | Forbidden | `rejected` |
| Happy-path zero-resource success | → `claimed`/`claimed` | Same TX: `issued → consumed` | Mandatory `guest_claimed` same TX | `claimed` |

**Notes**

- Optional `transition_rejected` must not imply guest state change (Schema Errata 01; SM E2).
- No state-guarded audit (`guest_claimed`, `guest_claim_failed`, `claim_choice_required`, etc.) may be written unless matching persisted state exists in the **same committed TX**.

---

## 8. Audit coupling matrix

Stored `event_type` values are bare (Schema Errata 01).

| Outcome | Required audit | Write location | Compatibility with state guard |
|---|---|---|---|
| Successful zero-resource claim | **Mandatory** `guest_claimed` | **Inside main claim TX** after guest is `claimed`/`claimed` and before `COMMIT` | Requires claimed guest + `user_id` |
| Idempotent same-user repeat | **Mandatory once** `guest_claim_idempotent` (if no prior row for derived key) | Short or observe TX that sees persisted `CLAIMED` for that user | Requires claimed guest + matching `user_id` |
| Choice required | N/A in this slice | — | Unreachable (ZR-5) |
| Claim failure after mutate-path rollback | **Mandatory** `guest_claim_failed` | **Separate short TX after rollback** that persists `active`/`claim_failed` | Requires `active`/`claim_failed` |
| Invalid / expired token rejection | Audit **forbidden** as mandatory; optional `transition_rejected` only | If used: short TX with **no** guest mutation (and nonce revoke/expire if §7 applies) | `transition_rejected` has no guest-state guard |
| Already claimed by another user | Audit **forbidden** | — | Must not write `guest_claimed` / idempotent for wrong user |
| Transition rejection (undefined mode/event) | Optional `transition_rejected` | Short TX; no guest mutation | No guest-state guard |

**Hard coupling rules**

1. Never write `guest_claimed` unless guest is already `claimed`/`claimed` in the same TX.
2. Never leave `CLAIMED` committed without `guest_claimed` audit (atomic with success TX).
3. Never write `guest_claim_failed` in a rolled-back claim TX; use short TX after rollback.
4. Never require an audit that the accepted state guard would reject.

---

## 9. Idempotency contract

### 9.1 Authoritative keys

**Proposal:** Domain Authority derives DB idempotency keys. Callers do not supply the schema UNIQUE key.

| Purpose | Derived `idempotency_key` |
|---|---|
| Success audit | `guest_claimed:{guest_installation_id}` |
| Idempotent-repeat audit | `guest_claim_idempotent:{guest_installation_id}:{user_id}` |

Optional `client_request_key` is correlation-only for logs/tests. It MUST NOT be inserted as `guest_claim_audit.idempotency_key` unless it equals the derived key for that outcome.

### 9.2 Uniqueness boundary

- Success: at most one `guest_claimed` audit per guest (schema partial unique + derived key).
- Idempotent repeat: at most one `guest_claim_idempotent` audit per `(guest_installation_id, user_id)`.
- Nonce remains the single-use token identity; idempotency keys are audit/conflict keys, not substitute tokens.

### 9.3 Behaviors

| Case | Behavior |
|---|---|
| Same derived key / same logical outcome already committed | Return existing outcome; do not rewrite audit skeleton |
| Same derived key / different logical outcome attempted | Reject (`rejected`); do not overwrite |
| Caller `client_request_key` differs across retries | Ignored for DB identity; observation of persisted `CLAIMED` still yields `already_claimed_idempotent` |
| Relationship to nonce | Success consume binds that nonce once; later calls may omit a live `issued` nonce only when I1 observe-path applies (already `CLAIMED` by same user). If a nonce is presented after success consume → I1 / I2 |
| After successful `CLAIMED` observed | No resource work; no second consume; ensure idempotent audit per §8; return `already_claimed_idempotent` |

---

## 10. Failure and retry semantics

| Case | Behavior |
|---|---|
| Validation failure before any guest/nonce mutate | Return `rejected`; no guest change; nonce change only per §7 short TX revoke/expire |
| Database error before commit of main claim TX | `ROLLBACK`; no `CLAIMED`; no `consumed`; no success audit |
| Error after nonce row locked but before guest terminal mutation | `ROLLBACK` releases locks; nonce remains `issued` |
| Audit insertion failure in success TX | `ROLLBACK` entire claim TX; preserves “no `CLAIMED` without `guest_claimed`” and “no `consumed` without successful claim commit” |
| Commit uncertainty / client timeout | Retry **must** `FOR UPDATE` guest and observe: if `CLAIMED` by same user → `already_claimed_idempotent`; if still claimable → new attempt only with still-`issued` nonce or newly issued nonce; never re-apply transfers (none in this slice) |
| Mutate-path failure after guest entered `pending_claim`/`claim_in_progress` and TX rolled back | Short TX may persist `claim_failed` + `guest_claim_failed` (SM §4.3); return `failed` |
| Retry after `claim_failed` | Allowed with a **new** issued token (SM §6); re-observe under lock first |

**Preserved invariants**

- No partial ownership mutation (vacuously true: transfer set empty)
- No committed `CLAIMED` without required `guest_claimed` audit
- No committed `consumed` nonce without corresponding successful claim commit
- Retries observe persisted state before reapplying work

---

## 11. Resource registry deferral

**Proposal:**

1. No registry implementation is authorized by this document.
2. No placeholder policies may be added for nonexistent tables.
3. No product table may become guest-capable without a separate domain-specific ratified ownership + policy decision.
4. This claim contract accepts an **empty transfer plan only**.
5. Later resource integration requires a separate schema (XOR ownership columns) and policy amendment before transfer steps may be enabled.

---

## 12. Runtime DB boundary

**Proposal (not implemented here):** reuse the existing **psycopg** PostgreSQL approach already used by DB-003 / identity tests. No ORM.

| Topic | Proposed rule |
|---|---|
| Connection ownership | Domain Authority claim code opens/receives an explicit `psycopg` connection; no global hidden pool required for this slice |
| Transaction ownership | Claim entrypoint owns `BEGIN` / `COMMIT` / `ROLLBACK` for the main claim TX; short TXs are separate explicit transactions |
| Explicit commit/rollback | No implicit commit; failure paths roll back; success commits once |
| Test isolation | Continue `METIORO_IDENTITY_TEST_DATABASE_URL` / embedded identity_test harness; tests call the internal entrypoint directly |
| Startup | Application startup must **not** open claim transactions or migrate-on-startup |

---

## 13. Explicit non-changes

This proposal does **not** change:

- migrations `0001`–`0008`
- Accepted Schema Errata 01 predicates
- SM modes/events/transitions (except clarifying implementation contract for an empty transfer set)
- Identity Design principals or Clerk-as-IdP decision
- Strategy Freeze topics
- Production APIs, UI, billing, or product tables

---

## 14. Implementation authorization after ratification

If and when this errata is **explicitly ratified**, engineering would then be authorized to implement **only**:

1. Internal zero-resource claim Domain Authority function + focused PostgreSQL/integration tests
2. Using trusted test/internal `user_id` (no Clerk/JWT)
3. Empty transfer plan only
4. Lock order, token matrix, audit coupling, and idempotency rules in §§6–10

**Still forbidden after ratification of this document alone:**

- HTTP claim APIs
- Clerk / JWT middleware
- Resource registry / ownership-column migrations on product tables
- Resource transfer execution
- Conflict-choice UX
- Repositories/ORM frameworks
- Purge/expiry job implementation (unless separately authorized)

**Until ratification:** claim-transaction implementation remains **blocked**.

---

## 15. Decisions requiring explicit approval

Before any claim-transaction PR:

1. Approve zero-resource claim as a complete first slice (§4)
2. Approve internal entrypoint inputs/results (§5)
3. Approve lock order (§6)
4. Approve token outcome matrix and S5/I4 resolution (§7)
5. Approve audit coupling matrix (§8)
6. Approve derived idempotency keys (§9)
7. Approve failure/retry observation rules (§10)
8. Approve registry deferral and empty-transfer-only rule (§11)
9. Approve psycopg runtime DB boundary (§12)

Until those approvals are recorded, this errata remains **Proposed**.
