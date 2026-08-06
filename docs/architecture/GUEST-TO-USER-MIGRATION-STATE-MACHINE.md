# Guest-to-User Migration State Machine

**Status:** Architecture-ratified (Safety-corrected) · Coding gated  
**Date:** 2026-08-03  
**Revision:** Normative errata from safety audit (happy path unchanged: M0 → M1 → M4)  
**Scope:** State machine + transition table only  
**Authority:** FastAPI Domain Authority · PostgreSQL transaction  
**Locked:** Guests ≠ users · Clerk authenticates only · `users.id` canonical after claim  
**Non-goals:** Code, SQL, migrations, endpoints, commits  

---

## Normative errata applied

| # | Correction |
|---|---|
| E1 | User choice: no TX/lock held across UX; evaluation TX rolls back; `AWAITING_CHOICE` + conflict ticket persist in a **separate short TX** |
| E2 | Audit consistency: `guest_claimed` only with `CLAIMED` (same TX / transactional outbox); failure/choice/idempotent audits only with matching persisted state; forbid success audit unless `CLAIMED` |
| E3 | Claim token binds `guest_installation_id`, `users.id`, `purpose=guest_claim`, unique `nonce`, `exp`; validate all; single-use |
| E4 | Purge and claim both lock the same guest row and re-check under lock; purge aborts if pending / in progress / claimed |
| E5 | Timeout recovery never marks failed while a live claim TX may still commit; inspect under lock; already-`CLAIMED` → idempotent success; retries never reapply transfers |
| E6 | `CLAIMED` irreversible for guest-claim; account merge must never make guest claimable again |
| E7 | Undefined `(state, event)` → reject, no mutation; explicit wrong-state rejects for purge/claim/discard/choice/commit |
| E8 | Final invariants **INV-1 … INV-12** are normative |

---

## Machine identity

| Item | Definition |
|---|---|
| Subject | One `guest_installations` record |
| Owner of transitions | FastAPI only |
| Atomic unit | Single PostgreSQL transaction for successful claim commit / evaluation rollback |
| External auth | Clerk JWT verified before claim; Clerk never mutates guest ownership |
| Success end | Guest `CLAIMED`; eligible resources owned by `users.id` |
| Failure / wait end | Ownership unchanged vs pre-attempt; or terminal `DISCARDED` / `EXPIRED` / `PURGED` |

Composite state:

- **L** = lifecycle (`ACTIVE` · `PENDING_CLAIM` · `CLAIMED` · `EXPIRED` · `PURGED`)  
- **C** = claim (`UNCLAIMED` · `CLAIM_IN_PROGRESS` · `CLAIMED` · `CLAIM_FAILED` · `DISCARDED` · `AWAITING_CHOICE`)  
- **T** = claim-token (`NONE` · `ISSUED` · `CONSUMED` · `REVOKED` · `EXPIRED`)

---

## 1. States

### 1.1 Lifecycle (L)

| State | Meaning |
|---|---|
| `ACTIVE` | Guest principal usable; may own guest-capable data |
| `PENDING_CLAIM` | Claim evaluation/commit TX in flight (lock held only inside that TX) |
| `CLAIMED` | Terminal success for guest-claim; irreversible for claim purposes |
| `EXPIRED` | Past TTL; not claimable; awaiting purge |
| `PURGED` | Terminal; guest-owned data removed/anonymized |

### 1.2 Claim (C)

| State | Meaning |
|---|---|
| `UNCLAIMED` | No successful claim |
| `CLAIM_IN_PROGRESS` | Exclusive claim path active **inside** an open Domain Authority TX |
| `AWAITING_CHOICE` | Conflict ticket persisted; **no** open claim TX or row lock waiting on UX |
| `CLAIMED` | Claim committed for a specific `users.id` |
| `CLAIM_FAILED` | Last attempt fully rolled back; retry may be allowed |
| `DISCARDED` | Explicit abandon without transfer |

**AWAITING_CHOICE (normative — E1):**

1. Evaluation occurs under lock inside claim TX.  
2. If choice required: **roll back** that TX (zero ownership mutations remain).  
3. In a **separate short TX**: lock guest row → persist `L=ACTIVE`, `C=AWAITING_CHOICE`, conflict ticket → `COMMIT` → release lock.  
4. **Forbidden:** holding a DB transaction or row lock open while awaiting user input.  
5. **Forbidden:** “hold lock across UX” interpretations.

### 1.3 Claim-token (T)

| State | Meaning |
|---|---|
| `NONE` | No outstanding claim token |
| `ISSUED` | Valid unused token |
| `CONSUMED` | Single-use spent (success path or definitive consume-on-reject policy) |
| `REVOKED` | Invalidated by security event |
| `EXPIRED` | Past `exp` |

### 1.4 Modes

| Mode | (L, C) | Intent |
|---|---|---|
| M0 | `ACTIVE`, `UNCLAIMED` | Normal guest |
| M1 | `PENDING_CLAIM`, `CLAIM_IN_PROGRESS` | Exclusive claim TX (short-lived) |
| M2 | `ACTIVE`, `AWAITING_CHOICE` | Conflict UX; unlocked |
| M3 | `ACTIVE`, `CLAIM_FAILED` | Retryable failure |
| M4 | `CLAIMED`, `CLAIMED` | Success terminal |
| M5 | `DISCARDED` (L may be `ACTIVE` then `EXPIRED`) | Abandoned |
| M6 | `EXPIRED` + `DISCARDED` (non-claimable) | TTL |
| M7 | `PURGED`, terminal | Cleanup done |

---

## 2. Events

| Event | Source | Description |
|---|---|---|
| `E_GUEST_CREATED` | FastAPI | Guest installation created |
| `E_GUEST_SEEN` | FastAPI | Activity heartbeat (may extend TTL while claimable) |
| `E_AUTH_OK` | FastAPI | Clerk JWT verified; `users` + `auth_identities` resolved/created |
| `E_CLAIM_TOKEN_ISSUED` | FastAPI | Token minted with full binding (E3) |
| `E_CLAIM_REQUESTED` | Client→FastAPI | Claim with token + guest id |
| `E_CLAIM_LOCK_ACQUIRED` | FastAPI | Under-lock enter M1 inside claim TX |
| `E_POLICY_EVALUATED` | FastAPI | Policies + conflicts evaluated inside claim TX |
| `E_CHOICE_REQUIRED` | FastAPI | Triggers evaluation TX rollback + short persist TX → M2 |
| `E_CHOICE_SUBMITTED` | Client→FastAPI | Persist choices (short TX); no ownership rewrite |
| `E_CLAIM_COMMIT` | FastAPI | `COMMIT` of successful claim TX |
| `E_CLAIM_ROLLBACK` | FastAPI | `ROLLBACK` of claim TX; then short TX → `CLAIM_FAILED` if needed |
| `E_CLAIM_IDEMPOTENT_HIT` | FastAPI | Already claimed by same user |
| `E_DISCARD_REQUESTED` | Client→FastAPI | Abandon without claim |
| `E_TTL_ELAPSED` | Scheduler/FastAPI | Soft-expire |
| `E_PURGE_RUN` | Scheduler/FastAPI | Purge job |
| `E_TOKEN_REVOKE` | FastAPI | Revoke token |
| `E_TOKEN_TTL` | FastAPI | Token expired |
| `E_RECOVERY_SWEEP` | FastAPI | Lock-TTL recovery (fenced — E5) |
| `E_TRANSITION_REJECTED` | FastAPI | Invalid `(mode,event)` recorded (optional audit) |

---

## 3. Preconditions

### 3.1 Enter claim (`E_CLAIM_REQUESTED` → M1)

| # | Precondition |
|---|---|
| P1 | Clerk JWT valid |
| P2 | `users.id` resolved for JWT `sub` via `auth_identities` |
| P3 | Guest exists |
| P4 | L=`ACTIVE` and C ∈ {`UNCLAIMED`, `CLAIM_FAILED`, `AWAITING_CHOICE`} |
| P5 | Not `EXPIRED` / `PURGED` / `CLAIMED` |
| P6 | Token `ISSUED` and validates **all** of: `guest_installation_id`, `users.id`, `purpose=guest_claim`, `nonce`, `exp` |
| P7 | Exclusive lock acquirable; no other live claim TX on this guest |
| P8 | If already `CLAIMED` by same user → idempotent success (do not enter M1 mutate path) |
| P9 | If already `CLAIMED` by other user → reject `guest_already_claimed` |
| P10 | If C=`AWAITING_CHOICE`, required conflict choices must be present for resume (unless re-entering only to re-evaluate) |

### 3.2 Successful commit

| # | Precondition |
|---|---|
| P11 | Still M1 inside same open TX |
| P12 | No unresolved choice |
| P13 | All staged ownership mutations valid (XOR) |
| P14 | `claimed_by_user_id =` authenticated `users.id` |

### 3.3 Purge (under lock — E4)

| # | Precondition |
|---|---|
| P15 | After `FOR UPDATE` on guest row: L=`EXPIRED` or discard-eligible, or past `purge_after` |
| P16 | Under lock: L ∉ {`PENDING_CLAIM`, `CLAIMED`} and C ≠ `CLAIM_IN_PROGRESS` |
| P17 | Abort purge if under-lock state shows claim pending, in progress, or claimed |

### 3.4 Recovery sweep (E5)

| # | Precondition |
|---|---|
| P18 | `FOR UPDATE` guest row |
| P19 | May mark `CLAIM_FAILED` **only if** no live claim TX can still commit (session/fencing proves lock holder dead) |
| P20 | If under lock L=C=`CLAIMED` → idempotent success path; do not mark failed |

---

## 4. Transaction steps

### 4.1 Happy path M0/M2/M3 → M1 → M4 (unchanged shape)

| Step | Action |
|---|---|
| T1 | `BEGIN` claim TX |
| T2 | `SELECT … FOR UPDATE` guest row |
| T3 | Re-check P3–P9 under lock |
| T4 | Set L=`PENDING_CLAIM`, C=`CLAIM_IN_PROGRESS` |
| T5 | Ensure `users` + `auth_identities` for JWT `sub` |
| T6 | Snapshot guest-owned resources |
| T7 | Evaluate policies + conflicts |
| T8 | If choice required → **do not write owners**; go to §4.2 |
| T9 | Apply transfer/merge/prefer_user/drop_guest/park |
| T10 | Set `owner_user_id`; clear `owner_guest_installation_id` where transferred |
| T11 | Set `claimed_by_user_id`, `claimed_at`, L=`CLAIMED`, C=`CLAIMED` |
| T12 | Mark token `CONSUMED` (same TX) |
| T13 | Write `identity.guest_claimed` in **same TX** or transactional outbox of this TX |
| T14 | `COMMIT` → M4 |

### 4.2 Choice path (E1)

| Step | Action |
|---|---|
| C1 | In claim TX: confirm zero ownership mutations staged/applied |
| C2 | `ROLLBACK` claim TX (releases lock; M1 ephemeral state discarded) |
| C3 | `BEGIN` short TX |
| C4 | `FOR UPDATE` guest row |
| C5 | Persist `L=ACTIVE`, `C=AWAITING_CHOICE`, conflict ticket (+ attempt metadata) |
| C6 | Write audit `identity.claim_choice_required` **in this short TX** |
| C7 | `COMMIT` → M2; lock released before any user UX |

### 4.3 Failure path (E2)

| Step | Action |
|---|---|
| R1 | `ROLLBACK` claim TX (ownership unchanged) |
| R2 | `BEGIN` short TX; `FOR UPDATE` guest |
| R3 | Persist `L=ACTIVE`, `C=CLAIM_FAILED` (unless already `CLAIMED` → §5 I1) |
| R4 | Token → `CONSUMED` or `REVOKED` per reason (same short TX) |
| R5 | Audit `identity.guest_claim_failed` in this short TX |
| R6 | `COMMIT` → M3 |

---

## 5. Idempotency rules

| Case | Behavior |
|---|---|
| I1 | `(guest_id, user_id)` already `CLAIMED` by that user → success no-op; **no** resource re-transfer; audit `identity.guest_claim_idempotent` only if that audit row commits with observed `CLAIMED` |
| I2 | Token `CONSUMED` after success + replay → I1 |
| I3 | Concurrent `E_CLAIM_REQUESTED` while live claim TX holds row → reject `claim_in_progress` (no second TX mutate); **do not** wait holding a client-open DB TX across time |
| I4 | Token user/guest/purpose/nonce/exp mismatch → reject; revoke token; no guest mutation |
| I5 | Other user after `CLAIMED` → `guest_already_claimed` |
| I6 | Purge when already `PURGED` → no-op |
| I7 | Discard when already `DISCARDED`/`PURGED` → no-op |
| I8 | Retries after timeout **never reapply** transfers if under-lock state is already `CLAIMED` (E5) |

---

## 6. Retry behavior

| Situation | Retryable? | Action |
|---|---|---|
| `CLAIM_FAILED` | Yes | New token; new `E_CLAIM_REQUESTED` |
| `AWAITING_CHOICE` after choices stored | Yes | New/continuing token per policy; `E_CLAIM_REQUESTED` |
| JWT expired | Yes | Re-auth → new token → retry |
| `guest_already_claimed` / `identity_conflict` | No | Stop |
| `EXPIRED` / `PURGED` | No | Stop |
| Recovery found `CLAIMED` | N/A | Idempotent success; no re-transfer |
| Recovery fenced fail | Yes | As `CLAIM_FAILED` |

---

## 7. Conflict outcomes

Unchanged intent: `O_TRANSFER` / `O_KEEP_USER` / `O_MERGE` / `O_DROP_GUEST` / `O_PARK` → continue to commit path; `O_CHOICE_REQUIRED` → §4.2; `O_IDENTITY_CONFLICT` / `O_GUEST_ALREADY_CLAIMED` → reject, guest unchanged; `O_PREFER_GUEST` only if ratified.

---

## 8. Partial-failure prevention

| Rule | Statement |
|---|---|
| F1–F6 | All-or-nothing ownership rewrite in successful claim TX; XOR validated; no partial class moves |
| F7 | Choice path: zero ownership mutations; evaluation TX rolled back |
| F8 | Audits per E2 only |
| F9 | Crash → abort TX → not claimed; recovery per E5 |
| F10 | v1 all-or-nothing |
| F11 | No TX/lock spans user input (E1) |

---

## 9. Claim-token security (E3)

| Rule | Statement |
|---|---|
| S1 | Minted only by FastAPI after `E_AUTH_OK` |
| S2 | Bound fields (all required): `guest_installation_id`, internal `users.id`, `purpose=guest_claim`, unique `nonce`, `exp` |
| S3 | Validate **all** bound fields on every `E_CLAIM_REQUESTED` |
| S4 | High entropy; **single-use**; short TTL |
| S5 | Missing/invalid token → reject; no mutation |
| S6 | Reuse after success consume → I1; reuse after fail consume → reject unless new token issued |
| S7 | Logout/user-switch → `REVOKED` |
| S8 | Not a guest credential; not a Clerk session |
| S9 | Claim requires JWT + valid token + guest id |

---

## 10. Audit consistency (E2)

| Audit | Commit rule |
|---|---|
| `identity.guest_claimed` | Same TX as `L=C=CLAIMED` **or** transactional outbox of that TX. **Forbidden** unless state is `CLAIMED`. |
| `identity.claim_choice_required` | Only in short TX that persists `AWAITING_CHOICE` + conflict ticket |
| `identity.claim_choice_submitted` | Only in TX that persists submitted choices |
| `identity.guest_claim_failed` | Only in short TX that persists `CLAIM_FAILED` (or equivalent failed terminal for attempt) |
| `identity.guest_claim_idempotent` | Only when observed persisted state is already `CLAIMED` for same user |
| `identity.claim_started` | Only if attempt metadata is persisted in a committed TX (optional); must not imply `CLAIMED` |
| `identity.guest_discarded` / `expired` / `purged` | Only with matching persisted state in same TX |
| `identity.transition_rejected` | Optional; with reject response; no domain mutation |

---

## 11. Expiry, purge, recovery

### Purge vs claim (E4)

1. Purge: `BEGIN` → `FOR UPDATE` guest → re-check P15–P17 under lock.  
2. If claim pending, in progress, or claimed → **abort purge** (no data delete).  
3. Else purge guest-owned rows → `PURGED` → audit → `COMMIT`.  
4. Claim uses the **same** guest row lock protocol.

### TTL

- `E_TTL_ELAPSED` allowed only when under lock C ≠ `CLAIM_IN_PROGRESS` and L ≠ `CLAIMED` / `PENDING_CLAIM`.  
- Soft-expire → `EXPIRED`; not claimable.

### Recovery (E5)

1. `E_RECOVERY_SWEEP`: `FOR UPDATE` guest.  
2. If `CLAIMED` → idempotent success; stop.  
3. If `CLAIM_IN_PROGRESS` / `PENDING_CLAIM` and **live claim TX may still commit** → **do nothing** (do not mark failed).  
4. If in-progress and fencing proves no live TX → short TX set `ACTIVE`+`CLAIM_FAILED`; audit failure; allow retry with **new** token.  
5. Retries must read under lock and **never reapply** transfers if already `CLAIMED`.

---

## 12. Irreversibility (E6)

| Rule | Statement |
|---|---|
| IRR-1 | `CLAIMED` is irreversible for guest-claim purposes |
| IRR-2 | No transition returns a `CLAIMED` guest to `UNCLAIMED`, `AWAITING_CHOICE`, or any claimable claim state |
| IRR-3 | Account merge (users) **MUST NOT** make the guest claimable again |
| IRR-4 | Merge may reassign `owner_user_id` among users; guest row stays `CLAIMED` (historical) or remains non-claimable |

---

## 13. Invalid-event responses (E7)

**Default rule:** Any `(mode, event)` not explicitly allowed in the transition table → **reject**, no mutation, optional `E_TRANSITION_REJECTED` / audit `identity.transition_rejected`.

### Explicit wrong-state rejects

| Event | Invalid in | Response |
|---|---|---|
| `E_CLAIM_REQUESTED` | M1, M4 (other user), M6, M7 | Reject (`claim_in_progress` / `guest_already_claimed` / `guest_not_claimable`) |
| `E_CLAIM_COMMIT` | M0, M2, M3, M4, M5, M6, M7 | Reject `invalid_state` |
| `E_CLAIM_ROLLBACK` | Not in open claim TX / not M1 | Reject / no-op |
| `E_CHOICE_REQUIRED` | Outside claim evaluation TX | Reject `invalid_state` |
| `E_CHOICE_SUBMITTED` | M0, M1, M3, M4, M5, M6, M7 | Reject `invalid_state` (valid in M2 only) |
| `E_DISCARD_REQUESTED` | M1, M4, M7 | Reject `invalid_state` (M4 discarded N/A; M1 must not discard under live claim) |
| `E_PURGE_RUN` | M0 (not expired), M1, M2 (still claimable active), M3 (still active), M4 | Abort / reject under lock (`purge_aborted_claim_active` or not eligible) |
| `E_TTL_ELAPSED` | M1, M4, M7 | Reject / no-op |
| `E_CLAIM_TOKEN_ISSUED` | M4, M6, M7 | Reject `guest_not_claimable` |
| `E_GUEST_SEEN` extending TTL | M4, M6, M7, M1 | No TTL extend; ignore or reject |
| Client/IdP direct state write | Any | Reject FAIL-equivalent; FastAPI only |

---

## Final invariants (INV-1 … INV-12)

| ID | Invariant |
|---|---|
| **INV-1** | No PostgreSQL transaction or row lock remains open across user choice |
| **INV-2** | At most one successful claim commit per `guest_installation_id` |
| **INV-3** | Same `(guest_id, user_id)` replay is success no-op; no duplicate resource transfer |
| **INV-4** | Rollback/failure restores pre-attempt ownership XOR for all guest-capable rows |
| **INV-5** | Audits for terminal outcomes commit iff matching state commits; no `guest_claimed` unless `CLAIMED` |
| **INV-6** | Claim token bound to guest + user + `purpose=guest_claim` + nonce + expiry; single-use |
| **INV-7** | Purge and claim are mutually exclusive under the same guest row lock; purge aborts if pending/in progress/claimed |
| **INV-8** | Timeout recovery cannot mark failed while a live claim TX may commit; cannot double-apply; already-`CLAIMED` is idempotent success |
| **INV-9** | `CLAIMED` irreversible for this machine; account merge must not reopen guest claimability |
| **INV-10** | Undefined transitions → reject, no mutation |
| **INV-11** | Guests never in `users`; Clerk `sub` never resource owner; provider IDs out of business tables |
| **INV-12** | FastAPI sole transition authority; successful claim is one atomic commit |

---

## Corrected transition table

| # | From | Event | Guard | To | Effects |
|---|---|---|---|---|---|
| TR1 | — | `E_GUEST_CREATED` | — | M0; T=`NONE` | Create guest; audit `guest_created` (same TX) |
| TR2 | M0 | `E_GUEST_SEEN` | L=`ACTIVE` claimable | M0 | Refresh seen/TTL |
| TR3 | M0/M2/M3 | `E_AUTH_OK` | Valid JWT | unchanged | Resolve/create user+identity; no guest mutate |
| TR4 | M0/M2/M3 | `E_CLAIM_TOKEN_ISSUED` | P1–P2; claimable; bind E3 fields | Same L/C; T=`ISSUED` | Persist token; audit `claim_token_issued` |
| TR5 | M0/M2/M3 | `E_CLAIM_REQUESTED` | P1–P10; T valid | M1 (inside claim TX) | Lock; `PENDING_CLAIM`/`CLAIM_IN_PROGRESS` |
| TR6 | M1 | `E_POLICY_EVALUATED` auto-ok | P11–P14 path clear | M1 | Stage T9–T10 |
| TR7 | M1 | `E_CLAIM_COMMIT` | P11–P14 | **M4**; T=`CONSUMED` | T11–T14; `guest_claimed` with CLAIMED |
| TR8a | M1 | `E_CHOICE_REQUIRED` | Conflicts need UX | (claim TX rolled back) | Zero owner writes; C2 |
| TR8b | after TR8a | short TX | under lock | **M2** | Persist `AWAITING_CHOICE`+ticket; audit `claim_choice_required` |
| TR9 | M2 | `E_CHOICE_SUBMITTED` | Valid choices | M2 | Persist choices only; audit `claim_choice_submitted` |
| TR10 | M2 | `E_CLAIM_REQUESTED` | Choices present; P1–P10 | M1 | Resume claim |
| TR11a | M1 | `E_CLAIM_ROLLBACK` | Error/guard | (rolled back) | Ownership unchanged |
| TR11b | after TR11a | short TX | under lock; not CLAIMED | **M3** | Persist `CLAIM_FAILED`; audit `guest_claim_failed`; token consume/revoke |
| TR12 | M4 | `E_CLAIM_REQUESTED` | Same user | M4 | I1; audit `claim_idempotent` only with CLAIMED |
| TR13 | M4 | `E_CLAIM_REQUESTED` | Different user | M4 | Reject `guest_already_claimed` |
| TR14 | M0/M2/M3 | `E_DISCARD_REQUESTED` | Not M1/M4/M7 | M5 `DISCARDED` | Stop guest writes; audit `guest_discarded` |
| TR15 | M0/M2/M3/M5 | `E_TTL_ELAPSED` | Under lock; not M1/M4 | M6 `EXPIRED` | audit `guest_expired` |
| TR16 | M6/M5 | `E_PURGE_RUN` | E4 under lock; P15–P17 | M7 | Purge guest-owned; audit `guest_purged` |
| TR17 | M1-stuck apparent | `E_RECOVERY_SWEEP` | E5 fencing under lock | M3 or M4-idempotent | Fail only if no live TX; if CLAIMED → I1 |
| TR18 | T=`ISSUED` | `E_TOKEN_REVOKE` / `E_TOKEN_TTL` | — | T=`REVOKED`/`EXPIRED` | New token required for claim |
| TR19 | M7 | `E_PURGE_RUN` | already purged | M7 | I6 |
| TR20 | claimable | `E_CLAIM_REQUESTED` | invalid token | unchanged | Reject; no mutation |
| TR21 | Any | undefined event | not in table | unchanged | Reject; optional `transition_rejected` |
| TR22 | M4 | any reopen-claim event | — | M4 | Reject; IRR-1…IRR-3 |

### Happy path (unchanged)

```
M0 --E_CLAIM_REQUESTED--> M1 --E_CLAIM_COMMIT--> M4
```

### Choice path (corrected)

```
M1 --E_CHOICE_REQUIRED--> ROLLBACK --> short TX --> M2
M2 --E_CHOICE_SUBMITTED--> M2
M2 --E_CLAIM_REQUESTED--> M1 --> M4
```

### Compact diagram

```
                  E_GUEST_CREATED
                        │
                        ▼
              ┌─────────────────┐
              │ M0 ACTIVE       │◄── short TX after ROLLBACK (M3)
              │ UNCLAIMED       │
              └───────┬─────────┘
                      │ E_CLAIM_REQUESTED
                      ▼
              ┌─────────────────┐  E_CHOICE_REQUIRED
              │ M1 PENDING/     │──ROLLBACK──► short TX ──► M2 AWAITING_CHOICE
              │ IN_PROGRESS     │◄──────── E_CLAIM_REQUESTED (after choice)
              └───────┬─────────┘
                      │ E_CLAIM_COMMIT
                      ▼
              ┌─────────────────┐
              │ M4 CLAIMED      │  irreversible for guest-claim
              └─────────────────┘

   M0/M2/M3 ──DISCARD/TTL──► EXPIRED/DISCARDED ──PURGE(under lock)──► PURGED
```

---

## Ratification status

**Architecture-ratified** as a safety-corrected state machine (INV-1…INV-12 and errata E1–E8 normative).

| Gate | Status |
|---|---|
| Happy path M0 → M1 → M4 preserved | Yes |
| Audit defects E1–E7 applied | Yes |
| INV-1…INV-12 normative | Yes |
| Architecture lock | **Yes — ratified** |
| Implementation authorized | **No** — coding/SQL/migrations remain gated |

**FINAL STATUS:** Architecture-ratified; coding gated.
