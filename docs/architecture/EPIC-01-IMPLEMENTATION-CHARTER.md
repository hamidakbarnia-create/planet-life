# EPIC-01 — Identity Domain Implementation Charter

**Status:** Authorized for sequenced implementation PRs (PR-01+)  
**Date:** 2026-08-03  
**Epic:** EPIC-01 Identity Domain  
**Authority:** FastAPI Domain Authority · PostgreSQL canonical store  

---

## Ratified sources (normative)

This epic implements only decisions already recorded in these **repository paths** (working-tree / eventually committed docs — this charter does **not** assert they are already committed):

1. [DB-002-Auth-Provider-Selection.md](./DB-002-Auth-Provider-Selection.md) — Clerk as external IdP only  
2. [IDENTITY-DOMAIN-DESIGN.md](./IDENTITY-DOMAIN-DESIGN.md) — guests ≠ users; claim path; XOR ownership  
3. [GUEST-TO-USER-MIGRATION-STATE-MACHINE.md](./GUEST-TO-USER-MIGRATION-STATE-MACHINE.md) — INV-1…INV-12; E1–E8  
4. [IDENTITY-DOMAIN-POSTGRES-SCHEMA.md](./IDENTITY-DOMAIN-POSTGRES-SCHEMA.md) — S-INV-1…S-INV-12; legal `(L,C)` matrix  

No redesign. Later PRs must preserve these documents.

---

## Frozen non-goals (do not reopen)

| Non-goal | Rule |
|---|---|
| Guests are never users | No `users` row for guest principals; guest = `guest_installations` only |
| Clerk is IdP only | Clerk authenticates; FastAPI owns domain identity lifecycle and claim |
| Provider IDs never enter business tables | `provider_subject` / Clerk `sub` only in `auth_identities` |
| FastAPI remains Domain Authority | Sole writer of identity tables and claim outcomes |
| PostgreSQL remains canonical | No migration of domain identity truth to the IdP datastore |

---

## Coding gates

| Gate | PR-01 | Later PRs |
|---|---|---|
| Implementation charter | **This document** | Cite this charter |
| Identity DDL / migrations | **Forbidden** | Sequenced after PR-01 |
| Clerk libraries / JWT auth behavior | **Forbidden** | Sequenced later |
| API identity routes | **Forbidden** | Sequenced later |
| Product / business logic changes | **Forbidden** | Out of epic unless claim ownership requires fixture tables |

---

## PR-01 scope (this authorization slice)

1. Publish this charter.  
2. Add a **minimal isolated PostgreSQL identity-domain test harness** under the existing API pytest suite that:  
   - connects to an isolated test database  
   - starts from the current **empty / baseline** identity schema (no identity tables yet; empty Prisma baseline)  
   - supports setup and teardown  
   - exposes reusable invariant-test helpers  
   - contains **no** production identity behavior  

---

## Test database contract

| Item | Value |
|---|---|
| Env var | `METIORO_IDENTITY_TEST_DATABASE_URL` |
| Isolation | Database name **must** contain `identity_test` |
| Baseline | No identity tables present (`users`, `auth_identities`, `guest_installations`, token ledger, conflicts, audit) |
| Migration tooling | None in-repo yet — harness must not invent a second migration framework |
| CI gate | PostgreSQL-backed identity tests are **not** a default CI gate yet |

**Skip vs fail:**

- Env var **unset** → only database-dependent tests **skip**; invariant helper unit tests still run.  
- Env var **set** but URL invalid, database name lacks `identity_test`, unreachable, or baseline not empty → harness **fails loudly** (no skip).  

Default API CI (`pytest apps/api/tests` without the env var) therefore remains runnable without Postgres; wiring a required Postgres service into CI is a later gate, not PR-01.

---

## Out of scope for EPIC-01 PR-01

- Creating identity tables or SQL migrations  
- Clerk SDK / JWT verification  
- Authentication behavior or API routes  
- Product logic changes  
- Commits / pushes (operator-controlled)
