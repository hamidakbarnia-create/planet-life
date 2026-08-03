"""PostgreSQL constraint tests for guest_claim_conflicts."""

from __future__ import annotations

import json
import uuid

import pytest
from psycopg import errors
from psycopg.types.json import Json

from .harness import list_table_columns
from .invariants import (
    GUEST_CLAIM_CONFLICTS_COLUMNS,
    assert_no_provider_subject_columns,
)


pytestmark = pytest.mark.identity_db


def _uid() -> uuid.UUID:
    return uuid.uuid4()


def _insert_user(conn):
    user_id = _uid()
    with conn.cursor() as cur:
        cur.execute("INSERT INTO users (id) VALUES (%s)", (user_id,))
    return user_id


def _insert_guest(conn, **fields):
    guest_id = fields.pop("id", None) or _uid()
    cols = ["id"]
    vals = [guest_id]
    for key, value in fields.items():
        cols.append(key)
        vals.append(value)
    placeholders = ", ".join(["%s"] * len(cols))
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO guest_installations ({', '.join(cols)}) VALUES ({placeholders})",
            vals,
        )
    return guest_id


def _insert_conflict(conn, *, guest_id, user_id, **fields):
    conflict_id = fields.pop("id", None) or _uid()
    cols = [
        "id",
        "guest_installation_id",
        "user_id",
        "conflict_classes",
        "idempotency_key",
    ]
    vals = [
        conflict_id,
        guest_id,
        user_id,
        fields.pop("conflict_classes", Json({"class": "ownership"})),
        fields.pop("idempotency_key", f"idem-{conflict_id}"),
    ]
    for key, value in fields.items():
        cols.append(key)
        vals.append(value)
    placeholders = ", ".join(["%s"] * len(cols))
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO guest_claim_conflicts ({', '.join(cols)}) "
            f"VALUES ({placeholders})",
            vals,
        )
    return conflict_id


def test_conflicts_columns_match_ratified_schema(identity_db) -> None:
    cols = list_table_columns(identity_db.conn, "guest_claim_conflicts")
    assert cols == GUEST_CLAIM_CONFLICTS_COLUMNS
    assert_no_provider_subject_columns(cols)
    forbidden = {
        "conflict_policy",
        "resource_key",
        "transaction_correlation",
        "external_event_id",
    }
    assert cols.isdisjoint(forbidden)


def test_open_requires_resolved_at_null(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    _insert_conflict(conn, guest_id=guest_id, user_id=user_id, status="open")
    with conn.cursor() as cur:
        cur.execute(
            "SELECT status, resolved_at FROM guest_claim_conflicts LIMIT 1"
        )
        status, resolved_at = cur.fetchone()
    assert status == "open"
    assert resolved_at is None
    conn.commit()


def test_open_with_resolved_at_rejected(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_conflict(
            conn,
            guest_id=guest_id,
            user_id=user_id,
            status="open",
            resolved_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()


def test_resolved_without_resolved_at_rejected(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_conflict(
            conn,
            guest_id=guest_id,
            user_id=user_id,
            status="resolved",
            resolved_at=None,
        )
    conn.rollback()


def test_cancelled_without_resolved_at_rejected(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_conflict(
            conn,
            guest_id=guest_id,
            user_id=user_id,
            status="cancelled",
        )
    conn.rollback()


def test_valid_resolved_and_cancelled_rows(identity_db) -> None:
    conn = identity_db.conn
    guest_a = _insert_guest(conn)
    guest_b = _insert_guest(conn)
    user_id = _insert_user(conn)
    _insert_conflict(
        conn,
        guest_id=guest_a,
        user_id=user_id,
        status="resolved",
        resolved_at="2026-08-03T00:00:00Z",
        idempotency_key="resolved-1",
    )
    _insert_conflict(
        conn,
        guest_id=guest_b,
        user_id=user_id,
        status="cancelled",
        resolved_at="2026-08-03T01:00:00Z",
        idempotency_key="cancelled-1",
    )
    conn.commit()


def test_status_vocabulary_only(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_conflict(
            conn,
            guest_id=guest_id,
            user_id=user_id,
            status="pending",
        )
    conn.rollback()


def test_one_open_per_guest_and_idempotency_unique(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_a = _insert_user(conn)
    user_b = _insert_user(conn)
    _insert_conflict(
        conn,
        guest_id=guest_id,
        user_id=user_a,
        status="open",
        idempotency_key="open-a",
    )
    with pytest.raises(errors.UniqueViolation):
        _insert_conflict(
            conn,
            guest_id=guest_id,
            user_id=user_b,
            status="open",
            idempotency_key="open-b",
        )
    conn.rollback()

    guest_id = _insert_guest(conn)
    user_a = _insert_user(conn)
    _insert_conflict(
        conn,
        guest_id=guest_id,
        user_id=user_a,
        status="open",
        idempotency_key="same-key",
    )
    guest_other = _insert_guest(conn)
    with pytest.raises(errors.UniqueViolation):
        _insert_conflict(
            conn,
            guest_id=guest_other,
            user_id=user_a,
            status="resolved",
            resolved_at="2026-08-03T00:00:00Z",
            idempotency_key="same-key",
        )
    conn.rollback()


def test_redaction_scrub_consistency(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_conflict(
            conn,
            guest_id=guest_id,
            user_id=user_id,
            conflict_classes_redacted=True,
            scrubbed_at=None,
        )
    conn.rollback()
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_conflict(
            conn,
            guest_id=guest_id,
            user_id=user_id,
            conflict_classes_redacted=False,
            scrubbed_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    conflict_id = _insert_conflict(
        conn,
        guest_id=guest_id,
        user_id=user_id,
        conflict_classes=Json({"class": "ownership", "detail": "x"}),
    )
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE guest_claim_conflicts
               SET conflict_classes = %s::jsonb,
                   conflict_classes_redacted = true,
                   scrubbed_at = %s
             WHERE id = %s
            """,
            (json.dumps({}), "2026-08-03T00:00:00Z", conflict_id),
        )
    conn.commit()


def test_fk_restrict_on_guest_and_user_delete(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    _insert_conflict(conn, guest_id=guest_id, user_id=user_id)
    conn.commit()
    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM guest_installations WHERE id = %s", (guest_id,))
    conn.rollback()
    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.rollback()


def test_no_resource_transfer_columns_or_tables(identity_db) -> None:
    conn = identity_db.conn
    cols = list_table_columns(conn, "guest_claim_conflicts")
    assert "resource_key" not in cols
    assert "owner_user_id" not in cols
    assert "owner_guest_installation_id" not in cols
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                'resource_ownership_transfers',
                'guest_resource_transfers'
              )
            """
        )
        assert cur.fetchone()[0] == 0
