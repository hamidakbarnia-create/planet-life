# Identity Domain — PostgreSQL Schema Specification

**Status:** Architecture-ratified · DDL/coding gated  
**Date:** 2026-08-03  
**Inputs:** Identity Domain Design · Guest-to-User Migration State Machine · Schema audit corrections  
**Non-goals:** Application code · SQL DDL files · migration files · commits · business-module table bodies  

---

## Conventions

| Item | Choice |
|---|---|
| PK type | `uuid` |
| Timestamps | `timestamptz` |
| Enums | `text` + `CHECK` |
| Soft delete | Tombstones |
| Lean | One **current** claim token on `guest_installations`; append-only **nonce ledger** for replay; audit skeleton vs scrubbable PII |

---

## Lifecycle states

### Legal `(lifecycle_state, claim_state)` matrix — `guest_installations`

| lifecycle_state (L) | Allowed claim_state (C) | Claimable? |
|---|---|---|
| `active` | `unclaimed`, `awaiting_choice`, `claim_failed`, `discarded` | Yes if C ∈ {`unclaimed`,`awaiting_choice`,`claim_failed`} |
| `pending_claim` | `claim_in_progress` **only** | In-flight only (not a new claim entry) |
| `claimed` | `claimed` **only** | **No** (terminal success) |
| `expired` | `discarded` **only** | **No** (EXPIRED non-claimable) |
| `purged` | `discarded` **only** | **No** |

**Normative:** `EXPIRED` is never claimable. No other `(L,C)` pairs are legal.  
Aligns with SM: M6 `EXPIRED` not claimable; M4 `CLAIMED` irreversible; M1 is `pending_claim` + `claim_in_progress`.

### Other vocabularies

| Entity | Column | Values |
|---|---|---|
| `users` | `account_state` | `active` \| `suspended` \| `merged` |
| `users` | `lifecycle_state` | `live` \| `pending_deletion` \| `deleted` |
| `auth_identities` | `status` | `active` \| `revoked` \| `superseded` |
| `guest_installations` | `claim_token_status` (current) | `none` \| `issued` \| `consumed` \| `revoked` \| `expired` |
| `guest_claim_token_nonces` | `token_status` | `issued` \| `consumed` \| `revoked` \| `expired` |
| `guest_claim_conflicts` | `status` | `open` \| `resolved` \| `cancelled` |
| `guest_claim_audit` | `delivery_state` | `pending` \| `published` \| `not_required` |
| `guest_claim_audit` | `pii_state` | `present` \| `redacted` |

**Locked:** `users` has no guest state.

---

## 1. `users`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | — | Internal UUID |
| `account_state` | `text` | NO | `'active'` | |
| `lifecycle_state` | `text` | NO | `'live'` | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |
| `deleted_at` | `timestamptz` | YES | NULL | Soft-delete |
| `merged_into_user_id` | `uuid` | YES | NULL | Survivor |
| `retention_purge_after` | `timestamptz` | YES | NULL | |

**PK:** `id`  
**FK:** `merged_into_user_id` → `users.id` (`ON DELETE RESTRICT`)

**CHECK**

- `account_state IN ('active','suspended','merged')`
- `lifecycle_state IN ('live','pending_deletion','deleted')`
- `(account_state = 'merged') = (merged_into_user_id IS NOT NULL)`
- `(lifecycle_state = 'deleted') = (deleted_at IS NOT NULL)`
- `merged_into_user_id IS DISTINCT FROM id` — self-merge ban

**TRIGGER (required):** `users_merge_acyclic`  
`BEFORE INSERT OR UPDATE OF merged_into_user_id`: reject if new `merged_into_user_id` is non-null and a path from that user back to `id` exists (walk `merged_into_user_id` chain; depth-capped). Prevents all indirect cycles.

**Merge vs guest:** Trigger does not alter `guest_installations`. Guest claimability reopen forbidden by guest claimed-immutability trigger (S-INV-4 / S-INV-9).

**Indexes:** PK; `(lifecycle_state)`

---

## 2. `auth_identities`

Clerk/provider subject **only** here.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | — | |
| `user_id` | `uuid` | NO | — | → `users.id` |
| `provider` | `text` | NO | — | Extensible (not Clerk-hardcoded type) |
| `provider_subject` | `text` | NO | — | |
| `identity_kind` | `text` | NO | — | |
| `status` | `text` | NO | `'active'` | |
| `linked_at` | `timestamptz` | NO | `now()` | |
| `revoked_at` | `timestamptz` | YES | NULL | |
| `last_asserted_at` | `timestamptz` | YES | NULL | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

**PK / FK / UNIQUE / CHECK:** unchanged intent from prior spec  
- `UNIQUE (provider, provider_subject)` (holds under soft-delete)  
- `UNIQUE (user_id, provider, identity_kind) WHERE status = 'active'`  
- status/revoked_at consistency CHECK  

**Indexes:** PK; uniques; `(user_id)`

---

## 3. `guest_installations`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | — | Guest principal |
| `lifecycle_state` | `text` | NO | `'active'` | L |
| `claim_state` | `text` | NO | `'unclaimed'` | C |
| `client_platform` | `text` | NO | `'unknown'` | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `last_seen_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |
| `expires_at` | `timestamptz` | YES | NULL | |
| `purge_after` | `timestamptz` | YES | NULL | |
| `purged_at` | `timestamptz` | YES | NULL | |
| `claimed_by_user_id` | `uuid` | YES | NULL | |
| `claimed_at` | `timestamptz` | YES | NULL | |
| `client_install_key_hash` | `text` | YES | NULL | Scrub on purge |
| `claim_lock_version` | `bigint` | NO | `0` | |
| `claim_locked_at` | `timestamptz` | YES | NULL | |
| **Current token pointer** | | | | |
| `claim_token_status` | `text` | NO | `'none'` | Current outstanding/terminal pointer |
| `claim_token_nonce` | `text` | YES | NULL | Current nonce (ledger is source of replay truth) |
| `claim_token_user_id` | `uuid` | YES | NULL | |
| `claim_token_purpose` | `text` | YES | NULL | |
| `claim_token_expires_at` | `timestamptz` | YES | NULL | |
| `claim_token_hash` | `text` | YES | NULL | Current hash; scrubbed on purge |
| `claim_token_consumed_at` | `timestamptz` | YES | NULL | |

**PK:** `id`  
**FK:** `claimed_by_user_id` → `users.id` (`RESTRICT`); `claim_token_user_id` → `users.id` (`RESTRICT`)

**UNIQUE (partial)**

- Claimable install key:  
  `UNIQUE (client_install_key_hash) WHERE client_install_key_hash IS NOT NULL AND lifecycle_state = 'active' AND claim_state IN ('unclaimed','awaiting_choice','claim_failed')`  
  (`pending_claim` excluded — in-flight uses same guest row)

**CHECK — single legal matrix**

```
(
  (lifecycle_state = 'active' AND claim_state IN ('unclaimed','awaiting_choice','claim_failed','discarded'))
  OR (lifecycle_state = 'pending_claim' AND claim_state = 'claim_in_progress')
  OR (lifecycle_state = 'claimed' AND claim_state = 'claimed')
  OR (lifecycle_state = 'expired' AND claim_state = 'discarded')
  OR (lifecycle_state = 'purged' AND claim_state = 'discarded')
)
AND (
  (lifecycle_state = 'claimed' AND claimed_by_user_id IS NOT NULL AND claimed_at IS NOT NULL)
  OR (lifecycle_state <> 'claimed' AND claimed_by_user_id IS NULL AND claimed_at IS NULL)
)
AND (
  (lifecycle_state = 'purged') = (purged_at IS NOT NULL)
)
AND claim_token_status IN ('none','issued','consumed','revoked','expired')
AND (
  claim_token_status <> 'issued'
  OR (
    claim_token_hash IS NOT NULL
    AND claim_token_nonce IS NOT NULL
    AND claim_token_user_id IS NOT NULL
    AND claim_token_purpose = 'guest_claim'
    AND claim_token_expires_at IS NOT NULL
    AND claim_token_consumed_at IS NULL
  )
)
AND (
  claim_token_status <> 'none'
  OR (
    claim_token_hash IS NULL
    AND claim_token_nonce IS NULL
    AND claim_token_user_id IS NULL
    AND claim_token_purpose IS NULL
    AND claim_token_expires_at IS NULL
    AND claim_token_consumed_at IS NULL
  )
)
```

**TRIGGER (required):** `guest_installations_claimed_immutable`  
If `OLD.lifecycle_state = 'claimed'` OR `OLD.claim_state = 'claimed'`: forbid changes to `lifecycle_state`, `claim_state`, `claimed_by_user_id`. Merge must never reopen claimability.

**Indexes:** PK; active expiry; purge_after where `expired`/`discarded`; `(lifecycle_state, claim_state)` where `active` or `pending_claim`; FK indexes.

**Concurrency:** Claim and purge: `SELECT … FOR UPDATE` on this row + under-lock re-check.

---

## 3b. `guest_claim_token_nonces` (replay ledger)

Minimal append-only ledger so reissue can replace the **current** token on `guest_installations` while old tokens remain replay-detectable.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `nonce` | `text` | NO | — | Globally unique |
| `guest_installation_id` | `uuid` | NO | — | |
| `user_id` | `uuid` | NO | — | Bound user |
| `purpose` | `text` | NO | `'guest_claim'` | |
| `token_status` | `text` | NO | `'issued'` | `issued` \| `consumed` \| `revoked` \| `expired` |
| `token_hash` | `text` | YES | NULL | Scrubbed on purge; nullable after scrub |
| `issued_at` | `timestamptz` | NO | `now()` | |
| `expires_at` | `timestamptz` | NO | — | |
| `terminal_at` | `timestamptz` | YES | NULL | When consumed/revoked/expired |
| `scrubbed_at` | `timestamptz` | YES | NULL | Hash cleared |

**PK:** `nonce` (enforces unique nonce / single-use identity)  
**FK:** `guest_installation_id` → `guest_installations.id` (`RESTRICT` until purge prelude); `user_id` → `users.id` (`RESTRICT`)

**CHECK**

- `purpose = 'guest_claim'`
- `token_status IN ('issued','consumed','revoked','expired')`
- `(token_status = 'issued') = (terminal_at IS NULL AND token_hash IS NOT NULL AND scrubbed_at IS NULL)`
- `token_status = 'issued' OR terminal_at IS NOT NULL`
- `(scrubbed_at IS NULL) OR (token_hash IS NULL AND token_status <> 'issued')`

**Reissue rules (normative)**

1. Insert **new** ledger row with **new** `nonce` + **new** `token_hash`, `token_status = issued`.  
2. Point `guest_installations` current token columns at the new nonce.  
3. Prior ledger row remains with terminal status (`consumed`/`revoked`/`expired`) — replay of old nonce is detectable via PK lookup.  
4. Never reuse a nonce.

**Indexes:** PK; `(guest_installation_id, issued_at DESC)`; `(user_id, token_status)`

---

## 4. `guest_claim_conflicts`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | — | |
| `guest_installation_id` | `uuid` | NO | — | |
| `user_id` | `uuid` | NO | — | |
| `status` | `text` | NO | `'open'` | |
| `conflict_classes` | `jsonb` | NO | — | May contain PII summaries |
| `conflict_classes_redacted` | `boolean` | NO | `false` | After scrub |
| `choices` | `jsonb` | YES | NULL | |
| `idempotency_key` | `text` | NO | — | |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |
| `resolved_at` | `timestamptz` | YES | NULL | |
| `expires_at` | `timestamptz` | YES | NULL | |
| `scrubbed_at` | `timestamptz` | YES | NULL | |

**PK / FK:** as before (`RESTRICT` on guest/user)  
**UNIQUE:** one `open` per guest; `UNIQUE (idempotency_key)`  
**CHECK:** status rules as before; `(conflict_classes_redacted = true) = (scrubbed_at IS NOT NULL)`  

---

## 5. `guest_claim_audit`

Separate **immutable skeleton** from **scrubbable PII payload**.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | — | |
| `event_type` | `text` | NO | — | Skeleton |
| `guest_installation_id` | `uuid` | NO | — | Skeleton (no FK) |
| `user_id` | `uuid` | YES | NULL | Skeleton when applicable |
| `claim_token_nonce` | `text` | YES | NULL | Skeleton correlation (nonce value retained; not secret once hash scrubbed) |
| `idempotency_key` | `text` | NO | — | Skeleton |
| `payload_pii` | `jsonb` | YES | NULL | Removable/redactable PII |
| `pii_state` | `text` | NO | `'present'` | `present` \| `redacted` |
| `scrubbed_at` | `timestamptz` | YES | NULL | |
| `created_at` | `timestamptz` | NO | `now()` | Skeleton |
| `delivery_state` | `text` | NO | `'not_required'` | Outbox |
| `published_at` | `timestamptz` | YES | NULL | |
| `retention_until` | `timestamptz` | YES | NULL | Skeleton retention floor |

**Allowed `event_type`:** unchanged list (`guest_created` … `transition_rejected`).

**UNIQUE:** `idempotency_key`; `UNIQUE (guest_installation_id) WHERE event_type = 'guest_claimed'`

**CHECK**

- event/delivery/pii_state enums  
- `(pii_state = 'redacted') = (scrubbed_at IS NOT NULL AND (payload_pii IS NULL OR payload_pii = '{}'::jsonb))`  
- `event_type <> 'guest_claimed' OR user_id IS NOT NULL`

### PostgreSQL audit/state coupling (required)

**TRIGGER:** `guest_claim_audit_state_guard` `BEFORE INSERT`

| event_type | Require persisted state (same DB snapshot / same TX) |
|---|---|
| `guest_claimed` | Guest row exists with `lifecycle_state = 'claimed'` AND `claim_state = 'claimed'` AND `claimed_by_user_id = NEW.user_id` |
| `guest_claim_failed` | Guest `lifecycle_state = 'active'` AND `claim_state = 'claim_failed'` |
| `claim_choice_required` | Guest `active` + `awaiting_choice` AND an `open` conflict for that guest+user |
| `guest_claim_idempotent` | Guest already `claimed`/`claimed` AND `claimed_by_user_id = NEW.user_id` |
| `guest_discarded` | Guest `claim_state = 'discarded'` |
| `guest_expired` | Guest `lifecycle_state = 'expired'` |
| `guest_purged` | Guest `lifecycle_state = 'purged'` |

Inserts that contradict persisted state **fail** the statement (and thus the TX).

**Normative write order for success:** update guest → `claimed`/`claimed`, then insert `guest_claimed` audit, then `COMMIT` (or transactional outbox row in same TX after guest update).

Skeleton columns are never updated except `delivery_state`/`published_at` and PII scrub fields. No delete of skeleton before policy allows (see retention).

---

## 6. Ownership columns (guest-capable resources)

Unchanged shape:

- `owner_user_id` XOR `owner_guest_installation_id` (**CHECK**)  
- FKs → `users` / `guest_installations` (`ON DELETE RESTRICT`)  
- No provider/Clerk columns  

---

## Corrected constraints (summary)

| Mechanism | Rule |
|---|---|
| CHECK matrix | Only legal `(L,C)` pairs; `expired` ⇒ `discarded` only |
| CHECK claimed | Claimed fields set iff L=C=`claimed` |
| TRIGGER claimed immutable | Cannot leave claimed / change `claimed_by_user_id` |
| TRIGGER merge acyclic | No self-merge; no indirect cycles |
| UNIQUE nonce | `guest_claim_token_nonces.nonce` PK |
| UNIQUE one success audit | Partial unique on `guest_claimed` |
| TRIGGER audit guard | Terminal audits must match guest/conflict state |
| UNIQUE open conflict | One `open` per guest |
| Owner XOR CHECK | Exactly one owner on guest-capable rows |
| Auth unique | `(provider, provider_subject)` always |

---

## Corrected deletion / retention / purge rules

### Purge ordering (normative, under guest row `FOR UPDATE`)

Before marking guest `purged` / `discarded`+`purged`:

1. **Conflicts:** set all `open` conflicts for guest to `cancelled` or `resolved`; scrub `conflict_classes` → redacted form; set `scrubbed_at`.  
2. **Guest-owned resources:** by policy `transfer` / `park` / `delete` until **zero** rows reference `owner_guest_installation_id = guest.id`.  
3. **Token material:** for all ledger rows of guest: set `token_hash = NULL`, `scrubbed_at = now()` (keep `nonce` + terminal `token_status` for replay evidence); clear current hash on guest row; set current token status terminal/`none` per policy.  
4. **Install key:** set `client_install_key_hash = NULL`.  
5. **Mark guest:** `lifecycle_state = 'purged'`, `claim_state = 'discarded'`, `purged_at = now()`.  
6. **Audit:** insert `guest_purged` (skeleton) in same TX after guest mark (trigger requires purged state — order: update guest then audit).

### FK deletion behavior

| FK | On delete | Safe use |
|---|---|---|
| All identity FKs to `users` | `RESTRICT` | Soft-delete users; hard-delete only when no refs |
| Conflicts → guest | `RESTRICT` | Cancel/resolve before purge (step 1) |
| Resources → guest | `RESTRICT` | Clear owners before purge (step 2) |
| Token ledger → guest | `RESTRICT` | Scrub in place; retain rows until retention; hard-delete ledger only after scrub + retention |
| Audit → guest/user | **No FK** | Skeleton survives guest purge |

### Soft-delete (`users`)

- Set `lifecycle_state = deleted`, `deleted_at`.  
- Do not hard-delete while FKs reference.  
- Revoke `auth_identities` as needed (`status` soft).  

### PII scrub timing

| Data | When scrub | What remains |
|---|---|---|
| `guest_claim_audit.payload_pii` | On user delete request, guest purge, or `retention_until` scrub pass | Skeleton: event_type, ids, nonce ref, timestamps, idempotency_key |
| `guest_claim_conflicts.conflict_classes` | Purge prelude or conflict expiry scrub | status, ids, timings; classes redacted |
| Token `token_hash` / guest current hash | Purge prelude (step 3) | nonce + terminal status (replay-detectable) |
| `client_install_key_hash` | Purge prelude | null |

**Preserve required audit evidence:** never delete `guest_claimed` / `guest_purged` / claim failure skeletons before compliance retention floor; scrub PII instead of dropping rows when possible.

---

## PostgreSQL vs FastAPI enforcement matrix

| Rule | PostgreSQL | FastAPI |
|---|---|---|
| Guests never in `users` | No guest account_state | Never create users for guests |
| Provider IDs only in `auth_identities` | No provider cols on resources | Never copy `sub` into resources/audit PII unnecessarily |
| Owner XOR | **CHECK** | Set owner by context |
| Legal `(L,C)` incl. EXPIRED non-claimable | **CHECK matrix** | SM transitions only |
| CLAIMED irreversible / merge ≠ reopen | **Triggers** | No reopen transitions |
| Merge acyclicity | **Trigger** | Choose survivor; rewrite resource owners |
| Token single-use + unique nonce | **Ledger PK** + status CHECKs | Mint new nonce/hash on every reissue; validate ledger |
| Replay of old token | Ledger row remains terminal | Reject if nonce not `issued` or mismatch hash |
| `guest_claimed` only if guest CLAIMED | **Audit trigger** | Write guest claimed then audit in same TX |
| Failure/choice audits match state | **Audit trigger** | Short TX persist state then audit |
| Claim ⊥ purge | Row lock | `FOR UPDATE` + re-check; abort if pending/in progress/claimed |
| Purge ordering | FK RESTRICT forces clear refs | Execute steps 1–6 under lock |
| No UX-held TX | — | Rollback eval; short TX for awaiting_choice |
| PII scrub vs skeleton | CHECKs on redacted shape | Scrub jobs / purge prelude |
| Migration policies | — | Resource registry |
| Invalid SM events | — | Reject |

---

## Final schema invariants (S-INV-1 … S-INV-12)

| ID | Invariant |
|---|---|
| **S-INV-1** | Guests exist only as `guest_installations`; never as `users` |
| **S-INV-2** | Provider subjects exist only in `auth_identities` |
| **S-INV-3** | Guest-capable rows always satisfy owner XOR |
| **S-INV-4** | `claimed`/`claimed` is immutable for claim purposes |
| **S-INV-5** | ≤1 successful claim commit and ≤1 `guest_claimed` audit per guest |
| **S-INV-6** | Claim tokens are single-use; nonces globally unique; old tokens replay-detectable via ledger |
| **S-INV-7** | Claim and purge serialize on the guest row lock |
| **S-INV-8** | Terminal audit events commit only when matching persisted state exists (PG-enforced) |
| **S-INV-9** | `merged_into_user_id` graphs are acyclic; merge does not reopen guest claim |
| **S-INV-10** | Purge removes/reassigns guest-owned personal data and scrubs token/conflict/audit PII while preserving required audit skeletons |
| **S-INV-11** | FK deletes are `RESTRICT` with explicit purge/scrub ordering; audit has no FK to guest |
| **S-INV-12** | Identity uniques remain correct under soft-delete; EXPIRED is non-claimable per legal `(L,C)` matrix |

---

## Ratification status

| Gate | Status |
|---|---|
| Audit defects 1–6 addressed | Yes |
| S-INV-1…S-INV-12 normative | Yes |
| Domain model unchanged (guests≠users; three principals + conflicts/audit; XOR ownership) | Yes |
| Architecture lock | **Yes — ratified** |
| Migration files / application code authorized | **No** — DDL/coding gated |

**FINAL STATUS: Architecture-ratified — Identity Domain PostgreSQL Schema locked; DDL/coding gated.**
