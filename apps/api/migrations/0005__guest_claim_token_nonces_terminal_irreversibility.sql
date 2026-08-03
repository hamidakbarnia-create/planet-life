-- Corrective: enforce single-use / terminal irreversibility for guest_claim_token_nonces.
-- PK uniqueness alone does not block issued→consumed→issued cycles.
-- Scrub remains allowed: clear token_hash and set scrubbed_at on terminal rows.

CREATE OR REPLACE FUNCTION guest_claim_token_nonces_transition_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    old_terminal boolean;
    new_terminal boolean;
BEGIN
    old_terminal := OLD.token_status IN ('consumed', 'revoked', 'expired');
    new_terminal := NEW.token_status IN ('consumed', 'revoked', 'expired');

    -- Binding fields are immutable after insert (scrub exception for token_hash below).
    IF NEW.nonce IS DISTINCT FROM OLD.nonce
       OR NEW.guest_installation_id IS DISTINCT FROM OLD.guest_installation_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.purpose IS DISTINCT FROM OLD.purpose
       OR NEW.issued_at IS DISTINCT FROM OLD.issued_at
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
        RAISE EXCEPTION
            'guest_claim_token_nonces_transition_guard: binding fields are immutable';
    END IF;

    -- token_hash immutable except ratified scrub (hash cleared when scrubbed_at set).
    IF NEW.token_hash IS DISTINCT FROM OLD.token_hash THEN
        IF NOT (
            OLD.token_hash IS NOT NULL
            AND NEW.token_hash IS NULL
            AND OLD.scrubbed_at IS NULL
            AND NEW.scrubbed_at IS NOT NULL
            AND old_terminal
            AND NEW.token_status = OLD.token_status
        ) THEN
            RAISE EXCEPTION
                'guest_claim_token_nonces_transition_guard: token_hash is immutable except scrub';
        END IF;
    END IF;

    -- Allowed: issued → consumed | revoked | expired
    IF OLD.token_status = 'issued' THEN
        IF NEW.token_status = 'issued' THEN
            -- Stay issued: no terminal_at introduction without status change.
            IF NEW.terminal_at IS DISTINCT FROM OLD.terminal_at THEN
                RAISE EXCEPTION
                    'guest_claim_token_nonces_transition_guard: issued row cannot set terminal_at without terminal status';
            END IF;
            RETURN NEW;
        END IF;
        IF NEW.token_status IN ('consumed', 'revoked', 'expired') THEN
            IF NEW.terminal_at IS NULL THEN
                RAISE EXCEPTION
                    'guest_claim_token_nonces_transition_guard: terminal transition requires terminal_at';
            END IF;
            RETURN NEW;
        END IF;
        RAISE EXCEPTION
            'guest_claim_token_nonces_transition_guard: invalid transition from issued to %',
            NEW.token_status;
    END IF;

    -- Terminal states are irreversible.
    IF old_terminal THEN
        IF NEW.token_status IS DISTINCT FROM OLD.token_status THEN
            RAISE EXCEPTION
                'guest_claim_token_nonces_transition_guard: terminal status % is irreversible',
                OLD.token_status;
        END IF;
        IF NEW.terminal_at IS NULL THEN
            RAISE EXCEPTION
                'guest_claim_token_nonces_transition_guard: terminal_at cannot be cleared';
        END IF;
        -- Allow scrub / no-op updates that keep terminal status and terminal_at.
        RETURN NEW;
    END IF;

    RAISE EXCEPTION
        'guest_claim_token_nonces_transition_guard: unsupported prior status %',
        OLD.token_status;
END;
$$;

CREATE TRIGGER guest_claim_token_nonces_transition_guard
    BEFORE UPDATE
    ON guest_claim_token_nonces
    FOR EACH ROW
    EXECUTE PROCEDURE guest_claim_token_nonces_transition_guard_fn();
