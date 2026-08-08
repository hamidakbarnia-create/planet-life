# Local development helpers

## Embedded Postgres + API (`run-local-api-with-pgserver.py`)

**LOCAL DEVELOPMENT ONLY.** Do not use for staging/production.

Starts an ephemeral PostgreSQL via the same `pgserver` mechanism used by API
pytest fixtures, applies versioned SQL migrations, then runs uvicorn with
`METIORO_DATABASE_URL` pointing at that live instance.

```bash
# From repo root (API venv with requirements-dev.txt installed):
apps/api/.venv/bin/python scripts/dev/run-local-api-with-pgserver.py
```

Defaults: `http://127.0.0.1:8000`. Override with `METIORO_LOCAL_API_HOST` /
`METIORO_LOCAL_API_PORT`.

### Database

| Item | Value |
|------|--------|
| Engine | Embedded PostgreSQL (`pgserver`) |
| Database name | `metioro_local_dev` |
| Lifetime | Process-scoped (deleted when the script exits) |
| Migrations | `python -m db_migrate apply` before uvicorn |

The name intentionally avoids `identity_test` / `*_test` so pytest isolation
guards are not confused with local API traffic.

### Notes

- Stop any other process already bound to port 8000 first.
- `METIORO_DATABASE_URL` is constructed from the running pgserver URI (often a
  Unix socket `host=` path). Nothing is hardcoded into production source.
- Fail-closed Decision Case deps remain unchanged: without this env, the API
  still raises if Decision Case routes are hit.
