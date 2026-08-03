"""PostgreSQL constraint and trigger tests for guest_claim_audit."""

from __future__ import annotations

import uuid

import pytest
from psycopg import errors
from psycopg.types.json import Json

from .harness import list_table_columns
from .invariants import (
    CANONICAL_AUDIT_EVENT_TYPES,
    GUEST_CLAIM_AUDIT_COLUMNS,
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
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO guest_claim_conflicts (
                id, guest_installation_id, user_id, conflict_classes, idempotency_key,
                status, resolved_at
            ) VALUES (%s, %s, %s, %s::jsonb, %s, %s, %s)
            """,
            (
                conflict_id,
                guest_id,
                user_id,
                '{"class":"ownership"}',
                fields.get("idempotency_key", f"conflict-{conflict_id}"),
                fields.get("status", "open"),
                fields.get("resolved_at"),
            ),
        )
    return conflict_id


def _insert_audit(conn, *, event_type, guest_id, **fields):
    audit_id = fields.pop("id", None) or _uid()
    cols = ["id", "event_type", "guest_installation_id", "idempotency_key"]
    vals = [
        audit_id,
        event_type,
        guest_id,
        fields.pop("idempotency_key", f"audit-{audit_id}"),
    ]
    for key, value in fields.items():
        cols.append(key)
        vals.append(value)
    placeholders = ", ".join(["%s"] * len(cols))
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO guest_claim_audit ({', '.join(cols)}) VALUES ({placeholders})",
            vals,
        )
    return audit_id


def test_audit_columns_match_ratified_schema(identity_db) -> None:
    cols = list_table_columns(identity_db.conn, "guest_claim_audit")
    assert cols == GUEST_CLAIM_AUDIT_COLUMNS
    assert_no_provider_subject_columns(cols)
    forbidden = {
        "conflict_policy",
        "resource_key",
        "transaction_correlation",
        "external_event_id",
    }
    assert cols.isdisjoint(forbidden)


def test_all_canonical_event_types_accepted(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    assert len(CANONICAL_AUDIT_EVENT_TYPES) == 12

    for event_type in CANONICAL_AUDIT_EVENT_TYPES:
        guest_id = _insert_guest(conn)
        fields: dict = {}
        if event_type in {
            "guest_claimed",
            "guest_claim_idempotent",
            "claim_choice_required",
            "guest_claim_failed",
            "guest_discarded",
            "guest_expired",
            "guest_purged",
        }:
            # Prepare matching guest state for guarded events.
            with conn.cursor() as cur:
                if event_type in {"guest_claimed", "guest_claim_idempotent"}:
                    cur.execute(
                        """
                        UPDATE guest_installations
                           SET lifecycle_state = 'claimed',
                               claim_state = 'claimed',
                               claimed_by_user_id = %s,
                               claimed_at = %s
                         WHERE id = %s
                        """,
                        (user_id, "2026-08-03T00:00:00Z", guest_id),
                    )
                    fields["user_id"] = user_id
                elif event_type == "guest_claim_failed":
                    cur.execute(
                        """
                        UPDATE guest_installations
                           SET lifecycle_state = 'active',
                               claim_state = 'claim_failed'
                         WHERE id = %s
                        """,
                        (guest_id,),
                    )
                elif event_type == "claim_choice_required":
                    cur.execute(
                        """
                        UPDATE guest_installations
                           SET lifecycle_state = 'active',
                               claim_state = 'awaiting_choice'
                         WHERE id = %s
                        """,
                        (guest_id,),
                    )
                    _insert_conflict(conn, guest_id=guest_id, user_id=user_id)
                    fields["user_id"] = user_id
                elif event_type == "guest_discarded":
                    cur.execute(
                        """
                        UPDATE guest_installations
                           SET lifecycle_state = 'active',
                               claim_state = 'discarded'
                         WHERE id = %s
                        """,
                        (guest_id,),
                    )
                elif event_type == "guest_expired":
                    cur.execute(
                        """
                        UPDATE guest_installations
                           SET lifecycle_state = 'expired',
                               claim_state = 'discarded'
                         WHERE id = %s
                        """,
                        (guest_id,),
                    )
                elif event_type == "guest_purged":
                    cur.execute(
                        """
                        UPDATE guest_installations
                           SET lifecycle_state = 'purged',
                               claim_state = 'discarded',
                               purged_at = %s
                         WHERE id = %s
                        """,
                        ("2026-08-03T00:00:00Z", guest_id),
                    )
        _insert_audit(conn, event_type=event_type, guest_id=guest_id, **fields)
    conn.commit()


def test_identity_prefixed_and_alias_event_types_rejected(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    for bad in (
        "identity.guest_created",
        "claim_idempotent",
        "expired",
        "purged",
        "unknown_event",
    ):
        with pytest.raises(errors.CheckViolation):
            _insert_audit(conn, event_type=bad, guest_id=guest_id)
        conn.rollback()
        guest_id = _insert_guest(conn)


def test_delivery_and_published_at_consistency(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=guest_id,
        delivery_state="pending",
        published_at=None,
        idempotency_key="pending-ok",
    )
    guest_id = _insert_guest(conn)
    _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=guest_id,
        delivery_state="not_required",
        published_at=None,
        idempotency_key="not-required-ok",
    )
    guest_id = _insert_guest(conn)
    _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=guest_id,
        delivery_state="published",
        published_at="2026-08-03T00:00:00Z",
        idempotency_key="published-ok",
    )
    conn.commit()

    guest_id = _insert_guest(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_audit(
            conn,
            event_type="guest_created",
            guest_id=guest_id,
            delivery_state="pending",
            published_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()
    guest_id = _insert_guest(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_audit(
            conn,
            event_type="guest_created",
            guest_id=guest_id,
            delivery_state="not_required",
            published_at="2026-08-03T00:00:00Z",
        )
    conn.rollback()
    guest_id = _insert_guest(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_audit(
            conn,
            event_type="guest_created",
            guest_id=guest_id,
            delivery_state="published",
            published_at=None,
        )
    conn.rollback()
    guest_id = _insert_guest(conn)
    with pytest.raises(errors.CheckViolation):
        _insert_audit(
            conn,
            event_type="guest_created",
            guest_id=guest_id,
            delivery_state="queued",
        )
    conn.rollback()


def test_pending_to_published_once_and_monotonic(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    audit_id = _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=guest_id,
        delivery_state="pending",
        published_at=None,
    )
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE guest_claim_audit
               SET delivery_state = 'published',
                   published_at = %s
             WHERE id = %s
            """,
            ("2026-08-03T00:00:00Z", audit_id),
        )
    conn.commit()

    with pytest.raises(Exception, match="published delivery_state is immutable"):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET delivery_state = 'pending',
                       published_at = NULL
                 WHERE id = %s
                """,
                (audit_id,),
            )
    conn.rollback()

    with pytest.raises(Exception, match="published delivery_state is immutable"):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET delivery_state = 'not_required',
                       published_at = NULL
                 WHERE id = %s
                """,
                (audit_id,),
            )
    conn.rollback()

    with pytest.raises(Exception, match="published_at is immutable once set"):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET published_at = %s
                 WHERE id = %s
                """,
                ("2026-08-04T00:00:00Z", audit_id),
            )
    conn.rollback()


def test_not_required_delivery_immutable(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    audit_id = _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=guest_id,
        delivery_state="not_required",
    )
    with pytest.raises(Exception, match="not_required delivery_state is immutable"):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET delivery_state = 'published',
                       published_at = %s
                 WHERE id = %s
                """,
                ("2026-08-03T00:00:00Z", audit_id),
            )
    conn.rollback()


def test_immutable_skeleton_fields(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    other_guest = _insert_guest(conn)
    audit_id = _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=guest_id,
        payload_pii=Json({"email": "a@example.com"}),
    )
    conn.commit()
    with pytest.raises(Exception, match="audit skeleton and bindings are immutable"):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET event_type = 'claim_started'
                 WHERE id = %s
                """,
                (audit_id,),
            )
    conn.rollback()
    with pytest.raises(Exception, match="audit skeleton and bindings are immutable"):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET guest_installation_id = %s
                 WHERE id = %s
                """,
                (other_guest, audit_id),
            )
    conn.rollback()
    with pytest.raises(Exception, match="audit skeleton and bindings are immutable"):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET idempotency_key = 'rewritten'
                 WHERE id = %s
                """,
                (audit_id,),
            )
    conn.rollback()


def test_pii_scrub_once_only(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    audit_id = _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=guest_id,
        payload_pii=Json({"email": "a@example.com"}),
        pii_state="present",
    )
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE guest_claim_audit
               SET payload_pii = NULL,
                   pii_state = 'redacted',
                   scrubbed_at = %s
             WHERE id = %s
            """,
            ("2026-08-03T00:00:00Z", audit_id),
        )
    conn.commit()

    with pytest.raises(Exception, match="redacted PII fields are immutable"):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET payload_pii = NULL,
                       pii_state = 'redacted',
                       scrubbed_at = %s
                 WHERE id = %s
                """,
                ("2026-08-04T00:00:00Z", audit_id),
            )
    conn.rollback()

    with pytest.raises(Exception, match="only one-time present → redacted scrub"):
        guest_id = _insert_guest(conn)
        audit_id = _insert_audit(
            conn,
            event_type="guest_created",
            guest_id=guest_id,
            payload_pii=Json({"email": "b@example.com"}),
        )
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE guest_claim_audit
                   SET payload_pii = %s
                 WHERE id = %s
                """,
                (Json({"email": "rewritten@example.com"}), audit_id),
            )
    conn.rollback()


def test_direct_delete_forbidden(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    audit_id = _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=guest_id,
    )
    conn.commit()
    with pytest.raises(Exception, match="DELETE is forbidden"):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM guest_claim_audit WHERE id = %s", (audit_id,))
    conn.rollback()


def test_no_fk_to_guest_or_user(identity_db) -> None:
    conn = identity_db.conn
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*)
              FROM information_schema.table_constraints
             WHERE table_schema = 'public'
               AND table_name = 'guest_claim_audit'
               AND constraint_type = 'FOREIGN KEY'
            """
        )
        assert cur.fetchone()[0] == 0

    # Skeleton may reference purged/absent guest ids (no FK).
    missing_guest = _uid()
    _insert_audit(
        conn,
        event_type="guest_created",
        guest_id=missing_guest,
        idempotency_key="orphan-skeleton",
    )
    conn.commit()


def test_guest_claimed_requires_user_and_state(identity_db) -> None:
    conn = identity_db.conn
    guest_id = _insert_guest(conn)
    # BEFORE INSERT state guard runs before CHECK; both forbid this shape.
    with pytest.raises((errors.CheckViolation, errors.RaiseException)):
        _insert_audit(
            conn,
            event_type="guest_claimed",
            guest_id=guest_id,
            user_id=None,
        )
    conn.rollback()

    guest_id = _insert_guest(conn)
    user_id = _insert_user(conn)
    with pytest.raises(Exception, match="guest_claim_audit_state_guard"):
        _insert_audit(
            conn,
            event_type="guest_claimed",
            guest_id=guest_id,
            user_id=user_id,
        )
    conn.rollback()


def test_one_guest_claimed_per_guest(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    guest_id = _insert_guest(
        conn,
        lifecycle_state="claimed",
        claim_state="claimed",
        claimed_by_user_id=user_id,
        claimed_at="2026-08-03T00:00:00Z",
    )
    _insert_audit(
        conn,
        event_type="guest_claimed",
        guest_id=guest_id,
        user_id=user_id,
        idempotency_key="claimed-1",
    )
    with pytest.raises(errors.UniqueViolation):
        _insert_audit(
            conn,
            event_type="guest_claimed",
            guest_id=guest_id,
            user_id=user_id,
            idempotency_key="claimed-2",
        )
    conn.rollback()


def test_claim_choice_required_needs_open_conflict(identity_db) -> None:
    conn = identity_db.conn
    user_id = _insert_user(conn)
    guest_id = _insert_guest(
        conn,
        lifecycle_state="active",
        claim_state="awaiting_choice",
    )
    with pytest.raises(Exception, match="open conflict"):
        _insert_audit(
            conn,
            event_type="claim_choice_required",
            guest_id=guest_id,
            user_id=user_id,
        )
    conn.rollback()

    guest_id = _insert_guest(
        conn,
        lifecycle_state="active",
        claim_state="awaiting_choice",
    )
    user_id = _insert_user(conn)
    _insert_conflict(conn, guest_id=guest_id, user_id=user_id)
    _insert_audit(
        conn,
        event_type="claim_choice_required",
        guest_id=guest_id,
        user_id=user_id,
    )
    conn.commit()
