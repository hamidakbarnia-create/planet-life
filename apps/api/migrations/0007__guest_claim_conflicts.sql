-- EPIC-01: guest_claim_conflicts (Identity PostgreSQL Schema §4 + Errata 01).
-- Conflict evidence only. No claim orchestration or resource transfer.

CREATE TABLE guest_claim_conflicts (
    id uuid NOT NULL,
    guest_installation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'open',
    conflict_classes jsonb NOT NULL,
    conflict_classes_redacted boolean NOT NULL DEFAULT false,
    choices jsonb NULL,
    idempotency_key text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz NULL,
    expires_at timestamptz NULL,
    scrubbed_at timestamptz NULL,
    CONSTRAINT guest_claim_conflicts_pkey PRIMARY KEY (id),
    CONSTRAINT guest_claim_conflicts_guest_installation_id_fkey
        FOREIGN KEY (guest_installation_id)
        REFERENCES guest_installations (id)
        ON DELETE RESTRICT,
    CONSTRAINT guest_claim_conflicts_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT,
    CONSTRAINT guest_claim_conflicts_idempotency_key_key
        UNIQUE (idempotency_key),
    CONSTRAINT guest_claim_conflicts_status_resolved_at_check CHECK (
        status IN ('open', 'resolved', 'cancelled')
        AND (status = 'open') = (resolved_at IS NULL)
        AND (status IN ('resolved', 'cancelled')) = (resolved_at IS NOT NULL)
    ),
    CONSTRAINT guest_claim_conflicts_redaction_check CHECK (
        (conflict_classes_redacted = true) = (scrubbed_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_guest_claim_conflicts_one_open
    ON guest_claim_conflicts (guest_installation_id)
    WHERE status = 'open';
