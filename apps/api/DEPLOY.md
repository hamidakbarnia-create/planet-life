# METIORO API — deployment

FastAPI backend for chart scoring, vault readings, pathfinder, and world overlays.

## Requirements

- **Python 3.11** (tested locally; `pyswisseph` ships wheels for 3.11 on Linux)
- Dependencies: `apps/api/requirements.txt`

```bash
pip install -r apps/api/requirements.txt
```

Packages installed:

| Package | Purpose |
|---------|---------|
| `fastapi` / `uvicorn` | HTTP server |
| `pydantic` | Request/response models |
| `pyswisseph` | Swiss Ephemeris chart math |
| `geopy` | Geocoding (Nominatim) |
| `timezonefinder` / `pytz` | Local timezone resolution |

## Monorepo imports

The API imports shared code from `packages/astro_engine` at the repo root.
`apps/api/src/repo_path.py` adds the repo root to `sys.path` automatically at startup.

**`PYTHONPATH` is not required** when starting via `uvicorn main:app` from `apps/api/src`.

## Local development

**Windows** (Python launcher):

```powershell
cd apps/api/src
py -3.11 -m uvicorn main:app --reload --port 8000
```

**Linux / macOS / Railway**:

```bash
cd apps/api/src
python -m uvicorn main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/` → `{"status":"healthy","platform":"METIORO"}`

## Railway

This monorepo has a root `package.json` for local dev scripts only. Without
`nixpacks.toml`, Railway/Nixpacks may detect Node instead of Python.

**Frontend (`apps/web`) is not deployed on Railway** — it uses Cloudflare Workers.

1. Create **one** Railway service from this GitHub repo (repo root).
2. If Railway auto-imports a Node/web service from `package.json`, delete it or
   disable auto-deploy; keep a single Python API service.
3. Railway reads `railway.toml` and `nixpacks.toml` at the repo root.
4. Python **3.11** is pinned via `.python-version` and `NIXPACKS_PYTHON_VERSION`.
5. Environment variables for Conversation generation (optional; default is static):

   | Variable | Required when | Example / notes |
   | -------- | ------------- | --------------- |
   | `CONVERSATION_GENERATION_PROVIDER` | Always (defaults if unset) | `static` (default) or `openai` |
   | `OPENAI_API_KEY` | `CONVERSATION_GENERATION_PROVIDER=openai` | Set only in Railway Variables / local env. **Never commit.** |
   | `OPENAI_MODEL` | Optional | Defaults to `gpt-4o-mini` if unset |
   | `OPENAI_TIMEOUT_SECONDS` | Optional | Defaults to `25.0` if unset; must be a finite number `> 0` |

   Startup validation fails fast if `openai` is selected without an API key, with an invalid timeout, or with an unknown provider name.

   Secrets must not appear in repository files, CI logs, or application error responses.

6. After deploy, copy the public URL and set it on the frontend:

   ```
   NEXT_PUBLIC_API_BASE=https://<your-railway-service>.up.railway.app
   ```

### Conversation OpenAI activation (Railway)

Operator procedure only. As of 2026-07-19, production remains on `CONVERSATION_GENERATION_PROVIDER=static`. Production OpenAI activation was **NOT PERFORMED** in repository verification (Railway CLI authentication unavailable). See `docs/operations/2026-07-19-conversation-openai-runtime-activation.md` for status **PARTIALLY COMPLETE** and the operator completion checklist.

To enable the OpenAI conversation provider in the deployed API:

1. In the Railway service Variables, set:

   ```text
   CONVERSATION_GENERATION_PROVIDER=openai
   OPENAI_API_KEY=<secret from approved vault — never paste into git>
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_TIMEOUT_SECONDS=25.0
   ```

2. Redeploy or restart the service so lifespan startup validation runs.
3. Confirm health: `GET /` → `{"status":"healthy","platform":"METIORO"}`.
4. Smoke: `POST /api/v1/conversation/execute` with a minimal valid body (see below).

Minimal smoke payload:

```bash
curl -sS -X POST "$API_BASE/api/v1/conversation/execute" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}],"locale":"en"}'
```

Expect HTTP 200 with `type`, `message`, `sources`, and `request_id` populated. Provider identity and API keys must not appear in the response body.

### Install (handled by `nixpacks.toml` install phase)

```bash
python -m venv /opt/venv
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r apps/api/requirements.txt
```

Nix `python311` has no pip; `nixpacks.toml` uses `python311Full` and installs into `/opt/venv`.

### Start command (`railway.toml` + `nixpacks.toml`)

```bash
cd apps/api/src && python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

`PYTHONPATH` is not required — `apps/api/src/repo_path.py` adds the monorepo root
at runtime so `packages/astro_engine` imports work from the repo root deploy.
