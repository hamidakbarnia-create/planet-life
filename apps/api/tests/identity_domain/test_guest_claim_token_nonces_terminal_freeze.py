"""Corrective tests: terminal freeze and one-time scrub for claim nonces."""

from __future__ import annotations

import uuid

import pytest


pytestmark = pytest.mark.identity_db


def _uid() -> uuid.UUID:
    return uuid.uuid4()


def _seed_issued(conn, nonce: str = "n-freeze"):
    guest_id = _uid()
    user_id = _uid()
    with conn.cursor() as cur:
        cur.execute("INSERT INTO users (id) VALUES (%s)", (user_id,))
        cur.execute("INSERT INTO guest_installations (id) VALUES (%s)", (guest_id,))
        cur.execute(
            """
            INSERT INTO guest_claim_token_nonces (
                nonce, guest_installation_id, user_id, token_hash, expires_at
            ) VALUES (%s, %s, %s, %s, %s)
            """,
            (nonce, guest_id, user_id, "hash-1", "2026-08-10T00:00:00Z"),
        )
    conn.commit()
    return nonce


def _terminalize(conn, nonce: str, status: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE guest_claim_token_nonces
               SET token_status = %s,
                   terminal_at = TIMESTAMPTZ '2026-08-03 12:00:00+00'
             WHERE nonce = %s
            """,
            (status, nonce),
        )
    conn.commit()


def _clear(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM guest_claim_token_nonces")
        cur.execute("DELETE FROM guest_installations")
        cur.execute("DELETE FROM users")
    conn.commit()


@pytest.mark.parametrize("status", ["consumed", "revoked", "expired"])
def test_issued_to_terminal_once_then_same_status_rejected(identity_db, status: str) -> None:
    conn = identity_db.conn
    nonce = _seed_issued(conn, f"n-{status}")
    _terminalize(conn, nonce, status)
    with conn.cursor() as cur:
        cur.execute(
            "SELECT token_status FROM guest_claim_token_nonces WHERE nonce = %s",
            (nonce,),
        )
        assert cur.fetchone()[0] == status
        with pytest.raises(Exception, match="terminal row is frozen except one-time scrub"):
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET token_status = %s,
                       terminal_at = TIMESTAMPTZ '2026-08-03 12:00:00+00'
                 WHERE nonce = %s
                """,
                (status, nonce),
            )
    conn.rollback()
    _clear(conn)


def test_terminal_at_cannot_be_cleared_or_changed(identity_db) -> None:
    conn = identity_db.conn
    nonce = _seed_issued(conn)
    _terminalize(conn, nonce, "consumed")
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="terminal_at is immutable"):
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET terminal_at = NULL
                 WHERE nonce = %s
                """,
                (nonce,),
            )
    conn.rollback()
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="terminal_at is immutable"):
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET terminal_at = TIMESTAMPTZ '2026-08-04 00:00:00+00'
                 WHERE nonce = %s
                """,
                (nonce,),
            )
    conn.rollback()


def test_one_scrub_succeeds_second_scrub_rejected(identity_db) -> None:
    conn = identity_db.conn
    nonce = _seed_issued(conn)
    _terminalize(conn, nonce, "revoked")
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE guest_claim_token_nonces
               SET token_hash = NULL,
                   scrubbed_at = now()
             WHERE nonce = %s
            """,
            (nonce,),
        )
    conn.commit()
    with conn.cursor() as cur:
        cur.execute(
            "SELECT token_hash, scrubbed_at IS NOT NULL, token_status, terminal_at "
            "FROM guest_claim_token_nonces WHERE nonce = %s",
            (nonce,),
        )
        token_hash, scrubbed, status, terminal_at = cur.fetchone()
        assert token_hash is None
        assert scrubbed is True
        assert status == "revoked"
        assert terminal_at is not None
        with pytest.raises(Exception, match="terminal row is frozen except one-time scrub"):
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET token_hash = NULL,
                       scrubbed_at = now()
                 WHERE nonce = %s
                """,
                (nonce,),
            )
    conn.rollback()


def test_scrub_cannot_modify_status_terminal_or_bindings(identity_db) -> None:
    conn = identity_db.conn
    nonce = _seed_issued(conn)
    _terminalize(conn, nonce, "expired")
    other_user = _uid()
    with conn.cursor() as cur:
        cur.execute("INSERT INTO users (id) VALUES (%s)", (other_user,))
    conn.commit()
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="guest_claim_token_nonces_transition_guard"):
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET token_hash = NULL,
                       scrubbed_at = now(),
                       token_status = 'consumed'
                 WHERE nonce = %s
                """,
                (nonce,),
            )
    conn.rollback()
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="guest_claim_token_nonces_transition_guard"):
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET token_hash = NULL,
                       scrubbed_at = now(),
                       terminal_at = TIMESTAMPTZ '2026-08-05 00:00:00+00'
                 WHERE nonce = %s
                """,
                (nonce,),
            )
    conn.rollback()
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="binding fields are immutable"):
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET token_hash = NULL,
                       scrubbed_at = now(),
                       user_id = %s
                 WHERE nonce = %s
                """,
                (other_user, nonce),
            )
    conn.rollback()
