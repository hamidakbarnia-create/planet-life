#!/usr/bin/env python3
"""LOCAL-DEVELOPMENT ONLY: embedded Postgres + migrate + uvicorn.

Reuses the same pgserver mechanics as API pytest fixtures
(apps/api/tests/*/conftest.py): start embedded server, CREATE DATABASE,
build connection URI from the live instance.

Does NOT import pytest fixtures into application runtime.
Does NOT touch production/staging configuration.
Does NOT weaken METIORO_DATABASE_URL fail-closed behavior.

Ephemeral DB: pgdata lives under a temp directory and is deleted when this
process exits (pgserver cleanup_mode=delete). Fine for local ASK smoke.
"""

from __future__ import annotations

import atexit
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
API_ROOT = REPO_ROOT / "apps" / "api"
API_SRC = API_ROOT / "src"
API_VENV_PYTHON = API_ROOT / ".venv" / "bin" / "python"

# Dedicated LOCAL development database — not a test isolation name.
# Avoids identity_test / migration_test / bare "test" harness guards.
LOCAL_DEV_DATABASE_NAME = "metioro_local_dev"

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = "8000"


def _python() -> Path:
    if API_VENV_PYTHON.is_file():
        return API_VENV_PYTHON
    return Path(sys.executable)


def _start_embedded_local_database() -> tuple[str, object, Path]:
    """Mirror test fixture mechanics without importing pytest modules."""
    try:
        import pgserver
        import psycopg
    except ImportError as exc:
        raise SystemExit(
            "pgserver and psycopg are required for local embedded Postgres.\n"
            "Install API dev deps: pip install -r apps/api/requirements-dev.txt\n"
            f"Import error: {exc}"
        ) from exc

    pgdata = Path(tempfile.mkdtemp(prefix="metioro-local-dev-"))
    # Keep server alive for this process lifetime; delete on exit.
    server = pgserver.get_server(pgdata, cleanup_mode="delete")
    admin_uri = server.get_uri(database="postgres")

    with psycopg.connect(admin_uri, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(f'DROP DATABASE IF EXISTS "{LOCAL_DEV_DATABASE_NAME}"')
            cur.execute(f'CREATE DATABASE "{LOCAL_DEV_DATABASE_NAME}"')

    database_url = server.get_uri(database=LOCAL_DEV_DATABASE_NAME)
    return database_url, server, pgdata


def _apply_migrations(python: Path, database_url: str) -> None:
    env = os.environ.copy()
    env["METIORO_DATABASE_URL"] = database_url
    # Ensure db_migrate package resolves from apps/api/src
    env["PYTHONPATH"] = str(API_SRC) + (
        os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else ""
    )
    print("[local-dev] applying migrations via db_migrate apply …", flush=True)
    result = subprocess.run(
        [str(python), "-m", "db_migrate", "apply"],
        cwd=str(API_SRC),
        env=env,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit(
            f"db_migrate apply failed with exit {result.returncode}. "
            "Local API not started."
        )
    status = subprocess.run(
        [str(python), "-m", "db_migrate", "status"],
        cwd=str(API_SRC),
        env=env,
        check=False,
    )
    if status.returncode != 0:
        raise SystemExit("db_migrate status failed after apply.")


def _wait_for_openapi(host: str, port: str, timeout_s: float = 30.0) -> None:
    import urllib.error
    import urllib.request

    url = f"http://{host}:{port}/openapi.json"
    deadline = time.time() + timeout_s
    last_err: Exception | None = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1.5) as resp:
                if resp.status == 200:
                    return
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_err = exc
            time.sleep(0.25)
    raise SystemExit(f"API did not become ready at {url}: {last_err}")


def main() -> int:
    host = os.environ.get("METIORO_LOCAL_API_HOST", DEFAULT_HOST)
    port = os.environ.get("METIORO_LOCAL_API_PORT", DEFAULT_PORT)
    python = _python()

    print("[local-dev] LOCAL DEVELOPMENT ONLY — embedded pgserver + uvicorn", flush=True)
    print(f"[local-dev] python={python}", flush=True)

    database_url, server, pgdata = _start_embedded_local_database()
    print(f"[local-dev] pgdata={pgdata}", flush=True)
    print(f"[local-dev] database={LOCAL_DEV_DATABASE_NAME}", flush=True)
    # Never log the full connection URI; it may contain credentials.
    print("[local-dev] METIORO_DATABASE_URL configured", flush=True)

    uvicorn_proc: subprocess.Popen[str] | None = None

    def _shutdown(*_args: object) -> None:
        nonlocal uvicorn_proc
        if uvicorn_proc is not None and uvicorn_proc.poll() is None:
            print("[local-dev] stopping uvicorn …", flush=True)
            uvicorn_proc.send_signal(signal.SIGTERM)
            try:
                uvicorn_proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                uvicorn_proc.kill()
            uvicorn_proc = None
        # pgserver atexit/cleanup_mode=delete handles Postgres stop+delete.
        try:
            server.cleanup()
        except Exception as exc:  # noqa: BLE001 — best-effort local cleanup
            print(f"[local-dev] pgserver cleanup warning: {exc}", flush=True)

    atexit.register(_shutdown)
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: sys.exit(0))

    _apply_migrations(python, database_url)

    env = os.environ.copy()
    env["METIORO_DATABASE_URL"] = database_url
    # Keep owner override available for local Decision Case smoke.
    env.setdefault("METIORO_E5_OWNER_SUBJECT_ID", "e5-dev-owner")

    print(
        f"[local-dev] starting uvicorn on {host}:{port} with METIORO_DATABASE_URL …",
        flush=True,
    )
    uvicorn_proc = subprocess.Popen(
        [
            str(python),
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            host,
            "--port",
            port,
            "--app-dir",
            str(API_SRC),
        ],
        cwd=str(REPO_ROOT),
        env=env,
    )

    try:
        _wait_for_openapi(host, port)
        print(
            f"[local-dev] ready: http://{host}:{port}/openapi.json "
            f"(Decision Case uses embedded Postgres {LOCAL_DEV_DATABASE_NAME})",
            flush=True,
        )
        return uvicorn_proc.wait()
    except SystemExit:
        _shutdown()
        raise
    except Exception:
        _shutdown()
        raise


if __name__ == "__main__":
    raise SystemExit(main())
