-- EPIC-01: guest_claim_token_nonces replay ledger (ratified Identity PostgreSQL schema).
-- No token signing or JWT. Nonce PK enforces global uniqueness / single-use identity.

CREATE TABLE guest_claim_token_nonces (
    nonce text NOT NULL,
    guest_installation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    purpose text NOT NULL DEFAULT 'guest_claim',
    token_status text NOT NULL DEFAULT 'issued',
    token_hash text NULL,
    issued_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    terminal_at timestamptz NULL,
    scrubbed_at timestamptz NULL,
    CONSTRAINT guest_claim_token_nonces_pkey PRIMARY KEY (nonce),
    CONSTRAINT guest_claim_token_nonces_guest_installation_id_fkey
        FOREIGN KEY (guest_installation_id)
        REFERENCES guest_installations (id)
        ON DELETE RESTRICT,
    CONSTRAINT guest_claim_token_nonces_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT guest_claim_token_nonces_purpose_check
        CHECK (purpose = 'guest_claim'),
    CONSTRAINT guest_claim_token_nonces_token_status_check
        CHECK (token_status IN ('issued', 'consumed', 'revoked', 'expired')),
    CONSTRAINT guest_claim_token_nonces_issued_consistency_check
        CHECK (
            (token_status = 'issued')
            = (terminal_at IS NULL AND token_hash IS NOT NULL AND scrubbed_at IS NULL)
        ),
    CONSTRAINT guest_claim_token_nonces_terminal_required_check
        CHECK (token_status = 'issued' OR terminal_at IS NOT NULL),
    CONSTRAINT guest_claim_token_nonces_scrub_consistency_check
        CHECK (
            (scrubbed_at IS NULL)
            OR (token_hash IS NULL AND token_status <> 'issued')
        )
);

CREATE INDEX guest_claim_token_nonces_guest_issued_at_idx
    ON guest_claim_token_nonces (guest_installation_id, issued_at DESC);

CREATE INDEX guest_claim_token_nonces_user_status_idx
    ON guest_claim_token_nonces (user_id, token_status);
