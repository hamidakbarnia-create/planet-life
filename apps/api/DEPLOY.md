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

1. Create a new Railway service from this GitHub repo (repo root).
2. Railway reads `railway.toml` at the repo root automatically.
3. No extra environment variables are required for the API today.
4. After deploy, copy the public URL and set it on the frontend:

   ```
   NEXT_PUBLIC_API_BASE=https://<your-railway-service>.up.railway.app
   ```

### Start command (also in `railway.toml`)

```bash
cd apps/api/src && python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Build command

```bash
pip install -r apps/api/requirements.txt
```
