-- EPIC-01 PR-02: authenticated users only (ratified Identity PostgreSQL schema).
-- Guests must never be stored in this table.

CREATE TABLE users (
    id uuid NOT NULL,
    account_state text NOT NULL DEFAULT 'active',
    lifecycle_state text NOT NULL DEFAULT 'live',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    merged_into_user_id uuid NULL,
    retention_purge_after timestamptz NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_merged_into_user_id_fkey
        FOREIGN KEY (merged_into_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT users_account_state_check
        CHECK (account_state IN ('active', 'suspended', 'merged')),
    CONSTRAINT users_lifecycle_state_check
        CHECK (lifecycle_state IN ('live', 'pending_deletion', 'deleted')),
    CONSTRAINT users_merged_pair_check
        CHECK ((account_state = 'merged') = (merged_into_user_id IS NOT NULL)),
    CONSTRAINT users_deleted_pair_check
        CHECK ((lifecycle_state = 'deleted') = (deleted_at IS NOT NULL)),
    CONSTRAINT users_no_self_merge_check
        CHECK (merged_into_user_id IS DISTINCT FROM id)
);

CREATE INDEX users_lifecycle_state_idx ON users (lifecycle_state);

CREATE OR REPLACE FUNCTION users_merge_acyclic_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    cursor_id uuid;
    depth integer := 0;
    max_depth constant integer := 64;
BEGIN
    IF NEW.merged_into_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    cursor_id := NEW.merged_into_user_id;
    WHILE cursor_id IS NOT NULL LOOP
        depth := depth + 1;
        IF depth > max_depth THEN
            RAISE EXCEPTION
                'users_merge_acyclic: merge chain exceeds depth cap (%)',
                max_depth;
        END IF;
        IF cursor_id = NEW.id THEN
            RAISE EXCEPTION 'users_merge_acyclic: merge cycle detected';
        END IF;
        SELECT u.merged_into_user_id
          INTO cursor_id
          FROM users AS u
         WHERE u.id = cursor_id;
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER users_merge_acyclic
    BEFORE INSERT OR UPDATE OF merged_into_user_id
    ON users
    FOR EACH ROW
    EXECUTE PROCEDURE users_merge_acyclic_fn();
