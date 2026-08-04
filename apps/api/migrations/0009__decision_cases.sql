-- EPIC-001 E4: Decision Case aggregate System of Record (ACR-0001 §B5).
-- Schema authority: EPIC-001-E4-TASK-SPEC.md. No activation_phase column.

CREATE TABLE decision_cases (
    case_id uuid NOT NULL,
    owner_subject_id text NOT NULL,
    decision_type_id text NOT NULL,
    family_id text NOT NULL,
    title text NOT NULL,
    state text NOT NULL,
    mode text NOT NULL,
    precision_level text NOT NULL,
    schema_version text NOT NULL DEFAULT '1.0.0',
    current_case_version integer NOT NULL,
    paused_prior_state text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT decision_cases_pkey PRIMARY KEY (case_id),
    CONSTRAINT decision_cases_state_check CHECK (
        state IN (
            'draft', 'intake', 'evidence_ready', 'evaluated', 'compared',
            'planned', 'scheduled', 'executing', 'completed', 'reflected',
            'archived', 'paused', 'superseded', 'rejected'
        )
    ),
    CONSTRAINT decision_cases_mode_check CHECK (
        mode IN ('none', 'evaluate_date', 'compare_dates')
    ),
    CONSTRAINT decision_cases_precision_level_check CHECK (
        precision_level IN ('L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7')
    ),
    CONSTRAINT decision_cases_current_case_version_check CHECK (
        current_case_version >= 1
    ),
    CONSTRAINT decision_cases_updated_after_created_check CHECK (
        updated_at >= created_at
    ),
    CONSTRAINT decision_cases_paused_prior_state_check CHECK (
        (
            state = 'paused'
            AND paused_prior_state IS NOT NULL
            AND paused_prior_state IN (
                'draft', 'intake', 'evidence_ready', 'evaluated', 'compared',
                'planned', 'scheduled', 'executing', 'completed', 'reflected'
            )
        )
        OR (
            state <> 'paused'
            AND paused_prior_state IS NULL
        )
    )
);

CREATE INDEX decision_cases_owner_updated_idx
    ON decision_cases (owner_subject_id, updated_at DESC);

CREATE INDEX decision_cases_owner_state_idx
    ON decision_cases (owner_subject_id, state);

CREATE TABLE decision_versions (
    case_id uuid NOT NULL,
    version integer NOT NULL,
    intake jsonb NOT NULL,
    constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
    mode text NOT NULL,
    reason text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT decision_versions_pkey PRIMARY KEY (case_id, version),
    CONSTRAINT decision_versions_case_id_fkey
        FOREIGN KEY (case_id) REFERENCES decision_cases (case_id) ON DELETE RESTRICT,
    CONSTRAINT decision_versions_version_check CHECK (version >= 1),
    CONSTRAINT decision_versions_mode_check CHECK (
        mode IN ('none', 'evaluate_date', 'compare_dates')
    ),
    CONSTRAINT decision_versions_reason_check CHECK (
        reason IN ('create', 'intake_update', 'mode_change')
    )
);

CREATE TABLE decision_evaluations (
    evaluation_id uuid NOT NULL,
    case_id uuid NOT NULL,
    case_version integer NOT NULL,
    evaluation_version integer NOT NULL,
    package_contract_version text NOT NULL,
    package jsonb NOT NULL,
    engine_id text NOT NULL,
    dq_status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT decision_evaluations_pkey PRIMARY KEY (evaluation_id),
    CONSTRAINT decision_evaluations_case_version_fkey
        FOREIGN KEY (case_id, case_version)
        REFERENCES decision_versions (case_id, version) ON DELETE RESTRICT,
    CONSTRAINT decision_evaluations_case_id_fkey
        FOREIGN KEY (case_id) REFERENCES decision_cases (case_id) ON DELETE RESTRICT,
    CONSTRAINT decision_evaluations_evaluation_version_check CHECK (
        evaluation_version >= 1
    ),
    CONSTRAINT decision_evaluations_dq_status_check CHECK (
        dq_status IN ('pass', 'blocked')
    ),
    CONSTRAINT decision_evaluations_case_eval_version_key
        UNIQUE (case_id, evaluation_version)
);

CREATE INDEX decision_evaluations_case_eval_version_idx
    ON decision_evaluations (case_id, evaluation_version DESC);

CREATE TABLE decision_evidence_bindings (
    evidence_binding_id uuid NOT NULL,
    case_id uuid NOT NULL,
    framework_id text NOT NULL,
    eligibility text NOT NULL,
    artifact_ref text NOT NULL,
    limits jsonb NOT NULL DEFAULT '[]'::jsonb,
    bound_at timestamptz NOT NULL DEFAULT now(),
    evaluation_id uuid NULL,
    CONSTRAINT decision_evidence_bindings_pkey PRIMARY KEY (evidence_binding_id),
    CONSTRAINT decision_evidence_bindings_case_id_fkey
        FOREIGN KEY (case_id) REFERENCES decision_cases (case_id) ON DELETE RESTRICT,
    CONSTRAINT decision_evidence_bindings_evaluation_id_fkey
        FOREIGN KEY (evaluation_id) REFERENCES decision_evaluations (evaluation_id)
        ON DELETE RESTRICT,
    CONSTRAINT decision_evidence_bindings_eligibility_check CHECK (
        eligibility IN (
            'supported', 'partial', 'unknown', 'unavailable', 'provisional', 'rejected'
        )
    )
);

CREATE INDEX decision_evidence_bindings_case_id_idx
    ON decision_evidence_bindings (case_id);

CREATE TABLE decision_participants (
    participant_id uuid NOT NULL,
    case_id uuid NOT NULL,
    person_ref text NOT NULL,
    role text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT decision_participants_pkey PRIMARY KEY (participant_id),
    CONSTRAINT decision_participants_case_id_fkey
        FOREIGN KEY (case_id) REFERENCES decision_cases (case_id) ON DELETE RESTRICT,
    CONSTRAINT decision_participants_role_check CHECK (
        role IN ('subject', 'partner', 'counterparty', 'other')
    )
);

CREATE TABLE decision_candidate_dates (
    candidate_date_id uuid NOT NULL,
    case_id uuid NOT NULL,
    case_version integer NOT NULL,
    candidate_date date NOT NULL,
    label text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT decision_candidate_dates_pkey PRIMARY KEY (candidate_date_id),
    CONSTRAINT decision_candidate_dates_case_version_fkey
        FOREIGN KEY (case_id, case_version)
        REFERENCES decision_versions (case_id, version) ON DELETE RESTRICT,
    CONSTRAINT decision_candidate_dates_case_id_fkey
        FOREIGN KEY (case_id) REFERENCES decision_cases (case_id) ON DELETE RESTRICT,
    CONSTRAINT decision_candidate_dates_unique
        UNIQUE (case_id, case_version, candidate_date)
);

CREATE INDEX decision_candidate_dates_case_version_idx
    ON decision_candidate_dates (case_id, case_version);

CREATE TABLE decision_comparisons (
    comparison_id uuid NOT NULL,
    case_id uuid NOT NULL,
    case_version integer NOT NULL,
    evaluation_id uuid NOT NULL,
    ranking jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT decision_comparisons_pkey PRIMARY KEY (comparison_id),
    CONSTRAINT decision_comparisons_case_id_fkey
        FOREIGN KEY (case_id) REFERENCES decision_cases (case_id) ON DELETE RESTRICT,
    CONSTRAINT decision_comparisons_case_version_fkey
        FOREIGN KEY (case_id, case_version)
        REFERENCES decision_versions (case_id, version) ON DELETE RESTRICT,
    CONSTRAINT decision_comparisons_evaluation_id_fkey
        FOREIGN KEY (evaluation_id) REFERENCES decision_evaluations (evaluation_id)
        ON DELETE RESTRICT
);

CREATE INDEX decision_comparisons_case_created_idx
    ON decision_comparisons (case_id, created_at DESC);

CREATE TABLE decision_comparison_ranks (
    comparison_id uuid NOT NULL,
    candidate_date_id uuid NOT NULL,
    rank integer NOT NULL,
    score double precision NOT NULL,
    band text NOT NULL,
    CONSTRAINT decision_comparison_ranks_pkey
        PRIMARY KEY (comparison_id, candidate_date_id),
    CONSTRAINT decision_comparison_ranks_comparison_id_fkey
        FOREIGN KEY (comparison_id) REFERENCES decision_comparisons (comparison_id)
        ON DELETE RESTRICT,
    CONSTRAINT decision_comparison_ranks_candidate_date_id_fkey
        FOREIGN KEY (candidate_date_id) REFERENCES decision_candidate_dates (candidate_date_id)
        ON DELETE RESTRICT,
    CONSTRAINT decision_comparison_ranks_rank_check CHECK (rank >= 1),
    CONSTRAINT decision_comparison_ranks_rank_unique UNIQUE (comparison_id, rank)
);

CREATE TABLE decision_history_events (
    history_id uuid NOT NULL,
    case_id uuid NOT NULL,
    at timestamptz NOT NULL DEFAULT now(),
    actor text NOT NULL,
    event text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    from_state text NULL,
    to_state text NULL,
    case_version integer NULL,
    CONSTRAINT decision_history_events_pkey PRIMARY KEY (history_id),
    CONSTRAINT decision_history_events_case_id_fkey
        FOREIGN KEY (case_id) REFERENCES decision_cases (case_id) ON DELETE RESTRICT,
    CONSTRAINT decision_history_events_event_check CHECK (
        event IN (
            'case_created',
            'state_transition',
            'intake_updated',
            'evidence_bound',
            'evaluation_created',
            'comparison_saved',
            'case_completed',
            'case_archived'
        )
    ),
    CONSTRAINT decision_history_events_state_transition_pair_check CHECK (
        (
            event = 'state_transition'
            AND from_state IS NOT NULL
            AND to_state IS NOT NULL
            AND from_state IN (
                'draft', 'intake', 'evidence_ready', 'evaluated', 'compared',
                'planned', 'scheduled', 'executing', 'completed', 'reflected',
                'archived', 'paused', 'superseded', 'rejected'
            )
            AND to_state IN (
                'draft', 'intake', 'evidence_ready', 'evaluated', 'compared',
                'planned', 'scheduled', 'executing', 'completed', 'reflected',
                'archived', 'paused', 'superseded', 'rejected'
            )
        )
        OR (
            event <> 'state_transition'
        )
    )
);

CREATE INDEX decision_history_events_case_at_idx
    ON decision_history_events (case_id, at ASC);

-- Immutable protection for versions / evaluations / history.
CREATE OR REPLACE FUNCTION decision_immutable_update_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION '%: UPDATE is forbidden', TG_TABLE_NAME;
END;
$$;

CREATE OR REPLACE FUNCTION decision_immutable_delete_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION '%: DELETE is forbidden', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER decision_versions_update_guard
    BEFORE UPDATE ON decision_versions
    FOR EACH ROW EXECUTE PROCEDURE decision_immutable_update_guard_fn();

CREATE TRIGGER decision_versions_delete_guard
    BEFORE DELETE ON decision_versions
    FOR EACH ROW EXECUTE PROCEDURE decision_immutable_delete_guard_fn();

CREATE TRIGGER decision_evaluations_update_guard
    BEFORE UPDATE ON decision_evaluations
    FOR EACH ROW EXECUTE PROCEDURE decision_immutable_update_guard_fn();

CREATE TRIGGER decision_evaluations_delete_guard
    BEFORE DELETE ON decision_evaluations
    FOR EACH ROW EXECUTE PROCEDURE decision_immutable_delete_guard_fn();

CREATE TRIGGER decision_history_events_update_guard
    BEFORE UPDATE ON decision_history_events
    FOR EACH ROW EXECUTE PROCEDURE decision_immutable_update_guard_fn();

CREATE TRIGGER decision_history_events_delete_guard
    BEFORE DELETE ON decision_history_events
    FOR EACH ROW EXECUTE PROCEDURE decision_immutable_delete_guard_fn();
