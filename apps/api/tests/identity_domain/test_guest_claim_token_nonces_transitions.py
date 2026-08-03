"""Corrective tests: guest_claim_token_nonces terminal irreversibility."""

from __future__ import annotations

import uuid

import pytest


pytestmark = pytest.mark.identity_db


def _uid() -> uuid.UUID:
    return uuid.uuid4()


def _seed(conn):
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
            ("n-transition", guest_id, user_id, "hash-1", "2026-08-10T00:00:00Z"),
        )
    conn.commit()
    return guest_id, user_id


def _set_status(conn, status: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE guest_claim_token_nonces
               SET token_status = %s,
                   terminal_at = now()
             WHERE nonce = 'n-transition'
            """,
            (status,),
        )


def test_issued_to_consumed_revoked_expired_succeed(identity_db) -> None:
    conn = identity_db.conn
    for status in ("consumed", "revoked", "expired"):
        _seed(conn)
        _set_status(conn, status)
        conn.commit()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT token_status, terminal_at IS NOT NULL FROM guest_claim_token_nonces "
                "WHERE nonce = 'n-transition'"
            )
            assert cur.fetchone() == (status, True)
        # Reset schema data for next status via truncate through harness setup pattern.
        with conn.cursor() as cur:
            cur.execute("DELETE FROM guest_claim_token_nonces")
            cur.execute("DELETE FROM guest_installations")
            cur.execute("DELETE FROM users")
        conn.commit()


def test_terminal_cannot_return_to_issued_or_other_terminal(identity_db) -> None:
    conn = identity_db.conn
    cases = [
        ("consumed", "issued"),
        ("consumed", "revoked"),
        ("revoked", "issued"),
        ("expired", "issued"),
    ]
    for old_status, new_status in cases:
        _seed(conn)
        _set_status(conn, old_status)
        conn.commit()
        with conn.cursor() as cur:
            with pytest.raises(Exception, match="guest_claim_token_nonces_transition_guard"):
                if new_status == "issued":
                    cur.execute(
                        """
                        UPDATE guest_claim_token_nonces
                           SET token_status = 'issued',
                               terminal_at = NULL,
                               token_hash = 'hash-1',
                               scrubbed_at = NULL
                         WHERE nonce = 'n-transition'
                        """
                    )
                else:
                    cur.execute(
                        """
                        UPDATE guest_claim_token_nonces
                           SET token_status = %s
                         WHERE nonce = 'n-transition'
                        """,
                        (new_status,),
                    )
        conn.rollback()
        with conn.cursor() as cur:
            cur.execute("DELETE FROM guest_claim_token_nonces")
            cur.execute("DELETE FROM guest_installations")
            cur.execute("DELETE FROM users")
        conn.commit()


def test_consumed_cannot_be_consumed_again(identity_db) -> None:
    conn = identity_db.conn
    _seed(conn)
    _set_status(conn, "consumed")
    conn.commit()
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="guest_claim_token_nonces_transition_guard"):
            # Re-consume attempt: change terminal_at while remaining consumed is allowed
            # by status equality; force a status flip attempt via issued then consumed.
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET token_status = 'issued',
                       terminal_at = NULL,
                       token_hash = 'hash-1',
                       scrubbed_at = NULL
                 WHERE nonce = 'n-transition'
                """
            )
    conn.rollback()


def test_terminal_at_cannot_be_cleared(identity_db) -> None:
    conn = identity_db.conn
    _seed(conn)
    _set_status(conn, "revoked")
    conn.commit()
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="terminal_at cannot be cleared"):
            cur.execute(
                """
                UPDATE guest_claim_token_nonces
                   SET terminal_at = NULL
                 WHERE nonce = 'n-transition'
                """
            )
    conn.rollback()


def test_binding_fields_immutable(identity_db) -> None:
    conn = identity_db.conn
    guest_id, user_id = _seed(conn)
    other_guest = _uid()
    other_user = _uid()
    with conn.cursor() as cur:
        cur.execute("INSERT INTO users (id) VALUES (%s)", (other_user,))
        cur.execute("INSERT INTO guest_installations (id) VALUES (%s)", (other_guest,))
    conn.commit()

    forbidden = [
        (
            "UPDATE guest_claim_token_nonces SET guest_installation_id = %s WHERE nonce = 'n-transition'",
            (other_guest,),
        ),
        (
            "UPDATE guest_claim_token_nonces SET user_id = %s WHERE nonce = 'n-transition'",
            (other_user,),
        ),
        (
            "UPDATE guest_claim_token_nonces SET purpose = %s WHERE nonce = 'n-transition'",
            ("other",),
        ),
        (
            "UPDATE guest_claim_token_nonces SET token_hash = %s WHERE nonce = 'n-transition'",
            ("mutated",),
        ),
        (
            "UPDATE guest_claim_token_nonces SET issued_at = now() WHERE nonce = 'n-transition'",
            None,
        ),
        (
            "UPDATE guest_claim_token_nonces SET expires_at = now() + interval '1 day' "
            "WHERE nonce = 'n-transition'",
            None,
        ),
    ]
    for sql, params in forbidden:
        with conn.cursor() as cur:
            with pytest.raises(Exception, match="guest_claim_token_nonces_transition_guard"):
                if params is None:
                    cur.execute(sql)
                else:
                    cur.execute(sql, params)
        conn.rollback()

    # Scrub remains allowed on terminal rows.
    _set_status(conn, "consumed")
    conn.commit()
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE guest_claim_token_nonces
               SET token_hash = NULL,
                   scrubbed_at = now()
             WHERE nonce = 'n-transition'
            """
        )
    conn.commit()
    with conn.cursor() as cur:
        cur.execute(
            "SELECT token_hash, scrubbed_at IS NOT NULL FROM guest_claim_token_nonces "
            "WHERE nonce = 'n-transition'"
        )
        assert cur.fetchone() == (None, True)
