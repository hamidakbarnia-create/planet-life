# Planet Life API — deployment

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

Health check: `GET http://localhost:8000/` → `{"status":"healthy","platform":"Planet Life"}`

## Railway

This monorepo has a root `package.json` for local dev scripts only. Without
`nixpacks.toml`, Railway/Nixpacks may detect Node instead of Python.

**Frontend (`apps/web`) is not deployed on Railway** — it uses Cloudflare Workers.

1. Create **one** Railway service from this GitHub repo (repo root).
2. If Railway auto-imports a Node/web service from `package.json`, delete it or
   disable auto-deploy; keep a single Python API service.
3. Railway reads `railway.toml` and `nixpacks.toml` at the repo root.
4. Python **3.11** is pinned via `.python-version` and `NIXPACKS_PYTHON_VERSION`.
5. No extra environment variables are required for the API today.
6. After deploy, copy the public URL and set it on the frontend:

   ```
   NEXT_PUBLIC_API_BASE=https://<your-railway-service>.up.railway.app
   ```

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
