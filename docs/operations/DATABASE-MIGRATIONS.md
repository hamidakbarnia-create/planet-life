# METIORO Database Migrations (DB-003)

**Status:** Operational — Migration Foundation
**Authority:** FastAPI Domain Authority (`apps/api`)
**Mechanism:** Versioned PostgreSQL SQL only

This document is the operator guide and **explicit recovery policy**.
It does not authorize Identity or business DDL beyond what migration files contain.

---

## Principles

1. Versioned SQL under `apps/api/migrations/` is the sole production schema-change path.
2. Execution is **explicit and operational** — never a side effect of API startup.
3. Applied migrations are **immutable** (checksum-enforced).
4. Failures are **fail-closed**: non-zero exit; failed migration is not recorded as applied.
5. Concurrent apply is serialized with a PostgreSQL advisory lock.

---

## Commands

From the API source tree (venv activated, `psycopg` installed):

```bash
export METIORO_DATABASE_URL='postgresql://USER:PASS@HOST:5432/DBNAME'

cd apps/api/src
python -m db_migrate status
python -m db_migrate verify
python -m db_migrate apply
```

Optional flags:

```bash
python -m db_migrate --database-url "$METIORO_DATABASE_URL" \
  --migrations-dir ../migrations status
```

| Command | Behavior |
|---|---|
| `status` | Lists applied and pending migrations |
| `verify` | Checks applied rows vs files/checksums; **does not apply** |
| `apply` | Acquires advisory lock; applies pending migrations in order, each in a transaction |

Exit codes: `0` success; `1` fail-closed error.

---

## Local development

1. Provision an empty PostgreSQL database (do not point at production).
2. Set `METIORO_DATABASE_URL`.
3. Run `status` → `verify` → `apply` → `verify`.
4. For Identity harness work, keep using `METIORO_IDENTITY_TEST_DATABASE_URL` (name must contain `identity_test`). You may point migrate CLI at that DB only for isolated foundation tests — never at production casually.

---

## Railway (staging / production)

`railway.toml` starts uvicorn only. **Do not** add migrate-on-startup to the start command.

Recommended deploy ordering for schema-dependent releases:

1. Deploy code that includes new migration files (or run migrate from the release SHA checkout).
2. Set/use `METIORO_DATABASE_URL` for the target Railway Postgres.
3. Run **explicitly** (one-off shell / CI job / approved operator session):

   ```bash
   cd apps/api/src
   python -m db_migrate verify
   python -m db_migrate apply
   python -m db_migrate verify
   ```

4. Only then serve schema-dependent API traffic on that revision.

Until Identity tables exist, production may have no app DB coupling; still keep migrate out of startup so the contract remains correct when tables arrive.

---

## Tracking table

The runner creates `schema_migrations` if missing:

| Column | Purpose |
|---|---|
| `version` | Integer version as text (canonical key) |
| `filename` | Applied filename |
| `checksum` | SHA-256 hex of exact file bytes |
| `applied_at` | Apply timestamp (`timestamptz`) |

This is the only schema object the Migration Foundation creates by itself.

---

## Advisory locking

Apply uses `pg_try_advisory_lock(727401, 3)`.
If the lock is held, apply fails closed with a clear error (no wait forever).

Locks are session-scoped and released on unlock or disconnect.

---

## Explicit recovery policy

### Failed apply (SQL error mid-migration)

1. The failed migration’s transaction is rolled back.
2. It is **not** inserted into `schema_migrations`.
3. Prior successful migrations remain applied.
4. Fix the SQL (if not yet applied to any shared env) or fix the environment.
5. Re-run `python -m db_migrate apply`.
6. Run `verify`.

Do **not** manually insert a tracking row for a migration that did not succeed.

### Checksum mismatch (`verify` FAIL)

Cause: an applied migration file was edited on disk, or the database tracking row was tampered with.

1. Treat as incident — do not silently `UPDATE schema_migrations`.
2. Prefer restore of the original migration file from git history (immutability).
3. If the database was hand-modified, restore DB from backup to a known good revision, then `verify` + `apply` as needed.
4. Only as last resort, with explicit owner approval: restore from backup and re-apply forward — never “fix” checksums in place to force green.

### Missing file for applied version

1. Restore the missing file from the release git SHA that applied it.
2. Re-run `verify`.
3. Do not delete the tracking row to hide the problem.

### Advisory lock held / “another migrate apply may be in progress”

1. Confirm whether another legitimate migrate session is running; wait for it.
2. If the holder is a dead session, disconnect/terminate that backend (`pg_terminate_backend`) using normal Postgres ops practice.
3. Re-run `apply`.
4. Do not invent a second migrate tool to bypass the lock.

### Partial / unknown production drift

1. Run `verify`.
2. If drift is outside migrations (hand DDL), stop feature work; reconcile via a new forward migration only after owner approval, or restore.
3. Never hand-apply DDL in production without a corresponding versioned SQL file.

---

## Forbidden

- Calling migrate from FastAPI lifespan / startup
- Prisma / Alembic / ORM as schema source of truth
- Editing applied migration bytes
- Recording failed migrations as applied
