# METIORO SQL migrations (DB-003)

Canonical versioned PostgreSQL SQL migration directory.

## Naming

```text
NNNN__snake_description.sql
```

Examples: `0001__users.sql`, `0002__auth_identities.sql`

- Versions are integers; apply order is ascending numeric order.
- Duplicate versions are rejected.
- Applied files are immutable: changing bytes after apply fails `verify`.

## Ownership

Owned by the FastAPI Domain Authority path (`apps/api`).
Do not introduce Prisma, Alembic, or ORM schema sources here.

## Execution

Migrations are applied only via the explicit CLI (never API startup):

```bash
cd apps/api/src
python -m db_migrate status
python -m db_migrate verify
python -m db_migrate apply
```

Requires `METIORO_DATABASE_URL` or `--database-url`.

See [DATABASE-MIGRATIONS.md](../../../docs/operations/DATABASE-MIGRATIONS.md).
