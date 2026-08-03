"""Applied-migration tracking table (foundation-only schema object)."""

from __future__ import annotations

from dataclasses import dataclass

from psycopg import Connection

TRACKING_TABLE = "schema_migrations"

# Fixed advisory-lock keys for METIORO DB migrate (namespace, object).
ADVISORY_LOCK_KEY1 = 727401
ADVISORY_LOCK_KEY2 = 3

ENSURE_TRACKING_SQL = f"""
CREATE TABLE IF NOT EXISTS {TRACKING_TABLE} (
    version TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""


@dataclass(frozen=True)
class AppliedMigration:
    version: str
    filename: str
    checksum: str


def ensure_tracking_table(conn: Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(ENSURE_TRACKING_SQL)
    conn.commit()


def list_applied(conn: Connection) -> list[AppliedMigration]:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT version, filename, checksum
            FROM {TRACKING_TABLE}
            ORDER BY applied_at ASC, version ASC
            """
        )
        rows = cur.fetchall()
    return [
        AppliedMigration(version=r[0], filename=r[1], checksum=r[2]) for r in rows
    ]


def record_applied(
    conn: Connection,
    *,
    version: str,
    filename: str,
    checksum: str,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {TRACKING_TABLE} (version, filename, checksum)
            VALUES (%s, %s, %s)
            """,
            (version, filename, checksum),
        )


def try_acquire_advisory_lock(conn: Connection) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT pg_try_advisory_lock(%s, %s)",
            (ADVISORY_LOCK_KEY1, ADVISORY_LOCK_KEY2),
        )
        row = cur.fetchone()
    return bool(row and row[0])


def release_advisory_lock(conn: Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT pg_advisory_unlock(%s, %s)",
            (ADVISORY_LOCK_KEY1, ADVISORY_LOCK_KEY2),
        )
