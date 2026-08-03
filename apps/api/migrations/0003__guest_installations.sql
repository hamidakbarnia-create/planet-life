-- EPIC-01: guest_installations (ratified Identity PostgreSQL schema).
-- Guests are never users. Claimed state is irreversible at schema level.

CREATE TABLE guest_installations (
    id uuid NOT NULL,
    lifecycle_state text NOT NULL DEFAULT 'active',
    claim_state text NOT NULL DEFAULT 'unclaimed',
    client_platform text NOT NULL DEFAULT 'unknown',
    created_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NULL,
    purge_after timestamptz NULL,
    purged_at timestamptz NULL,
    claimed_by_user_id uuid NULL,
    claimed_at timestamptz NULL,
    client_install_key_hash text NULL,
    claim_lock_version bigint NOT NULL DEFAULT 0,
    claim_locked_at timestamptz NULL,
    claim_token_status text NOT NULL DEFAULT 'none',
    claim_token_nonce text NULL,
    claim_token_user_id uuid NULL,
    claim_token_purpose text NULL,
    claim_token_expires_at timestamptz NULL,
    claim_token_hash text NULL,
    claim_token_consumed_at timestamptz NULL,
    CONSTRAINT guest_installations_pkey PRIMARY KEY (id),
    CONSTRAINT guest_installations_claimed_by_user_id_fkey
        FOREIGN KEY (claimed_by_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT guest_installations_claim_token_user_id_fkey
        FOREIGN KEY (claim_token_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT guest_installations_legal_matrix_check CHECK (
        (
            (lifecycle_state = 'active' AND claim_state IN ('unclaimed', 'awaiting_choice', 'claim_failed', 'discarded'))
            OR (lifecycle_state = 'pending_claim' AND claim_state = 'claim_in_progress')
            OR (lifecycle_state = 'claimed' AND claim_state = 'claimed')
            OR (lifecycle_state = 'expired' AND claim_state = 'discarded')
            OR (lifecycle_state = 'purged' AND claim_state = 'discarded')
        )
        AND (
            (lifecycle_state = 'claimed' AND claimed_by_user_id IS NOT NULL AND claimed_at IS NOT NULL)
            OR (lifecycle_state <> 'claimed' AND claimed_by_user_id IS NULL AND claimed_at IS NULL)
        )
        AND (
            (lifecycle_state = 'purged') = (purged_at IS NOT NULL)
        )
        AND claim_token_status IN ('none', 'issued', 'consumed', 'revoked', 'expired')
        AND (
            claim_token_status <> 'issued'
            OR (
                claim_token_hash IS NOT NULL
                AND claim_token_nonce IS NOT NULL
                AND claim_token_user_id IS NOT NULL
                AND claim_token_purpose = 'guest_claim'
                AND claim_token_expires_at IS NOT NULL
                AND claim_token_consumed_at IS NULL
            )
        )
        AND (
            claim_token_status <> 'none'
            OR (
                claim_token_hash IS NULL
                AND claim_token_nonce IS NULL
                AND claim_token_user_id IS NULL
                AND claim_token_purpose IS NULL
                AND claim_token_expires_at IS NULL
                AND claim_token_consumed_at IS NULL
            )
        )
    )
);

CREATE UNIQUE INDEX uq_guest_active_install_key
    ON guest_installations (client_install_key_hash)
    WHERE client_install_key_hash IS NOT NULL
      AND lifecycle_state = 'active'
      AND claim_state IN ('unclaimed', 'awaiting_choice', 'claim_failed');

CREATE INDEX guest_installations_active_expires_at_idx
    ON guest_installations (expires_at)
    WHERE lifecycle_state = 'active'
      AND expires_at IS NOT NULL;

CREATE INDEX guest_installations_purge_after_idx
    ON guest_installations (purge_after)
    WHERE purge_after IS NOT NULL
      AND (lifecycle_state = 'expired' OR claim_state = 'discarded');

CREATE INDEX guest_installations_lifecycle_claim_active_idx
    ON guest_installations (lifecycle_state, claim_state)
    WHERE lifecycle_state IN ('active', 'pending_claim');

CREATE INDEX guest_installations_claimed_by_user_id_idx
    ON guest_installations (claimed_by_user_id);

CREATE INDEX guest_installations_claim_token_user_id_idx
    ON guest_installations (claim_token_user_id);

CREATE OR REPLACE FUNCTION guest_installations_claimed_immutable_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.lifecycle_state = 'claimed' OR OLD.claim_state = 'claimed' THEN
        IF NEW.lifecycle_state IS DISTINCT FROM OLD.lifecycle_state
           OR NEW.claim_state IS DISTINCT FROM OLD.claim_state
           OR NEW.claimed_by_user_id IS DISTINCT FROM OLD.claimed_by_user_id THEN
            RAISE EXCEPTION
                'guest_installations_claimed_immutable: claimed guest cannot change lifecycle_state, claim_state, or claimed_by_user_id';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER guest_installations_claimed_immutable
    BEFORE UPDATE
    ON guest_installations
    FOR EACH ROW
    EXECUTE PROCEDURE guest_installations_claimed_immutable_fn();
