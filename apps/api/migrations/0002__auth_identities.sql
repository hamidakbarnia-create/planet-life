-- EPIC-01 PR-02: IdP subject mapping only (ratified Identity PostgreSQL schema).
-- Provider subjects must not appear outside this table.

CREATE TABLE auth_identities (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    provider_subject text NOT NULL,
    identity_kind text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    linked_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz NULL,
    last_asserted_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT auth_identities_pkey PRIMARY KEY (id),
    CONSTRAINT auth_identities_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT auth_identities_status_check
        CHECK (status IN ('active', 'revoked', 'superseded')),
    CONSTRAINT auth_identities_status_revoked_at_check
        CHECK (
            (status = 'active' AND revoked_at IS NULL)
            OR (status IN ('revoked', 'superseded') AND revoked_at IS NOT NULL)
        ),
    CONSTRAINT uq_auth_provider_subject
        UNIQUE (provider, provider_subject)
);

CREATE UNIQUE INDEX uq_auth_active_kind
    ON auth_identities (user_id, provider, identity_kind)
    WHERE status = 'active';

CREATE INDEX auth_identities_user_id_idx ON auth_identities (user_id);
