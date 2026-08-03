"""PostgreSQL constraint tests for guest_claim_token_nonces."""

from __future__ import annotations

import uuid

import pytest
from psycopg import errors


pytestmark = pytest.mark.identity_db


def _uid() -> uuid.UUID:
    return uuid.uuid4()


def _insert_user(conn):
    user_id = _uid()
    with conn.cursor() as cur:
        cur.execute("INSERT INTO users (id) VALUES (%s)", (user_id,))
    return user_id


def _insert_guest(conn):
    guest_id = _uid()
    with conn.cursor() as cur:
        cur.execute("INSERT INTO guest_installations (id) VALUES (%s)", (guest_id,))
    return guest_id


def _insert_nonce(conn, *, nonce, guest_id, user_id, **fields):
    cols = [
        "nonce",
        "guest_installation_id",
        "user_id",
        "expires_at",
    ]
    vals = [
        nonce,
        guest_id,
        user_id,
        fields.pop("expires_at", "2026-08-10T00:00:00Z"),
    ]
    for key, value in fields.items():
        cols.append(key)
        vals.append(value)
    placeholders = ", ".join(["%s"] * len(cols))
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO guest_claim_token_nonces ({', '.join(cols)}) "
            f"VALUES ({placeholders})",
            vals,
        )


def test_nonce_defaults_and_binding_required(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    _insert_nonce(
        conn,
        nonce="nonce-1",
        guest_id=guest_id,
        user_id=user_id,
        token_hash="hash-1",
    )
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT purpose, token_status, token_hash, terminal_at, scrubbed_at, issued_at
            FROM guest_claim_token_nonces WHERE nonce = 'nonce-1'
            """
        )
        purpose, status, token_hash, terminal_at, scrubbed_at, issued_at = cur.fetchone()
    assert purpose == "guest_claim"
    assert status == "issued"
    assert token_hash == "hash-1"
    assert terminal_at is None
    assert scrubbed_at is None
    assert issued_at is not None
    conn.commit()


def test_nonce_uniqueness_pk(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    _insert_nonce(
        conn,
        nonce="same-nonce",
        guest_id=guest_id,
        user_id=user_id,
        token_hash="h1",
    )
    with pytest.raises(errors.UniqueViolation):
        _insert_nonce(
            conn,
            nonce="same-nonce",
            guest_id=guest_id,
            user_id=user_id,
            token_hash="h2",
        )
    conn.rollback()


def test_issued_requires_hash_and_null_terminal(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_nonce(
            conn,
            nonce="bad-issued",
            guest_id=guest_id,
            user_id=user_id,
            token_status="issued",
            token_hash=None,
        )
    conn.rollback()
    with pytest.raises(errors.CheckViolation):
        _insert_nonce(
            conn,
            nonce="bad-issued-2",
            guest_id=guest_id,
            user_id=user_id,
            token_status="issued",
            token_hash="h",
            terminal_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()


def test_terminal_states_require_terminal_at(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    conn.commit()
    for status in ("consumed", "revoked", "expired"):
        with pytest.raises(errors.CheckViolation):
            _insert_nonce(
                conn,
                nonce=f"term-{status}",
                guest_id=guest_id,
                user_id=user_id,
                token_status=status,
                token_hash="h",
                terminal_at=None,
            )
        conn.rollback()
    _insert_nonce(
        conn,
        nonce="consumed-ok",
        guest_id=guest_id,
        user_id=user_id,
        token_status="consumed",
        token_hash="h",
        terminal_at="2026-08-03T00:00:00Z",
    )
    conn.commit()


def test_single_consumption_via_status_update(identity_db) -> None:
    """Issued → consumed is allowed once; nonce row remains unique (no second insert)."""
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    _insert_nonce(
        conn,
        nonce="consume-once",
        guest_id=guest_id,
        user_id=user_id,
        token_hash="h",
        token_status="issued",
    )
    conn.commit()
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE guest_claim_token_nonces
               SET token_status = 'consumed',
                   terminal_at = now()
             WHERE nonce = 'consume-once'
            """
        )
    conn.commit()
    with pytest.raises(errors.UniqueViolation):
        _insert_nonce(
            conn,
            nonce="consume-once",
            guest_id=guest_id,
            user_id=user_id,
            token_hash="h2",
        )
    conn.rollback()


def test_scrub_consistency(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    conn.commit()
    with pytest.raises(errors.CheckViolation):
        _insert_nonce(
            conn,
            nonce="bad-scrub",
            guest_id=guest_id,
            user_id=user_id,
            token_status="consumed",
            token_hash="still-present",
            terminal_at="2026-08-03T00:00:00Z",
            scrubbed_at="2026-08-03T01:00:00Z",
        )
    conn.rollback()
    _insert_nonce(
        conn,
        nonce="scrub-ok",
        guest_id=guest_id,
        user_id=user_id,
        token_status="consumed",
        token_hash=None,
        terminal_at="2026-08-03T00:00:00Z",
        scrubbed_at="2026-08-03T01:00:00Z",
    )
    conn.commit()


def test_purpose_must_be_guest_claim(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_nonce(
            conn,
            nonce="bad-purpose",
            guest_id=guest_id,
            user_id=user_id,
            token_hash="h",
            purpose="other",
        )
    conn.rollback()


def test_fk_restrict_to_guest_and_user(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    _insert_nonce(
        conn,
        nonce="fk-nonce",
        guest_id=guest_id,
        user_id=user_id,
        token_hash="h",
    )
    conn.commit()
    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM guest_installations WHERE id = %s", (guest_id,))
    conn.rollback()
    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.rollback()


def test_expires_at_required(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(errors.NotNullViolation):
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO guest_claim_token_nonces (
                    nonce, guest_installation_id, user_id, token_hash, expires_at
                ) VALUES (%s, %s, %s, %s, NULL)
                """,
                ("no-expiry", guest_id, user_id, "h"),
            )
    conn.rollback()
