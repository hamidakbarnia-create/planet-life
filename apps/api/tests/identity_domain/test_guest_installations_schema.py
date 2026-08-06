"""PostgreSQL constraint tests for guest_installations."""

from __future__ import annotations

import uuid

import pytest
from psycopg import errors

from .invariants import LEGAL_GUEST_LIFECYCLE_CLAIM_PAIRS


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


def test_guest_defaults_and_required_fields(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT lifecycle_state, claim_state, client_platform,
                   created_at, last_seen_at, updated_at,
                   claim_token_status, claim_lock_version,
                   claimed_by_user_id, claimed_at, purged_at
            FROM guest_installations WHERE id = %s
            """,
            (guest_id,),
        )
        row = cur.fetchone()
    assert row[0] == "active"
    assert row[1] == "unclaimed"
    assert row[2] == "unknown"
    assert row[3] is not None and row[4] is not None and row[5] is not None
    assert row[6] == "none"
    assert row[7] == 0
    assert row[8] is None and row[9] is None and row[10] is None
    conn.commit()


def test_legal_lifecycle_claim_matrix_accepted(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    for lifecycle_state, claim_state in sorted(LEGAL_GUEST_LIFECYCLE_CLAIM_PAIRS):
        fields: dict = {
            "lifecycle_state": lifecycle_state,
            "claim_state": claim_state,
        }
        if lifecycle_state == "claimed":
            fields["claimed_by_user_id"] = user_id
            fields["claimed_at"] = "2026-08-03T00:00:00Z"
        if lifecycle_state == "purged":
            fields["purged_at"] = "2026-08-03T00:00:00Z"
        _insert_guest(conn, **fields)
    conn.commit()


def test_illegal_lifecycle_claim_pairs_rejected(identity_db) -> None:
    conn = identity_db.conn
    illegal = [
        ("active", "claimed"),
        ("active", "claim_in_progress"),
        ("expired", "unclaimed"),
        ("claimed", "unclaimed"),
        ("pending_claim", "unclaimed"),
        ("purged", "unclaimed"),
    ]
    for lifecycle_state, claim_state in illegal:
        with pytest.raises(errors.CheckViolation):
            _insert_guest(
                conn,
                lifecycle_state=lifecycle_state,
                claim_state=claim_state,
            )
        conn.rollback()


def test_claimed_user_consistency(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    conn.commit()
    with pytest.raises(errors.CheckViolation):
        _insert_guest(
            conn,
            lifecycle_state="claimed",
            claim_state="claimed",
            claimed_by_user_id=None,
            claimed_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()
    with pytest.raises(errors.CheckViolation):
        _insert_guest(
            conn,
            lifecycle_state="active",
            claim_state="unclaimed",
            claimed_by_user_id=user_id,
            claimed_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()
    _insert_guest(
        conn,
        lifecycle_state="claimed",
        claim_state="claimed",
        claimed_by_user_id=user_id,
        claimed_at="2026-08-03T00:00:00Z",
    )
    conn.commit()


def test_claimed_state_irreversible(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    guest_id = _insert_guest(
        conn,
        lifecycle_state="claimed",
        claim_state="claimed",
        claimed_by_user_id=user_id,
        claimed_at="2026-08-03T00:00:00Z",
    )
    conn.commit()
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="guest_installations_claimed_immutable"):
            cur.execute(
                """
                UPDATE guest_installations
                   SET lifecycle_state = 'active',
                       claim_state = 'unclaimed',
                       claimed_by_user_id = NULL,
                       claimed_at = NULL
                 WHERE id = %s
                """,
                (guest_id,),
            )
    conn.rollback()


def test_purge_consistency(identity_db) -> None:
    conn = identity_db.conn
    with pytest.raises(errors.CheckViolation):
        _insert_guest(
            conn,
            lifecycle_state="purged",
            claim_state="discarded",
            purged_at=None,
        )
    conn.rollback()
    with pytest.raises(errors.CheckViolation):
        _insert_guest(
            conn,
            lifecycle_state="active",
            claim_state="unclaimed",
            purged_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()


def test_claim_token_issued_and_none_rules(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    conn.commit()
    with pytest.raises(errors.CheckViolation):
        _insert_guest(
            conn,
            claim_token_status="issued",
            claim_token_nonce=None,
            claim_token_hash="hash",
            claim_token_user_id=user_id,
            claim_token_purpose="guest_claim",
            claim_token_expires_at="2026-08-04T00:00:00Z",
        )
    conn.rollback()
    _insert_guest(
        conn,
        claim_token_status="issued",
        claim_token_nonce="n1",
        claim_token_hash="hash",
        claim_token_user_id=user_id,
        claim_token_purpose="guest_claim",
        claim_token_expires_at="2026-08-04T00:00:00Z",
        claim_token_consumed_at=None,
    )
    conn.commit()
    with pytest.raises(errors.CheckViolation):
        _insert_guest(
            conn,
            claim_token_status="none",
            claim_token_nonce="leftover",
        )
    conn.rollback()


def test_claimable_install_key_partial_unique(identity_db) -> None:
    conn = identity_db.conn
    _insert_guest(
        conn,
        client_install_key_hash="key-a",
        lifecycle_state="active",
        claim_state="unclaimed",
    )
    with pytest.raises(errors.UniqueViolation):
        _insert_guest(
            conn,
            client_install_key_hash="key-a",
            lifecycle_state="active",
            claim_state="claim_failed",
        )
    conn.rollback()
    # Non-claimable active+discarded and claimed rows do not compete on the partial unique.
    _insert_guest(
        conn,
        client_install_key_hash="key-a",
        lifecycle_state="active",
        claim_state="unclaimed",
    )
    user_id = _insert_user(conn)
    _insert_guest(
        conn,
        client_install_key_hash="key-a",
        lifecycle_state="claimed",
        claim_state="claimed",
        claimed_by_user_id=user_id,
        claimed_at="2026-08-03T00:00:00Z",
    )
    conn.commit()


def test_claimed_by_user_fk_restrict(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    _insert_guest(
        conn,
        lifecycle_state="claimed",
        claim_state="claimed",
        claimed_by_user_id=user_id,
        claimed_at="2026-08-03T00:00:00Z",
    )
    conn.commit()
    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.rollback()


def test_guest_not_stored_in_users(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM users WHERE id = %s", (guest_id,))
        assert cur.fetchone()[0] == 0
    conn.commit()
