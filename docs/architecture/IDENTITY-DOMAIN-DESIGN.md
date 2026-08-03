# METIORO Identity Domain Design

**Status:** Architecture-ratified (Revised) · Coding gated  
**Date:** 2026-08-03  
**Revision:** Guests are not users — provisional-user model rejected  
**Authority:** FastAPI Domain Authority · PostgreSQL canonical store  
**Depends on:** Locked identity decisions · DB-002 (Clerk as external IdP only; DB-002 brief itself remains Proposed until separately accepted)  
**Non-goals:** SQL, Prisma, migrations, API endpoints, implementation code  

---

## What changed from the rejected design

| Topic | Rejected (v1) | Corrected (this revision) |
|---|---|---|
| Guest principal | Created a `users` row with `account_state = guest` | **No `users` row for guests.** Guest exists only as `guest_installations` |
| Migration | “Promote” same UUID; no business FK rewrite | **Transactional claim:** transfer eligible resources from `guest_installation_id` → `users.id` |
| `users` contents | Guest + authenticated | **Authenticated accounts only** |
| Business ownership | Always `users.id` | **Temporary dual ownership** for guest-capable data; post-claim `owner_user_id` only |
| Conflicts | Mostly IdP subject conflicts | Explicit policy when **authenticated user already has cloud data** |
| Abandonment | Secondary | First-class **cleanup / expiry** for abandoned guests |

---

## Locked constraints (normative)

1. FastAPI is the only Domain Authority for identity lifecycle and guest claim.  
2. PostgreSQL is the canonical store.  
3. After authentication, **`users.id` (internal UUID)** is the only account identifier used as owner in business tables.  
4. Clerk `sub` / provider subjects appear **only** in `auth_identities.provider_subject`.  
5. Provider IDs **MUST NEVER** appear in business tables.  
6. Guest mode is Hybrid and domain-owned — not Clerk anonymous users.  
7. Guest → Account is a **transactional domain claim**, not an IdP anonymous upgrade.  
8. Auth Provider is replaceable via `auth_identities` remapping.

**Clarified ownership rule**

- **Guest phase:** guest-capable domain rows may be owned temporarily by `guest_installations.id`.  
- **Account phase:** those rows (if claimed) are owned by `users.id`; guest owner cleared.  
- **Non-guest-capable** domain data MUST NOT be written under a guest owner.

---

## Design principle: two principals, one claim path

```
Guest principal     = guest_installations.id   (NOT a user)
Account principal   = users.id                 (authenticated only)
IdP binding         = auth_identities          (Clerk sub → users.id)
```

| Mode | `guest_installations` | `users` | `auth_identities` | Domain data owner |
|---|---|---|---|---|
| Guest only | Active | — | — | `owner_guest_installation_id` |
| Authenticated, no prior guest | — / irrelevant | Exists | ≥1 active | `owner_user_id` |
| After successful claim | Terminal (`claimed`) | Exists | ≥1 active | `owner_user_id` (transferred) |
| Abandoned guest | `expired` / `purged` | — | — | Deleted or anonymized per policy |

---

## 1. ER diagram (logical)

```
┌────────────────────────────┐         ┌────────────────────────────┐
│   guest_installations      │         │          users             │
│────────────────────────────│         │────────────────────────────│
│ PK  id (UUID)              │         │ PK  id (UUID)              │◄──┐
│     lifecycle_state        │         │     account_state          │   │
│     claim_state            │         │     lifecycle_state        │   │
│     created_at             │         │     created_at             │   │
│     last_seen_at           │         │     updated_at             │   │
│     expires_at             │         │     deleted_at             │   │
│     claimed_by_user_id ────┼────FK──►│     merged_into_user_id ───┼───┤
│     claimed_at             │         └─────────────▲──────────────┘   │
└─────────────▲──────────────┘                       │                  │
              │                                      │ 1                │
              │ temporary owner                      │                  │
              │ (guest-capable data only)            │ *                │
              │                                      │                  │
┌─────────────┴──────────────────────────────────────┴──────┐           │
│           guest-capable domain resources                   │           │
│  owner_guest_installation_id  XOR  owner_user_id           │           │
│  (exactly one set while row is live)                       │           │
└────────────────────────────────────────────────────────────┘           │
                                                                         │
                                              ┌──────────────────────────┴──┐
                                              │      auth_identities        │
                                              │─────────────────────────────│
                                              │ PK  id                      │
                                              │ FK  user_id → users.id      │
                                              │     provider                │
                                              │     provider_subject        │
                                              │     identity_kind           │
                                              │     status                  │
                                              └─────────────────────────────┘
```

---

## 2. Tables

### 2.1 `guest_installations`

Domain-owned Hybrid guest principal. **Not** a user. **Not** an IdP anonymous account.

| Attribute | Null | Description |
|---|---|---|
| `id` | NO | Guest principal UUID (PK) |
| `lifecycle_state` | NO | `active` \| `pending_claim` \| `claimed` \| `expired` \| `purged` |
| `claim_state` | NO | `unclaimed` \| `claim_in_progress` \| `claimed` \| `claim_failed` \| `discarded` |
| `client_platform` | NO | `web` \| `ios` \| `android` \| `unknown` |
| `created_at` | NO | First creation |
| `last_seen_at` | NO | Last guest activity |
| `expires_at` | YES | Expiry deadline for abandonment cleanup |
| `claimed_by_user_id` | YES | FK → `users.id` after successful claim |
| `claimed_at` | YES | Claim commit time |
| `client_install_key_hash` | YES | Optional hashed install/resume key |
| `purge_after` | YES | Hard-purge schedule after expiry |

**Invariants**

- No row in `users` is created for this guest.  
- `claimed_by_user_id` set iff `lifecycle_state = claimed` and `claim_state = claimed`.  
- Guest id is allowed as temporary owner **only** on guest-capable resources.  
- After claim or purge, guest id MUST NOT accept new domain writes.

---

### 2.2 `users`

Authenticated accounts only.

| Attribute | Null | Description |
|---|---|---|
| `id` | NO | Internal UUID (PK). Sole **account** owner key for business data after claim/register |
| `account_state` | NO | `active` \| `suspended` \| `merged` |
| `lifecycle_state` | NO | `live` \| `pending_deletion` \| `deleted` |
| `created_at` | NO | Created at first successful authentication registration |
| `updated_at` | NO | Last identity-domain mutation |
| `deleted_at` | YES | Soft-delete tombstone |
| `merged_into_user_id` | YES | Self-FK when `account_state = merged` |

**Invariants**

- Row exists only after Domain Authority accepts an authenticated IdP identity.  
- `account_state` has **no** `guest` value.  
- Every live `active` user has ≥1 `auth_identities` with `status = active`.  
- No provider subjects on this table.

---

### 2.3 `auth_identities`

IdP binding for authenticated users only.

| Attribute | Null | Description |
|---|---|---|
| `id` | NO | Surrogate PK |
| `user_id` | NO | FK → `users.id` |
| `provider` | NO | e.g. `clerk` |
| `provider_subject` | NO | Clerk `user.id` / JWT `sub` |
| `identity_kind` | NO | `google` \| `apple` \| `phone` \| `email` \| `other` |
| `status` | NO | `active` \| `revoked` \| `superseded` |
| `linked_at` | NO | When Domain Authority accepted the link |
| `revoked_at` | YES | Revocation time |
| `last_asserted_at` | YES | Last verified assertion |

**Invariants**

- No `auth_identities` rows for guests.  
- `(provider, provider_subject)` globally unique.  
- Provider subject never used as business FK.

---

## 3. Primary Keys

| Table | PK |
|---|---|
| `guest_installations` | `id` (UUID) |
| `users` | `id` (UUID) |
| `auth_identities` | `id` (UUID) |

---

## 4. Foreign Keys

| From | To | Rule |
|---|---|---|
| `auth_identities.user_id` | `users.id` | Required |
| `guest_installations.claimed_by_user_id` | `users.id` | Null until successful claim |
| `users.merged_into_user_id` | `users.id` | Null unless merged |
| Guest-capable domain `owner_guest_installation_id` | `guest_installations.id` | Temporary only |
| Guest-capable / account domain `owner_user_id` | `users.id` | Account ownership |

**Forbidden**

- FK from `guest_installations` into Clerk.  
- FK from business tables to `auth_identities`.  
- Provider subject as any business FK.  
- Treating `guest_installations.id` as a `users.id`.

---

## 5. Required unique constraints

| Constraint | Columns / predicate | Purpose |
|---|---|---|
| `uq_auth_provider_subject` | (`provider`, `provider_subject`) | One IdP subject → one domain link |
| `uq_auth_active_kind` | (`user_id`, `provider`, `identity_kind`) where `status = active` | One active kind per user per provider |
| `uq_guest_active_install_key` | (`client_install_key_hash`) where lifecycle in (`active`, `pending_claim`) | One live guest per install key (if key used) |

**Ownership XOR (guest-capable resources)**  
Exactly one of `owner_guest_installation_id` / `owner_user_id` is non-null for a live row.

---

## 6. Temporary ownership of guest-capable domain data

### 6.1 Owner model (logical)

Guest-capable resources carry:

| Field | Role |
|---|---|
| `owner_guest_installation_id` | Temporary guest owner |
| `owner_user_id` | Account owner after claim or if created while authenticated |
| `ownership_state` (optional) | `guest_owned` \| `user_owned` \| `claim_locked` |

**XOR:** one owner kind at a time for live rows.

### 6.2 What may be guest-owned

Only resources explicitly marked **guest-capable** by product/architecture (examples for policy classification — not an implementation list):

- Local decision drafts / in-progress FTUE state persisted server-side  
- Guest-scoped preferences needed before login  
- Explicitly allowlisted module artifacts approved for Hybrid offline→cloud

**Must not be guest-owned**

- Billing, entitlements, legal acceptance records requiring a person  
- Cross-user / social graph edges  
- Anything requiring an authenticated principal by policy  
- Any row that would need a provider id

### 6.3 Write rules

| Caller | Allowed owner |
|---|---|
| Guest session (domain guest token) | Set `owner_guest_installation_id` only |
| Authenticated session | Set `owner_user_id` only |
| Claim transaction | May reassign guest → user per §7–§8 |

FastAPI enforces owner kind from auth context. Clients cannot self-assert ownership.

---

## 7. Transactional guest-to-user claim

Claim = authenticated user takes ownership of a guest installation’s eligible data.

### 7.1 Preconditions

1. Valid Clerk session verified by FastAPI.  
2. `users` + `auth_identities` resolved/created for `sub`.  
3. Guest installation presented by client is `lifecycle_state = active` (or `claim_failed` retryable).  
4. Guest not expired/purged.  
5. Installation not already `claimed` by another user.

### 7.2 Claim states (`guest_installations`)

| `claim_state` | Meaning |
|---|---|
| `unclaimed` | Default while guest active |
| `claim_in_progress` | TX reserved / locked |
| `claimed` | Committed transfer |
| `claim_failed` | Rolled back; guest may remain active for retry/discard |
| `discarded` | Guest data abandoned without transfer |

### 7.3 Single Domain Authority transaction (happy path)

1. Lock guest installation (`claim_in_progress`, `lifecycle_state = pending_claim`).  
2. Resolve/create `users` + ensure `auth_identities` for Clerk `sub`.  
3. Evaluate **resource-specific migration policy** (§8) and **cloud-data conflict policy** (§9).  
4. Apply per-resource actions (transfer / merge / keep-user / drop-guest / park).  
5. For every transferred row: set `owner_user_id`, clear `owner_guest_installation_id`.  
6. Set guest `claimed_by_user_id`, `claimed_at`, `claim_state = claimed`, `lifecycle_state = claimed`.  
7. Commit.  
8. Emit `identity.guest_claimed` (outbox optional).

**Failure:** rollback to prior guest ownership; `claim_state = claim_failed` (or remain `unclaimed` if lock never stuck).

### 7.4 Idempotency

- Replay claim for same guest + same user after success → no-op success.  
- Claim of already-claimed guest by same user → no-op.  
- Claim of already-claimed guest by different user → hard fail `guest_already_claimed`.

---

## 8. Resource-specific migration policy

Claim is **not** a blind “move all rows.” Each guest-capable resource type declares a policy.

| Policy | Behavior |
|---|---|
| `transfer` | Reassign owner guest → user always (if no user-side conflict) |
| `transfer_if_absent` | Transfer only if user has no existing resource of that type |
| `merge` | Domain-defined merge of guest payload into user’s existing resource |
| `prefer_user` | Keep user cloud data; drop or archive guest copy |
| `prefer_guest` | Replace user resource with guest copy (rare; requires explicit product rule) |
| `drop_guest` | Never transfer; delete guest copy at claim |
| `park` | Move guest copy to an archive/inspection area; do not auto-apply |

**Registry rule:** Every guest-capable resource type MUST have exactly one default policy before that type may be written in guest mode.

**Authority:** FastAPI applies the registry inside the claim transaction. Clients do not choose policy per row (except where product exposes an explicit user choice UI that Domain Authority then executes).

---

## 9. Conflict handling when authenticated user already has cloud data

Triggered when claim finds **both**:

- guest-owned resource(s) under `guest_installations.id`, and  
- user-owned resource(s) of the same conflict class under `users.id`.

### 9.1 Conflict classes (logical)

Defined per resource type in the migration registry (e.g. “profile preferences”, “draft decision X”, “vault local mirror”). Conflicts are evaluated **per class**, not as one global blob.

### 9.2 Resolution matrix

| Situation | Default resolution |
|---|---|
| User has data; guest empty for class | No-op for class; continue claim |
| User empty; guest has data | `transfer` |
| Both have data; policy `prefer_user` | Keep user; `drop_guest` or archive |
| Both have data; policy `merge` | Run deterministic merge function; result owned by user |
| Both have data; policy `transfer_if_absent` | Keep user; drop/archive guest |
| Both have data; no safe automatic policy | **`claim_requires_choice`** — abort claim TX (or pause before commit) until user selects keep-user / keep-guest / merge |

### 9.3 Hard rules

1. Never silent-delete user cloud data to accept guest data unless policy is explicitly `prefer_guest` and product ratified.  
2. Never attach guest data to the wrong user.  
3. Never leave XOR ownership violated after commit.  
4. IdP subject conflicts (subject already bound to another user) are **identity conflicts**, not resource conflicts — fail claim with `identity_conflict` (offer account-merge only via separate explicit flow).

### 9.4 Partial success

Default: **all-or-nothing** claim transaction.  
If product later allows partial claim, it must be a separate ratified design; not assumed here.

---

## 10. Cleanup / expiry of abandoned guests

### 10.1 Why

Guests are not users; unbounded guest rows and guest-owned data are retention/cost/privacy liabilities.

### 10.2 Lifecycle toward cleanup

| State | Trigger |
|---|---|
| `active` | Normal guest use; `expires_at` set/extended by policy on activity |
| `expired` | Past `expires_at` without claim |
| `purged` | Guest-owned data removed/anonymized; installation tombstoned or deleted per retention |

Also: `discarded` when user explicitly abandons guest without claiming.

### 10.3 Cleanup procedure (Domain Authority job)

1. Select installations in `expired` / `discarded` / past `purge_after`.  
2. Delete or anonymize all rows with `owner_guest_installation_id = guest.id`.  
3. Set `lifecycle_state = purged`; clear resume keys.  
4. Audit `identity.guest_purged`.  
5. Never create or modify `users` during guest purge.

### 10.4 Interaction with claim

- Cannot claim `expired` / `purged` guests.  
- `pending_claim` past a safety timeout → Domain Authority resets to `claim_failed`/`unclaimed` or expires per ops policy (prevents stuck locks).

### 10.5 Recommended policy knobs (design-level, not implemented)

- Inactivity TTL before `expired`  
- Grace period between `expired` and hard `purged`  
- Whether purge is hard-delete vs anonymize for legal holds  

---

## Supporting flows (brief, unchanged intent)

### Identity linking

Only for `users`. FastAPI adds `auth_identities` after verified Clerk assertion. Linking never creates guests and never uses guest ids.

### Account merge

Only between `users` rows. Separate from guest claim. May rewrite business `owner_user_id` from absorbed → survivor. Guests are not merge participants; at most a guest is claimed onto the survivor first.

### Delete account

Applies to `users` (+ revoke `auth_identities`, IdP peer delete, business purge). Active guests on devices are unaffected unless they were claimed by that user (already user-owned). Optional: revoke claimed-from guest tombstones.

### Export data

Account export keyed by `users.id`. Guest export (pre-auth) may be offered keyed by `guest_installations.id` for guest-owned data only — separate package, not a user export.

---

## Cross-cutting rules (revised)

| ID | Rule |
|---|---|
| R1 | `users` = authenticated accounts only — **never** guests |
| R2 | Guest principal = `guest_installations.id` only |
| R3 | Clerk `sub` only in `auth_identities.provider_subject` |
| R4 | Business tables never store provider IDs |
| R5 | Guest-capable data uses temporary XOR ownership (guest **or** user) |
| R6 | Claim is a FastAPI/PostgreSQL transaction with resource-specific policies |
| R7 | User-cloud conflicts resolve via registry; no silent user-data loss |
| R8 | Abandoned guests expire and purge without creating users |
| R9 | FastAPI is sole writer of identity tables and claim outcomes |

---

## Out of scope

- SQL DDL, indexes beyond uniqueness/XOR semantics  
- Prisma / migrations  
- Endpoint shapes  
- Concrete per-module resource registry entries (must be ratified per domain module later)

---

## Status

**Architecture-ratified (Revised).** Prior provisional-user design is **rejected**. Coding, SQL, Prisma, migrations, and API implementation remain **gated** on sequenced EPIC-01 authorization (charter / PRs) — this ratification does not authorize implementation by itself.
