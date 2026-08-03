# Decision Brief DB-003 — Production Database Migration Strategy

**Status:** Accepted (Architecture Decision Brief)
**Date:** 2026-08-03
**Author role:** Principal Software Architect
**Product:** METIORO — AI-powered Decision Intelligence
**Scope:** Canonical production PostgreSQL migration mechanism only
**Non-goals:** Identity table DDL · Auth runtime · ORM adoption · Product schema design · CI Postgres service mandate · Silent migrate-on-startup

---

## Decision

METIORO adopts **versioned PostgreSQL SQL migrations** as the **sole canonical** production schema-change mechanism.

Migration files and the migration runner are owned by the **FastAPI Domain Authority** repository path.

Migration execution is **explicit and operational**; application startup **must not** silently apply migrations.

The mechanism must provide:

- ordered versioned SQL
- applied-version tracking
- migration checksums
- PostgreSQL advisory locking
- transactional execution where supported
- fail-closed failure handling
- apply
- status
- verify
- explicit recovery policy

A **Migration Foundation PR** is required before any Identity (or other domain) production DDL.

---

## Status

**Accepted.**
Authorizes the Migration Foundation PR within the scope below.
Does **not** authorize Identity schema implementation, Prisma, Alembic/SQLAlchemy, Clerk/JWT, repositories, services, routes, UI, or product logic.

---

## Context

Locked and observed facts at decision time:

| Fact | Source |
|---|---|
| FastAPI is Domain Authority; PostgreSQL is the canonical store | Identity Domain Design; DB-002 |
| Identity PostgreSQL schema is architecture-ratified and DDL-gated | `IDENTITY-DOMAIN-POSTGRES-SCHEMA.md` |
| EPIC-01 PR-01 harness exists; migration tooling is none in-repo yet | `EPIC-01-IMPLEMENTATION-CHARTER.md` |
| Harness must not invent a second migration framework | EPIC-01 Implementation Charter |
| Ratified Identity DDL requires PostgreSQL-native features (`CHECK`, triggers, partial unique indexes, soft-delete uniqueness) | Identity PostgreSQL Schema |
| `packages/database/schema.prisma` is empty (0 bytes) since initial snapshot; no Prisma client, deps, or migrate process | Repository inspection |
| Production API has no DB driver in runtime requirements; Railway starts uvicorn only | `apps/api/requirements.txt`; `railway.toml` |
| Staging notes no dedicated production DB coupling for Conversation execute today | `docs/operations/STAGING-ENVIRONMENT.md` |
| Default CI runs API pytest without a Postgres service | `.github/workflows/ci.yml` |

Therefore Identity DDL cannot reuse an existing production migration approach. This brief selects and locks the mechanism.

---

## Requirements

### Canonical mechanism

1. Versioned PostgreSQL SQL is the only production schema-change path.
2. Migration files and runner live under the FastAPI Domain Authority path.
3. Migrations are applied by explicit operator/CI/deploy commands — **never** as a side effect of API process startup.
4. Schema changes must remain expressible as PostgreSQL-native DDL (no ORM required as source of truth).
5. Compatible with the identity test harness contract (`METIORO_IDENTITY_TEST_DATABASE_URL`).
6. Foundation remains minimal: no Identity or business tables in the Migration Foundation PR.

### Mandatory runner capabilities

| Capability | Requirement |
|---|---|
| Ordered versioned SQL | Migrations apply in deterministic version order |
| Applied-version tracking | Persistent record of successfully applied versions |
| Migration checksums | Stored checksum per applied migration; drift / mutation detected |
| PostgreSQL advisory locking | Concurrent apply attempts serialize via advisory lock |
| Transactional execution | Each migration runs in a transaction where PostgreSQL supports the statements used; non-transactional cases documented and fail-closed |
| Fail-closed failure handling | On error: abort, leave tracking consistent, do not mark success, non-zero exit |
| Apply | Explicit command to apply pending migrations |
| Status | Explicit command showing applied vs pending (and checksum/lock state as relevant) |
| Verify | Explicit command validating applied set vs files/checksums without applying |
| Explicit recovery policy | Documented recovery for failed/partial apply, checksum mismatch, and locked/stuck states — no silent repair |

---

## Evaluation Criteria

Criteria were fixed before scoring alternatives.

| ID | Criterion | Meaning |
|---|---|---|
| C1 | PostgreSQL compatibility | Works with PostgreSQL as the sole canonical store |
| C2 | PostgreSQL-native constraints | First-class support for `CHECK`, triggers, partial unique indexes, FK `RESTRICT`, soft-delete uniqueness |
| C3 | Deterministic deployment | Same ordered migrations produce the same schema given the same starting state |
| C4 | Rollback / recovery | Explicit recovery policy for failed releases (down path and/or restore) |
| C5 | Railway compatibility | Runnable in the existing Nixpacks/Python Railway service model |
| C6 | FastAPI ownership | Domain Authority (Python/API) owns schema change application and SQL truth |
| C7 | CI compatibility | Usable by API pytest / future optional Postgres CI without inventing a parallel stack |
| C8 | Low operational complexity | Few moving parts; no unnecessary runtimes or vendors |
| C9 | Avoid unnecessary ORM coupling | Must not require SQLAlchemy/Prisma models as the schema source of truth |

Scoring: **S** Strong · **A** Adequate · **W** Weak · **P** Poor / High risk

---

## Alternatives

### Option A — Versioned SQL

Ordered `.sql` migration files plus a Domain Authority–owned runner with tracking, checksums, advisory locking, apply/status/verify, and explicit recovery policy.

| Criterion | Score | Notes |
|---|---|---|
| C1 PostgreSQL compatibility | S | Native SQL |
| C2 PostgreSQL-native constraints | S | Exact DDL from ratified specs |
| C3 Deterministic deployment | S | Version order + tracking + checksums |
| C4 Rollback / recovery | A | Explicit recovery policy required; may use `down` SQL and/or restore |
| C5 Railway compatibility | S | Explicit Python migrate command fits deploy model; not tied to uvicorn startup |
| C6 FastAPI ownership | S | Lives with API Domain Authority |
| C7 CI compatibility | S | Reuses `psycopg` already present for identity harness (dev) |
| C8 Low operational complexity | S | Directory + tracker + commands |
| C9 Avoid ORM coupling | S | No ORM required |

### Option B — Prisma

Activate `packages/database/schema.prisma` and Prisma Migrate as production schema owner.

| Criterion | Score | Notes |
|---|---|---|
| C1 PostgreSQL compatibility | S | Supported |
| C2 PostgreSQL-native constraints | W | Partial indexes, complex `CHECK`s, and triggers commonly need raw SQL escape hatches |
| C3 Deterministic deployment | S | Migrate history is deterministic when operated correctly |
| C4 Rollback / recovery | A | Possible; heavier across runtimes |
| C5 Railway compatibility | W | Python Railway service would need Node/Prisma tooling or a split migrate job |
| C6 FastAPI ownership | W | Schema ownership shifts toward Node package |
| C7 CI compatibility | W | Adds Node DB toolchain beside Python API tests |
| C8 Low operational complexity | W | Second runtime for an empty placeholder that was never wired |
| C9 Avoid ORM coupling | P | Prisma Client/ORM becomes schema gravity |

**Empty Prisma file status:** scaffold/placeholder — **not** canonical under this decision.

### Option C — Alembic

Alembic migrations, typically with SQLAlchemy metadata.

| Criterion | Score | Notes |
|---|---|---|
| C1 PostgreSQL compatibility | S | Mature PostgreSQL support |
| C2 PostgreSQL-native constraints | A | Achievable via raw SQL; center of gravity is SQLAlchemy |
| C3 Deterministic deployment | S | Revision graph |
| C4 Rollback / recovery | S | First-class downgrade support |
| C5 Railway compatibility | S | Pure Python |
| C6 FastAPI ownership | A | Python-owned, but SQLAlchemy becomes de facto schema framework |
| C7 CI compatibility | S | Python-native |
| C8 Low operational complexity | A | More framework surface than required |
| C9 Avoid ORM coupling | W | Strong pull toward SQLAlchemy models |

### Option D — External PostgreSQL SQL migrator CLI

Third-party SQL migrator binary (e.g. dbmate, golang-migrate, Atlas) consuming versioned SQL files.

| Criterion | Score | Notes |
|---|---|---|
| C1 PostgreSQL compatibility | S | SQL-file based |
| C2 PostgreSQL-native constraints | S | Raw SQL |
| C3 Deterministic deployment | S | Versioned files |
| C4 Rollback / recovery | A–S | Tool-dependent |
| C5 Railway compatibility | A | Non-Python binary in Nixpacks/Python image |
| C6 FastAPI ownership | A | SQL can remain Domain Authority–owned; apply runtime is external |
| C7 CI compatibility | A | Extra binary/install step |
| C8 Low operational complexity | A | Another tool for little gain over Option A |
| C9 Avoid ORM coupling | S | No ORM |

---

## Selected Strategy

**Option A — Versioned SQL (FastAPI Domain Authority–owned), with the mandatory runner capabilities listed in Decision.**

| Option | Fit verdict |
|---|---|
| **A Versioned SQL** | **Selected** |
| D External SQL CLI | Runner-up — equal SQL fidelity; weaker Railway/FastAPI operational fit |
| C Alembic | Rejected for foundation — unnecessary ORM gravity |
| B Prisma | Rejected — placeholder; weak ownership/Railway/CI fit; ORM coupling |

---

## Rationale

1. Ratified Identity schema is PostgreSQL DDL semantics; versioned SQL preserves that truth without ORM translation loss (C2).
2. FastAPI is Domain Authority; schema files and runner must live on that path (C6).
3. Explicit operational execution prevents migrate-on-startup races, hidden deploy side effects, and unclear failure ownership.
4. Checksums, advisory locking, transactional apply where supported, verify, and fail-closed behavior make deployment deterministic and safe under concurrency (C3).
5. Production has no DB access layer today; Prisma/SQLAlchemy solely for migrations overbuilds the foundation (C8, C9).
6. EPIC-01 forbids inventing a second framework later; one SQL-first mechanism prevents parallel tooling.

---

## Consequences

- Production schema changes are ordered SQL files with recorded apply state and checksums.
- Identity and future domain DDL must land **only** through this mechanism.
- API/`uvicorn` startup remains migration-free; operators (or explicit deploy steps) run apply/verify.
- `packages/database/schema.prisma` remains non-authoritative.
- EPIC-01 PR-02 remains blocked until the Migration Foundation PR lands.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Ad-hoc / hand-applied prod DDL | High | Apply only via tracked migrations; verify detects drift |
| Silent migrate-on-startup reintroduced | High | Forbidden by this decision; foundation must not hook lifespan/startup |
| Concurrent apply corruption | High | PostgreSQL advisory locking + fail-closed handling |
| Checksum mismatch / edited applied files | Medium | Verify fails closed; recovery policy documents repair/restore path |
| Overbuilding the runner into an ORM | Medium | Foundation scope capped below |
| API serves before migrate | Medium | Explicit deploy ordering: verify/apply before schema-dependent traffic |

---

## Migration Foundation Scope

Prerequisite engineering PR. Allowed scope **only**:

| Item | Requirement |
|---|---|
| Migration directory | Canonical in-repo location for ordered versioned SQL |
| Migration tracking | PostgreSQL table recording applied versions and checksums |
| Advisory locking | Serialize concurrent apply via PostgreSQL advisory locks |
| Transactional apply | Per-migration transaction where supported; documented fail-closed exceptions otherwise |
| Apply | Explicit command to apply pending migrations |
| Status | Explicit command: applied vs pending |
| Verify | Explicit command: files/checksums/applied set consistency; no apply |
| Fail-closed behavior | Non-zero exit on error; no successful tracking row on failure |
| Explicit recovery policy | Documented operator recovery for failed apply, checksum mismatch, lock/stuck states |
| Documentation | Operator notes for local, identity-test DB, staging, and Railway (explicit migrate step; not startup) |

Foundation PR MUST NOT create Identity or business tables. It MAY create only the migration tracking table (and minimal support objects strictly required for locking/tracking).

---

## Out of Scope

- `users`
- `auth_identities`
- `guest_installations` and other guest/claim tables
- Business / product tables
- Clerk integration
- JWT verification
- Repositories
- Services
- API routes / UI
- Billing
- Product logic
- Prisma enablement
- Alembic / SQLAlchemy adoption
- Silent migrate-on-startup
- Mandatory CI Postgres service (later gate per EPIC-01 charter)

---

## Required next engineering step

1. Implement the **Migration Foundation PR** within the scope above (DB-003 is accepted).
2. Resume **EPIC-01 PR-02** (`users`, `auth_identities`) using versioned SQL migrations only.

No other prerequisite Decision Brief is required for migration mechanism selection.
