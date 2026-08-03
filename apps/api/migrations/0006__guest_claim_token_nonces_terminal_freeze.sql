-- Corrective: freeze terminal guest_claim_token_nonces rows.
-- Only one-time ratified scrub may mutate a terminal row; terminal_at is immutable.

CREATE OR REPLACE FUNCTION guest_claim_token_nonces_transition_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    old_terminal boolean;
    is_scrub boolean;
BEGIN
    old_terminal := OLD.token_status IN ('consumed', 'revoked', 'expired');

    -- Binding fields are immutable after insert.
    IF NEW.nonce IS DISTINCT FROM OLD.nonce
       OR NEW.guest_installation_id IS DISTINCT FROM OLD.guest_installation_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.purpose IS DISTINCT FROM OLD.purpose
       OR NEW.issued_at IS DISTINCT FROM OLD.issued_at
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
        RAISE EXCEPTION
            'guest_claim_token_nonces_transition_guard: binding fields are immutable';
    END IF;

    -- Allowed: issued → consumed | revoked | expired (must set terminal_at).
    IF OLD.token_status = 'issued' THEN
        IF NEW.token_status = 'issued' THEN
            IF NEW.terminal_at IS DISTINCT FROM OLD.terminal_at
               OR NEW.token_hash IS DISTINCT FROM OLD.token_hash
               OR NEW.scrubbed_at IS DISTINCT FROM OLD.scrubbed_at THEN
                RAISE EXCEPTION
                    'guest_claim_token_nonces_transition_guard: issued row may not mutate terminal/scrub fields without terminal status';
            END IF;
            RETURN NEW;
        END IF;
        IF NEW.token_status IN ('consumed', 'revoked', 'expired') THEN
            IF NEW.terminal_at IS NULL THEN
                RAISE EXCEPTION
                    'guest_claim_token_nonces_transition_guard: terminal transition requires terminal_at';
            END IF;
            IF NEW.scrubbed_at IS DISTINCT FROM OLD.scrubbed_at THEN
                RAISE EXCEPTION
                    'guest_claim_token_nonces_transition_guard: scrub only allowed after terminal state';
            END IF;
            IF NEW.token_hash IS DISTINCT FROM OLD.token_hash THEN
                RAISE EXCEPTION
                    'guest_claim_token_nonces_transition_guard: token_hash immutable during terminal transition';
            END IF;
            RETURN NEW;
        END IF;
        RAISE EXCEPTION
            'guest_claim_token_nonces_transition_guard: invalid transition from issued to %',
            NEW.token_status;
    END IF;

    -- Terminal rows: only one-time scrub is permitted.
    IF old_terminal THEN
        IF NEW.token_status IS DISTINCT FROM OLD.token_status THEN
            RAISE EXCEPTION
                'guest_claim_token_nonces_transition_guard: terminal status % is irreversible',
                OLD.token_status;
        END IF;
        IF NEW.terminal_at IS DISTINCT FROM OLD.terminal_at THEN
            RAISE EXCEPTION
                'guest_claim_token_nonces_transition_guard: terminal_at is immutable';
        END IF;

        is_scrub := (
            OLD.token_hash IS NOT NULL
            AND NEW.token_hash IS NULL
            AND OLD.scrubbed_at IS NULL
            AND NEW.scrubbed_at IS NOT NULL
            AND NEW.token_status IS NOT DISTINCT FROM OLD.token_status
            AND NEW.terminal_at IS NOT DISTINCT FROM OLD.terminal_at
        );

        IF is_scrub THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION
            'guest_claim_token_nonces_transition_guard: terminal row is frozen except one-time scrub';
    END IF;

    RAISE EXCEPTION
        'guest_claim_token_nonces_transition_guard: unsupported prior status %',
        OLD.token_status;
END;
$$;
