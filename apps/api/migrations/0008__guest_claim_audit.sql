-- EPIC-01: guest_claim_audit (Identity PostgreSQL Schema §5 + Errata 01).
-- Append-oriented audit skeleton + scrubbable PII. No FK to guest/user.
-- No claim transaction, outbox publisher, or runtime emission.

CREATE TABLE guest_claim_audit (
    id uuid NOT NULL,
    event_type text NOT NULL,
    guest_installation_id uuid NOT NULL,
    user_id uuid NULL,
    claim_token_nonce text NULL,
    idempotency_key text NOT NULL,
    payload_pii jsonb NULL,
    pii_state text NOT NULL DEFAULT 'present',
    scrubbed_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    delivery_state text NOT NULL DEFAULT 'not_required',
    published_at timestamptz NULL,
    retention_until timestamptz NULL,
    CONSTRAINT guest_claim_audit_pkey PRIMARY KEY (id),
    CONSTRAINT guest_claim_audit_idempotency_key_key
        UNIQUE (idempotency_key),
    CONSTRAINT guest_claim_audit_event_type_check CHECK (
        event_type IN (
            'guest_created',
            'claim_token_issued',
            'claim_started',
            'claim_choice_required',
            'claim_choice_submitted',
            'guest_claimed',
            'guest_claim_failed',
            'guest_claim_idempotent',
            'guest_discarded',
            'guest_expired',
            'guest_purged',
            'transition_rejected'
        )
    ),
    CONSTRAINT guest_claim_audit_delivery_published_check CHECK (
        delivery_state IN ('pending', 'published', 'not_required')
        AND (delivery_state = 'published') = (published_at IS NOT NULL)
        AND (delivery_state <> 'published') = (published_at IS NULL)
    ),
    CONSTRAINT guest_claim_audit_pii_state_check CHECK (
        pii_state IN ('present', 'redacted')
    ),
    CONSTRAINT guest_claim_audit_pii_redaction_check CHECK (
        (pii_state = 'redacted')
        = (
            scrubbed_at IS NOT NULL
            AND (payload_pii IS NULL OR payload_pii = '{}'::jsonb)
        )
    ),
    CONSTRAINT guest_claim_audit_guest_claimed_user_check CHECK (
        event_type <> 'guest_claimed' OR user_id IS NOT NULL
    )
);

CREATE UNIQUE INDEX uq_guest_claim_audit_one_guest_claimed
    ON guest_claim_audit (guest_installation_id)
    WHERE event_type = 'guest_claimed';

-- Terminal / choice audits must match persisted guest (and open conflict) state.
CREATE OR REPLACE FUNCTION guest_claim_audit_state_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    guest_lifecycle text;
    guest_claim text;
    guest_claimed_by uuid;
    open_conflict_exists boolean;
BEGIN
    IF NEW.event_type IN (
        'guest_claimed',
        'guest_claim_failed',
        'claim_choice_required',
        'guest_claim_idempotent',
        'guest_discarded',
        'guest_expired',
        'guest_purged'
    ) THEN
        SELECT lifecycle_state, claim_state, claimed_by_user_id
          INTO guest_lifecycle, guest_claim, guest_claimed_by
          FROM guest_installations
         WHERE id = NEW.guest_installation_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: guest_installation % not found for event_type %',
                NEW.guest_installation_id, NEW.event_type;
        END IF;
    END IF;

    IF NEW.event_type = 'guest_claimed' THEN
        IF guest_lifecycle <> 'claimed'
           OR guest_claim <> 'claimed'
           OR guest_claimed_by IS DISTINCT FROM NEW.user_id THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: guest_claimed requires claimed/claimed with claimed_by_user_id = user_id';
        END IF;
    ELSIF NEW.event_type = 'guest_claim_failed' THEN
        IF guest_lifecycle <> 'active' OR guest_claim <> 'claim_failed' THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: guest_claim_failed requires active/claim_failed';
        END IF;
    ELSIF NEW.event_type = 'claim_choice_required' THEN
        IF guest_lifecycle <> 'active' OR guest_claim <> 'awaiting_choice' THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: claim_choice_required requires active/awaiting_choice';
        END IF;
        SELECT EXISTS (
            SELECT 1
              FROM guest_claim_conflicts c
             WHERE c.guest_installation_id = NEW.guest_installation_id
               AND c.user_id = NEW.user_id
               AND c.status = 'open'
        ) INTO open_conflict_exists;
        IF NOT open_conflict_exists THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: claim_choice_required requires an open conflict for guest+user';
        END IF;
    ELSIF NEW.event_type = 'guest_claim_idempotent' THEN
        IF guest_lifecycle <> 'claimed'
           OR guest_claim <> 'claimed'
           OR guest_claimed_by IS DISTINCT FROM NEW.user_id THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: guest_claim_idempotent requires claimed/claimed with claimed_by_user_id = user_id';
        END IF;
    ELSIF NEW.event_type = 'guest_discarded' THEN
        IF guest_claim <> 'discarded' THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: guest_discarded requires claim_state = discarded';
        END IF;
    ELSIF NEW.event_type = 'guest_expired' THEN
        IF guest_lifecycle <> 'expired' THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: guest_expired requires lifecycle_state = expired';
        END IF;
    ELSIF NEW.event_type = 'guest_purged' THEN
        IF guest_lifecycle <> 'purged' THEN
            RAISE EXCEPTION
                'guest_claim_audit_state_guard: guest_purged requires lifecycle_state = purged';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER guest_claim_audit_state_guard
    BEFORE INSERT ON guest_claim_audit
    FOR EACH ROW
    EXECUTE PROCEDURE guest_claim_audit_state_guard_fn();

-- Append-oriented UPDATE: only delivery mutation and one-time PII scrub.
CREATE OR REPLACE FUNCTION guest_claim_audit_update_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    delivery_changed boolean;
    scrub_changed boolean;
    is_publish boolean;
    is_scrub boolean;
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.event_type IS DISTINCT FROM OLD.event_type
       OR NEW.guest_installation_id IS DISTINCT FROM OLD.guest_installation_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.claim_token_nonce IS DISTINCT FROM OLD.claim_token_nonce
       OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.retention_until IS DISTINCT FROM OLD.retention_until THEN
        RAISE EXCEPTION
            'guest_claim_audit_update_guard: audit skeleton and bindings are immutable';
    END IF;

    delivery_changed := (
        NEW.delivery_state IS DISTINCT FROM OLD.delivery_state
        OR NEW.published_at IS DISTINCT FROM OLD.published_at
    );
    scrub_changed := (
        NEW.payload_pii IS DISTINCT FROM OLD.payload_pii
        OR NEW.pii_state IS DISTINCT FROM OLD.pii_state
        OR NEW.scrubbed_at IS DISTINCT FROM OLD.scrubbed_at
    );

    IF NOT delivery_changed AND NOT scrub_changed THEN
        RETURN NEW;
    END IF;

    IF delivery_changed THEN
        IF OLD.delivery_state = 'published'
           AND NEW.delivery_state IS DISTINCT FROM OLD.delivery_state THEN
            RAISE EXCEPTION
                'guest_claim_audit_update_guard: published delivery_state is immutable';
        END IF;

        IF OLD.delivery_state = 'not_required'
           AND NEW.delivery_state IS DISTINCT FROM OLD.delivery_state THEN
            RAISE EXCEPTION
                'guest_claim_audit_update_guard: not_required delivery_state is immutable';
        END IF;

        IF OLD.published_at IS NOT NULL
           AND NEW.published_at IS DISTINCT FROM OLD.published_at THEN
            RAISE EXCEPTION
                'guest_claim_audit_update_guard: published_at is immutable once set';
        END IF;

        is_publish := (
            OLD.delivery_state = 'pending'
            AND NEW.delivery_state = 'published'
            AND OLD.published_at IS NULL
            AND NEW.published_at IS NOT NULL
        );

        IF OLD.delivery_state = 'pending' AND NOT is_publish THEN
            RAISE EXCEPTION
                'guest_claim_audit_update_guard: only pending → published (with published_at) is allowed';
        END IF;
    END IF;

    IF scrub_changed THEN
        IF OLD.pii_state = 'redacted' THEN
            RAISE EXCEPTION
                'guest_claim_audit_update_guard: redacted PII fields are immutable';
        END IF;

        is_scrub := (
            OLD.pii_state = 'present'
            AND NEW.pii_state = 'redacted'
            AND OLD.scrubbed_at IS NULL
            AND NEW.scrubbed_at IS NOT NULL
            AND (NEW.payload_pii IS NULL OR NEW.payload_pii = '{}'::jsonb)
        );

        IF NOT is_scrub THEN
            RAISE EXCEPTION
                'guest_claim_audit_update_guard: only one-time present → redacted scrub is allowed';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER guest_claim_audit_update_guard
    BEFORE UPDATE ON guest_claim_audit
    FOR EACH ROW
    EXECUTE PROCEDURE guest_claim_audit_update_guard_fn();

-- Direct DELETE forbidden; retention uses scrub-in-place only.
CREATE OR REPLACE FUNCTION guest_claim_audit_delete_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'guest_claim_audit_delete_guard: DELETE is forbidden; scrub PII in place';
END;
$$;

CREATE TRIGGER guest_claim_audit_delete_guard
    BEFORE DELETE ON guest_claim_audit
    FOR EACH ROW
    EXECUTE PROCEDURE guest_claim_audit_delete_guard_fn();
