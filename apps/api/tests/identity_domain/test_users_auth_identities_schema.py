"""PostgreSQL constraint tests for EPIC-01 PR-02 users + auth_identities."""

from __future__ import annotations

import uuid

import pytest
from psycopg import errors

from .harness import list_table_columns
from .invariants import USERS_FORBIDDEN_PROVIDER_COLUMNS, assert_no_provider_subject_columns


pytestmark = pytest.mark.identity_db


def _uid() -> uuid.UUID:
    return uuid.uuid4()


def _insert_user(conn, user_id=None, **fields):
    user_id = user_id or _uid()
    cols = ["id"]
    vals = [user_id]
    for key, value in fields.items():
        cols.append(key)
        vals.append(value)
    placeholders = ", ".join(["%s"] * len(cols))
    col_sql = ", ".join(cols)
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO users ({col_sql}) VALUES ({placeholders})",
            vals,
        )
    return user_id


def _insert_auth(conn, *, user_id, **fields):
    auth_id = fields.pop("id", None) or _uid()
    provider = fields.pop("provider", "clerk")
    provider_subject = fields.pop("provider_subject", f"sub_{auth_id.hex[:12]}")
    identity_kind = fields.pop("identity_kind", "google")
    status = fields.pop("status", "active")
    revoked_at = fields.pop("revoked_at", None)
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO auth_identities (
                id, user_id, provider, provider_subject, identity_kind,
                status, revoked_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                auth_id,
                user_id,
                provider,
                provider_subject,
                identity_kind,
                status,
                revoked_at,
            ),
        )
    return auth_id


def test_users_pk_and_required_timestamps(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, account_state, lifecycle_state,
                   created_at, updated_at, deleted_at
            FROM users WHERE id = %s
            """,
            (user_id,),
        )
        row = cur.fetchone()
    assert row[0] == user_id
    assert row[1] == "active"
    assert row[2] == "live"
    assert row[3] is not None
    assert row[4] is not None
    assert row[5] is None
    conn.commit()


def test_users_reject_guest_account_state(identity_db) -> None:
    conn = identity_db.conn
    with pytest.raises(errors.CheckViolation):
        _insert_user(conn, account_state="guest")
    conn.rollback()


def test_users_lifecycle_state_validation(identity_db) -> None:
    conn = identity_db.conn
    with pytest.raises(errors.CheckViolation):
        _insert_user(conn, lifecycle_state="archived")
    conn.rollback()


def test_users_soft_delete_consistency(identity_db) -> None:
    conn = identity_db.conn
    with pytest.raises(errors.CheckViolation):
        _insert_user(conn, lifecycle_state="deleted", deleted_at=None)
    conn.rollback()
    with pytest.raises(errors.CheckViolation):
        _insert_user(conn, lifecycle_state="live", deleted_at="2026-08-03T00:00:00Z")
    conn.rollback()
    user_id = _insert_user(
        conn, lifecycle_state="deleted", deleted_at="2026-08-03T00:00:00Z"
    )
    assert user_id is not None
    conn.commit()


def test_users_merged_pair_and_self_merge(identity_db) -> None:
    conn = identity_db.conn
    survivor = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_user(conn, account_state="merged", merged_into_user_id=None)
    conn.rollback()
    survivor = _insert_user(conn)
    absorbed = _uid()
    # BEFORE trigger rejects self-merge before CHECK; both enforce the ban.
    with pytest.raises((errors.CheckViolation, errors.RaiseException)):
        _insert_user(
            conn,
            user_id=absorbed,
            account_state="merged",
            merged_into_user_id=absorbed,
        )
    conn.rollback()
    survivor = _insert_user(conn)
    _insert_user(
        conn,
        account_state="merged",
        merged_into_user_id=survivor,
    )
    conn.commit()


def test_users_merge_acyclic_trigger(identity_db) -> None:
    conn = identity_db.conn
    a = _insert_user(conn)
    b = _insert_user(conn, account_state="merged", merged_into_user_id=a)
    conn.commit()
    with conn.cursor() as cur:
        with pytest.raises(Exception, match="users_merge_acyclic"):
            cur.execute(
                """
                UPDATE users
                   SET account_state = 'merged',
                       merged_into_user_id = %s
                 WHERE id = %s
                """,
                (b, a),
            )
    conn.rollback()


def test_users_have_no_provider_columns(identity_db) -> None:
    cols = list_table_columns(identity_db.conn, "users")
    forbidden = USERS_FORBIDDEN_PROVIDER_COLUMNS.intersection(cols)
    assert not forbidden
    assert_no_provider_subject_columns(cols)


def test_auth_identities_fk_restrict_and_timestamps(identity_db) -> None:
    conn = identity_db.conn
    missing_user = _uid()
    with pytest.raises(errors.ForeignKeyViolation):
        _insert_auth(conn, user_id=missing_user)
    conn.rollback()

    user_id = _insert_user(conn)
    auth_id = _insert_auth(conn, user_id=user_id)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT linked_at, created_at, updated_at, status, revoked_at
            FROM auth_identities WHERE id = %s
            """,
            (auth_id,),
        )
        linked_at, created_at, updated_at, status, revoked_at = cur.fetchone()
    assert linked_at is not None
    assert created_at is not None
    assert updated_at is not None
    assert status == "active"
    assert revoked_at is None

    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.rollback()


def test_provider_subject_uniqueness_holds_under_user_soft_delete(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    _insert_auth(
        conn,
        user_id=user_id,
        provider="clerk",
        provider_subject="sub_unique_1",
        identity_kind="google",
    )
    conn.commit()

    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE users
               SET lifecycle_state = 'deleted',
                   deleted_at = now()
             WHERE id = %s
            """,
            (user_id,),
        )
    conn.commit()

    other = _insert_user(conn)
    with pytest.raises(errors.UniqueViolation):
        _insert_auth(
            conn,
            user_id=other,
            provider="clerk",
            provider_subject="sub_unique_1",
            identity_kind="apple",
        )
    conn.rollback()


def test_active_identity_kind_uniqueness(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    _insert_auth(
        conn,
        user_id=user_id,
        provider="clerk",
        provider_subject="sub_a",
        identity_kind="google",
        status="active",
    )
    with pytest.raises(errors.UniqueViolation):
        _insert_auth(
            conn,
            user_id=user_id,
            provider="clerk",
            provider_subject="sub_b",
            identity_kind="google",
            status="active",
        )
    conn.rollback()

    user_id = _insert_user(conn)
    _insert_auth(
        conn,
        user_id=user_id,
        provider="clerk",
        provider_subject="sub_c",
        identity_kind="google",
        status="revoked",
        revoked_at="2026-08-03T00:00:00Z",
    )
    _insert_auth(
        conn,
        user_id=user_id,
        provider="clerk",
        provider_subject="sub_d",
        identity_kind="google",
        status="active",
    )
    conn.commit()


def test_status_revoked_at_consistency(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_auth(
            conn,
            user_id=user_id,
            status="active",
            revoked_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()
    user_id = _insert_user(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_auth(
            conn,
            user_id=user_id,
            status="revoked",
            revoked_at=None,
        )
    conn.rollback()


def test_provider_identity_only_on_auth_identities(identity_db) -> None:
    user_cols = list_table_columns(identity_db.conn, "users")
    auth_cols = list_table_columns(identity_db.conn, "auth_identities")
    assert "provider_subject" in auth_cols
    assert "provider" in auth_cols
    assert "provider_subject" not in user_cols
    assert "provider" not in user_cols
