-- FIND vertical: decision_findings resource + found lifecycle mode/state.

ALTER TABLE decision_cases
    DROP CONSTRAINT decision_cases_state_check;

ALTER TABLE decision_cases
    ADD CONSTRAINT decision_cases_state_check CHECK (
        state IN (
            'draft', 'intake', 'evidence_ready', 'evaluated', 'compared', 'found',
            'planned', 'scheduled', 'executing', 'completed', 'reflected',
            'archived', 'paused', 'superseded', 'rejected'
        )
    );

ALTER TABLE decision_cases
    DROP CONSTRAINT decision_cases_mode_check;

ALTER TABLE decision_cases
    ADD CONSTRAINT decision_cases_mode_check CHECK (
        mode IN ('none', 'evaluate_date', 'compare_dates', 'find_dates')
    );

ALTER TABLE decision_cases
    DROP CONSTRAINT decision_cases_paused_prior_state_check;

ALTER TABLE decision_cases
    ADD CONSTRAINT decision_cases_paused_prior_state_check CHECK (
        (
            state = 'paused'
            AND paused_prior_state IS NOT NULL
            AND paused_prior_state IN (
                'draft', 'intake', 'evidence_ready', 'evaluated', 'compared', 'found',
                'planned', 'scheduled', 'executing', 'completed', 'reflected'
            )
        )
        OR (
            state <> 'paused'
            AND paused_prior_state IS NULL
        )
    );

ALTER TABLE decision_versions
    DROP CONSTRAINT decision_versions_mode_check;

ALTER TABLE decision_versions
    ADD CONSTRAINT decision_versions_mode_check CHECK (
        mode IN ('none', 'evaluate_date', 'compare_dates', 'find_dates')
    );

ALTER TABLE decision_history_events
    DROP CONSTRAINT decision_history_events_event_check;

ALTER TABLE decision_history_events
    ADD CONSTRAINT decision_history_events_event_check CHECK (
        event IN (
            'case_created',
            'state_transition',
            'intake_updated',
            'evidence_bound',
            'evaluation_created',
            'comparison_saved',
            'finding_saved',
            'case_completed',
            'case_archived'
        )
    );

ALTER TABLE decision_history_events
    DROP CONSTRAINT decision_history_events_state_transition_pair_check;

ALTER TABLE decision_history_events
    ADD CONSTRAINT decision_history_events_state_transition_pair_check CHECK (
        (
            event = 'state_transition'
            AND from_state IS NOT NULL
            AND to_state IS NOT NULL
            AND from_state IN (
                'draft', 'intake', 'evidence_ready', 'evaluated', 'compared', 'found',
                'planned', 'scheduled', 'executing', 'completed', 'reflected',
                'archived', 'paused', 'superseded', 'rejected'
            )
            AND to_state IN (
                'draft', 'intake', 'evidence_ready', 'evaluated', 'compared', 'found',
                'planned', 'scheduled', 'executing', 'completed', 'reflected',
                'archived', 'paused', 'superseded', 'rejected'
            )
        )
        OR (
            event <> 'state_transition'
        )
    );

CREATE TABLE decision_findings (
    finding_id uuid NOT NULL,
    case_id uuid NOT NULL,
    case_version integer NOT NULL,
    finding_version integer NOT NULL,
    package_contract_version text NOT NULL,
    package jsonb NOT NULL,
    engine_id text NOT NULL,
    dq_status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT decision_findings_pkey PRIMARY KEY (finding_id),
    CONSTRAINT decision_findings_case_version_fkey
        FOREIGN KEY (case_id, case_version)
        REFERENCES decision_versions (case_id, version) ON DELETE RESTRICT,
    CONSTRAINT decision_findings_case_id_fkey
        FOREIGN KEY (case_id) REFERENCES decision_cases (case_id) ON DELETE RESTRICT,
    CONSTRAINT decision_findings_finding_version_check CHECK (
        finding_version >= 1
    ),
    CONSTRAINT decision_findings_dq_status_check CHECK (
        dq_status IN ('pass', 'blocked')
    ),
    CONSTRAINT decision_findings_case_finding_version_key
        UNIQUE (case_id, finding_version)
);

CREATE INDEX decision_findings_case_finding_version_idx
    ON decision_findings (case_id, finding_version DESC);

CREATE INDEX decision_findings_case_created_idx
    ON decision_findings (case_id, created_at DESC);
