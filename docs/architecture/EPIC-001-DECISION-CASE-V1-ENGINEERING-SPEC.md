# EPIC-001 — Decision Case v1 Engineering Execution Specification

| Field | Value |
|-------|-------|
| **Epic** | EPIC-001 Decision Case v1 |
| **Version** | 1.0.0 |
| **Status** | **IMPLEMENTATION AUTHORIZED** — EG-01/02/03 resolved (DEC-0016/0017/0018) |
| **Date** | 2026-08-04 |
| **Document type** | Engineering execution specification — **not** architecture redesign |
| **Authority** | Product Constitution (LOCKED) · PDOS Blueprint (LOCKED) · ACR-0001 (RATIFIED) · ADR-0014 (RATIFIED). Decision Quality Standard remains a draft/future artifact and is not a committed repository-baseline authority. |
| **Coding authorization** | Granted for this epic’s task list only |

---

## 0. Mandate

### 0.1 Objective

Implement the first production-ready **Decision Case** system — the only System of Record for decision work.

### 0.2 Success definition (exact lifecycle)

```
User creates a Decision Case
  → Adaptive Intake completes
  → Decision Engine evaluates
  → Decision Evaluation Package is produced
  → User compares dates (if applicable)
  → Decision is stored
  → Decision History records versions
```

Nothing more ships in EPIC-001.

### 0.3 Locked authorities (do not change)

| Artifact | Status |
|----------|--------|
| Product Constitution | LOCKED |
| Decision OS Blueprint | LOCKED |
| ACR-0001 | RATIFIED |
| ADR-0014 | RATIFIED |
| Decision Case ownership | Immutable — Case is sole SoR |
| One evaluation pathway | Case → Decision Intelligence Engine → Package |
| LLM role | May fill text fields after deterministic stance; never owns decisions |

### 0.4 Out of scope (forbidden in this epic)

Voice · Agents · Marketplace · Enterprise · Portfolio · Decision Graph UI · Collaboration · Billing · Advanced Learning · Scenario/Decision Marketplace · Find Best Window · planned/scheduled/executing/reflected states · parallel evaluation engines · new architectural abstractions.

### 0.5 Compatibility note (required, not future work)

ADR-0006 / ADR-0007 wire shapes may receive **lossy projections** from `DecisionEvaluationPackage` during dual-write. They are not SoR. Conversation remains transport. Ask remains intake surface into Cases.

### 0.6 Naming collision

Repository already contains **EPIC-01 Identity Domain**. This epic is **EPIC-001 Decision Case v1**. Do not merge them.

---

## Part 1 — Decision Case Domain Model

### 1.1 Aggregate root

**`DecisionCase`** is the aggregate root and sole system of record.

All writes that change decision meaning go through the Case aggregate. Presentation caches are not authoritative.

### 1.2 Entities and value objects

#### DecisionCase (root)

| Field | Type | Notes |
|-------|------|-------|
| `case_id` | UUID | Stable identity |
| `owner_subject_id` | string | Authenticated or guest principal ref (identity domain owns meaning of subject) |
| `decision_type_id` | string | From v1 type registry |
| `family_id` | string | Derived from type; stored denormalized for queries |
| `title` | string | User-visible label |
| `state` | DecisionState | See Part 5 |
| `mode` | `evaluate_date` \| `compare_dates` \| `none` | Date intelligence mode; `none` until timing selected |
| `precision_level` | `L1`…`L7` | From available inputs |
| `created_at` / `updated_at` | datetime | |
| `schema_version` | string | Case body schema, start `"1.0.0"` |

#### DecisionVersion

Immutable snapshot of Case mutable body at a point in time (intake answers, constraints, mode). Not the same as Evaluation version.

| Field | Type |
|-------|------|
| `case_id` | UUID |
| `version` | monotonic int ≥ 1 |
| `intake` | IntakeSnapshot |
| `constraints` | ConstraintSet |
| `mode` | mode enum |
| `created_at` | datetime |
| `reason` | `create` \| `intake_update` \| `mode_change` |

#### DecisionEvaluation

Immutable evaluation artifact bound to a Case + CaseVersion.

| Field | Type |
|-------|------|
| `evaluation_id` | UUID |
| `case_id` | UUID |
| `case_version` | int |
| `evaluation_version` | monotonic int ≥ 1 per case |
| `package` | DecisionEvaluationPackage |
| `created_at` | datetime |
| `engine_id` | string | e.g. `die-v1` |
| `dq_status` | `pass` \| `blocked` | DQS hard-gate result |

#### DecisionEvidence

Binding of evidence refs to a Case (and optionally to an evaluation).

| Field | Type |
|-------|------|
| `evidence_binding_id` | UUID |
| `case_id` | UUID |
| `framework_id` | string | Must exist in Evidence Registry or `provisional` allow-list |
| `eligibility` | `supported` \| `partial` \| `unknown` \| `unavailable` \| `provisional` \| `rejected` |
| `artifact_ref` | string | Opaque ref to artifact payload |
| `limits` | string[] | Declared limits |
| `bound_at` | datetime |

#### DecisionParticipant

| Field | Type |
|-------|------|
| `participant_id` | UUID |
| `case_id` | UUID |
| `person_ref` | string | Pointer to People/profile store; not embedded PII dump |
| `role` | `subject` \| `partner` \| `counterparty` \| `other` |

#### DecisionTimeline

Derived read model (not a write authority).

| Field | Type |
|-------|------|
| `case_id` | UUID |
| `entries` | TimelineEntry[] | dates under evaluate/compare, evaluation timestamps, state transitions |

#### DecisionHistory

Append-only log of Case events.

| Field | Type |
|-------|------|
| `history_id` | UUID |
| `case_id` | UUID |
| `at` | datetime |
| `actor` | subject id or `system` |
| `event` | HistoryEventType |
| `payload` | JSON (non-mutating summary) |

`HistoryEventType`: `case_created` \| `state_transition` \| `intake_updated` \| `evidence_bound` \| `evaluation_created` \| `comparison_saved` \| `case_completed` \| `case_archived`

#### DecisionState

See Part 5. Stored on Case root only.

### 1.3 Relationships

```
DecisionCase 1──* DecisionVersion
DecisionCase 1──* DecisionEvaluation
DecisionCase 1──* DecisionEvidence
DecisionCase 1──* DecisionParticipant
DecisionCase 1──* DecisionHistory
DecisionCase 1──1 DecisionTimeline (derived)
DecisionEvaluation *──1 DecisionVersion (evaluates that version)
```

### 1.4 Ownership

| Concern | Owner |
|---------|-------|
| Case lifecycle + persistence | Decision Case Repository (API domain) |
| Evaluation production | Decision Intelligence Engine only |
| Intake schema | Decision Type registry (read-only config) |
| Presentation | Web/Ask clients (read Case + Package) |
| Conversation text | Transport only — must not write Case stance |

### 1.5 Aggregate boundaries

- **Inside aggregate:** Case, Versions, Evaluations, Evidence bindings, Participants, History.
- **Outside:** Birth profile store, People directory, Conversation transcripts, CMG MemoryRecord, Question Library (legacy), scoring internals of `astro_engine`.
- Engine is invoked with an **invocation view** derived from Case; engine does not own Case rows.

### 1.6 Invariants (INV)

| ID | Invariant |
|----|-----------|
| INV-1 | Every decision-bearing recommendation row is a `DecisionEvaluation.package` under a Case |
| INV-2 | Evaluations are immutable after insert |
| INV-3 | History is append-only |
| INV-4 | State transitions must match Part 5 table |
| INV-5 | Evaluation forbidden unless state is `evidence_ready` (or re-eval rules in Part 5) |
| INV-6 | Required intake incomplete ⇒ cannot enter `evidence_ready` |
| INV-7 | Package MUST validate against Contract v1 schema |
| INV-8 | Stance MUST exist before any generative text fill |
| INV-9 | `eligibility=rejected\|unknown` evidence MUST NOT support claims marked supported |
| INV-10 | Compare mode requires ≥2 candidate dates |
| INV-11 | `case_version` on evaluation MUST reference an existing DecisionVersion |
| INV-12 | No second write path may set `package.recommendation.stance` |

### 1.7 Lifecycle summary

Create (`draft`) → Intake → `evidence_ready` → Evaluate → `evaluated` → optional Compare → `compared` → `completed` → `archived`.

---

## Part 2 — Decision Intake

### 2.1 Principles

- Schema-driven. **No free-form-first UX** as the primary path.
- Free text may only **classify into** a `decision_type_id`, then intake form runs.
- Max **7** questions before first evaluation attempt.
- Ask surface = intake into Cases (ADR-0014).

### 2.2 Decision Type record (v1 registry)

Each type in `decision_types.v1.json` (or equivalent module) defines:

| Field | Required |
|-------|----------|
| `decision_type_id` | yes |
| `family_id` | yes |
| `label` | yes |
| `required_inputs` | yes — slot ids |
| `optional_inputs` | yes — slot ids |
| `missing_information_policy` | yes — per slot: `blocker` \| `soft_gap` \| `irrelevant` |
| `follow_up_rules` | yes — branching predicates → next slot ids |
| `completion_rules` | yes — when intake may mark complete |
| `allowed_modes` | yes — subset of `evaluate_date`, `compare_dates` |
| `driver_weight_overrides` | optional |

### 2.3 Slot kinds (v1 closed set)

`date` · `date_list` · `enum` · `string_short` · `boolean` · `urgency` · `person_ref`

No open plugin slot system in EPIC-001.

### 2.4 Completion rules

Intake is **complete** when:

1. All `blocker` required slots have values; AND
2. Soft gaps are either filled or explicitly skipped with recorded penalty intent; AND
3. `completion_rules` predicates pass.

On complete → transition `intake` → `evidence_ready` (after evidence bind step in engine prep).

### 2.5 v1 type seed (minimal — not product expansion)

Ship **exactly 3** types to prove lifecycle (registry may grow later under separate epic):

| decision_type_id | family_id | allowed_modes |
|------------------|-----------|---------------|
| `tim-compare-three` | `timing_opt` | `compare_dates` |
| `car-interview` | `visibility` | `evaluate_date` |
| `mar-wedding-date` | `timing_opt` | `evaluate_date`, `compare_dates` |

These IDs already exist in the Decision Library seed catalog. EPIC-001 does not invent new decision concepts.

### 2.6 Intake API (logical)

| Op | Behavior |
|----|----------|
| `POST /cases` | Create Case `draft`, set type |
| `POST /cases/{id}/intake/answers` | Upsert slot; may advance follow-ups |
| `POST /cases/{id}/intake/complete` | Validate completion_rules; → `intake` then `evidence_ready` or 400 |
| `GET /cases/{id}/intake` | Current snapshot + next slots |

---

## Part 3 — Decision Evaluation Package v1

### 3.1 Normative contract

Package = ACR-0001 **`DecisionEvaluationPackage` v1** module IDs.
Part 3 human names map as follows. **No modules beyond ACR. No aliases.**

| Human label (this epic) | Module ID |
|-------------------------|-----------|
| Recommendation | `recommendation` |
| Timing Assessment | `timing` |
| Confidence | `confidence` |
| Decision Drivers | `drivers` |
| Risks | `risks` |
| Trade-offs | `tradeoffs` |
| Opportunities | `opportunities` |
| Action Plan | `action_plan` |
| Explanation | `explainability` |
| Improve Accuracy | `improve_accuracy` |
| Related Decisions | `related_decisions` |
| Evaluation Metadata | **Envelope** (not a content module) |

ACR modules also required:

| Module ID | EPIC-001 rule |
|-----------|---------------|
| `evidence` | Always present; list bindings + eligibility |
| `counter_recommendation` | Always present; distinct from primary or explicit `none_with_reason` for `insufficient_data` |
| `next_decisions` | Always present; may be `[]` |

### 3.2 Envelope (Evaluation Metadata)

| Field | Type |
|-------|------|
| `case_id` | UUID |
| `evaluation_id` | UUID |
| `evaluation_version` | int |
| `case_version` | int |
| `decision_type_id` | string |
| `family_id` | string |
| `mode` | mode enum |
| `precision_level` | L1–L7 |
| `engine_id` | string |
| `created_at` | datetime |
| `schema_version` | `"1.0.0"` |

### 3.3 Content schemas (normative minimum)

#### `recommendation`
```
stance: proceed | proceed_with_conditions | wait | prefer_alternate | insufficient_data
conditions: string[]  // max 5
summary: string       // ≤ 60 words
```

#### `timing`
```
material: boolean
band: high | moderate | low | na
score: number | null    // 0–100 relative favorability when material
candidates: { date: string, rank: int, score: number, band: string }[]  // compare mode
notes: string           // ≤ 40 words
```
For `evaluate_date`: exactly one candidate. For `compare_dates`: ≥2 ranked candidates. If `material=false`, band=`na`.

#### `confidence`
```
value: number           // 0–100
precision_level: L1–L7
penalties: { code: string, message: string }[]
```

#### `evidence`
```
items: { framework_id, eligibility, artifact_ref, limits: string[] }[]
```

#### `drivers`
```
items: { id: string, label: string, score: number, band: string, support: string, friction: string }[]
```

#### `tradeoffs` / `risks` / `opportunities`
```
items: string[]  // max 3 each; tradeoffs as "gain — cost" pairs
```

#### `action_plan`
```
steps: { order: int, action: string, condition: string | null }[]  // 1–7
```

#### `counter_recommendation`
```
stance: <same enum>
summary: string
reason: string
```

#### `explainability`
```
why: string
why_not: string
assumptions: string[]
limits: string[]
```

#### `improve_accuracy`
```
items: string[]  // max 5
```

#### `next_decisions` / `related_decisions`
```
items: { decision_type_id: string, label: string }[]
```

### 3.4 Immutability

Once persisted, package bytes are immutable. Corrections = new `evaluation_version`.

### 3.5 Deterministic vs generative

| Produced deterministically | May be language-assisted after stance exists |
|----------------------------|-----------------------------------------------|
| stance, timing scores/ranks, confidence value/penalties, driver scores, evidence eligibility | summary text, explainability prose, action step phrasing |

If deterministic core missing → **fail closed** (no package persist).

---

## Part 4 — Decision Repository

### 4.1 Persistence

- **Canonical store:** PostgreSQL (API domain), consistent with platform Domain Authority pattern.
- **Tables (logical):** `decision_cases`, `decision_versions`, `decision_evaluations`, `decision_evidence_bindings`, `decision_participants`, `decision_history_events`.
- Timeline is a **read projection** (query), not a table required in v1 if derivable.

### 4.2 Versioning

| Stream | Monotonic key |
|--------|---------------|
| Case body | `DecisionVersion.version` |
| Evaluations | `DecisionEvaluation.evaluation_version` per `case_id` |

Never update package JSON in place.

### 4.3 History

Every state transition and evaluation insert writes `DecisionHistory` event in the same transaction as the state/eval write.

### 4.4 Write operations

| Op | Effect | Guards |
|----|--------|--------|
| `create_case` | Insert Case `draft` + Version 1 + history | Valid `decision_type_id` |
| `update_intake` | New DecisionVersion; state `draft` or `intake` | Not archived/completed |
| `complete_intake` | State → `evidence_ready` | Completion rules |
| `bind_evidence` | Upsert evidence rows | Known eligibility |
| `create_evaluation` | Insert immutable evaluation; state → `evaluated` | State `evidence_ready` or re-eval allowed; DQS pass |
| `save_comparison` | Persist compare artifact in latest package or eval; state → `compared` | Mode `compare_dates`; ≥2 dates |
| `complete_case` | State → `completed` | State `evaluated` or `compared` |
| `archive_case` | State → `archived` | State `completed` |

### 4.5 Read operations

| Op | Returns |
|----|---------|
| `get_case` | Case + current version + state |
| `list_cases` | Owner’s cases (filters: state) |
| `get_evaluation` | Package by evaluation_id |
| `list_evaluations` | Versions for case (newest first) |
| `get_history` | Append-only events |
| `get_timeline` | Derived dates + eval markers |

### 4.6 Repository invariants

| ID | Rule |
|----|------|
| R-INV-1 | No orphan evaluations |
| R-INV-2 | History insert required with every state change |
| R-INV-3 | Soft-delete forbidden for evaluations; archive Case instead |
| R-INV-4 | Owner isolation on all reads/writes |
| R-INV-5 | Transactions: state+history(+eval) atomic |

---

## Part 5 — Decision State Machine (EPIC-001)

**Governance:** EPIC-001 is a **Lifecycle Activation Profile** ([LAP-001](../governance/EPIC-001-LIFECYCLE-ACTIVATION-PROFILE.md)). Canonical lifecycle authority remains **ACR-0001 §B4**. This section describes user/API commands and `activation_phase` ergonomics — not a second lifecycle.

### 5.1 System of Record states

`DecisionCase.state` MUST be an ACR-0001 state. Full ACR enum remains valid in persistence and history.

### 5.2 Activation phase (derived only — not SoR)

Informational projection after composites settle:

```
draft → intake → evidence_ready → evaluated → compared → completed → archived
```

Clients MUST NOT write `activation_phase` as Case state.

### 5.3 User/API-triggered transitions

| From | To | Trigger | Guard |
|------|----|---------|-------|
| — | draft | `create_case` | Valid type |
| draft | intake | first intake answer | — |
| intake | intake | further answers | — |
| intake | evidence_ready | `complete_intake` + evidence bind OK | Blockers satisfied |
| evidence_ready | evaluated | `create_evaluation` success | Package schema + DQS hard gates |
| evaluated | evaluated | re-evaluate | New case_version or explicit re-run; appends eval version |
| evaluated | compared | `save_comparison` | `mode=compare_dates` |
| compared | compared | new comparison eval | Same as re-eval |
| evaluated or compared | completed | `complete_case` | **Composite LAP-001 §2.4** (not a single ACR edge) |
| completed | archived | `archive_case` | **Composite LAP-001 §2.5** (not a single ACR edge) |

**Completion composite (mandatory):** `planned` → skip `scheduled` → `executing` → `completed`, each with history events, atomic.
**Archive composite (mandatory):** `reflected` → `archived`, each with history events, atomic.

### 5.4 Compare skip

If mode is `evaluate_date` only, Case may omit `compared` before the completion composite (ACR-optional skip of `compared`).

**Illegal:** skip intake; evaluate from `draft`; archive without reaching ACR `completed` via composite; invent stance in client; persist non-ACR state values.

---

## Part 6 — Date Intelligence (EPIC-001 only)

### 6.1 Supported modes

| Mode | Behavior |
|------|----------|
| **Evaluate Date** | Single target date → timing band/score + stance |
| **Compare Dates** | 2–5 dates → deterministic ranking by timing score then driver tie-break |

### 6.2 Not included

Find Best Window · Calendar Scan · Simulation · Find Best Dates search.

### 6.3 Ranking consistency

Given identical CaseVersion + identical candidate set + identical evidence bindings, Compare Dates **must** produce identical ranks (deterministic). Test vector required (Part 8).

### 6.4 Signal source

Timing scores come from existing registered/provisional timing pipeline (`astro_engine` / pathfinder timing) as **evidence/signal**, not as a parallel recommender. Stance still formed by DIE recommendation rules on Case.

---

## Part 7 — Output Contract & DQS

### 7.1 Rule

Every persisted evaluation **must** satisfy DQS hard gates (G1–G10) against Contract v1.
No output outside the contract may be shown as a Decision Evaluation.

### 7.2 Fail closed

| Condition | Result |
|-----------|--------|
| Schema invalid | Do not persist; Case stays `evidence_ready` |
| DQS hard-block failure mode | Do not persist |
| Stance missing | Do not persist |
| Compare without ranks | Do not persist |

### 7.3 DES

Compute DES for observability; ship gate remains hard gates + critical dimensions ≥ 3 + DES ≥ 70 per DQS. Store `dq_status` on evaluation row.

---

## Part 8 — Engineering Acceptance Criteria

Objective checks. All must pass for EPIC-001 done.

| ID | Criterion |
|----|-----------|
| AC-01 | Decision Case can be created with valid `decision_type_id` → state `draft` |
| AC-02 | Unknown `decision_type_id` → rejected |
| AC-03 | Required intake blockers prevent `evidence_ready` |
| AC-04 | Soft-gap skip records penalty-capable missing info |
| AC-05 | Evaluation cannot run from `draft` or incomplete intake |
| AC-06 | Successful evaluation persists immutable `DecisionEvaluationPackage` |
| AC-07 | Package always validates against Contract v1 JSON schema |
| AC-08 | Evaluate Date returns single-candidate timing |
| AC-09 | Compare Dates ranks ≥2 dates; order stable across 10 repeated runs |
| AC-10 | Re-evaluation increments `evaluation_version`; prior package bytes unchanged |
| AC-11 | DecisionVersion history preserved on intake edits |
| AC-12 | Only legal state transitions succeed; illegal return 409 |
| AC-13 | History events exist for create, transition, evaluation |
| AC-14 | Repository get/list enforce owner isolation |
| AC-15 | Client cannot persist a stance without engine package (INV-12) |
| AC-16 | DQS hard-block package rejected |
| AC-17 | `evaluate_date` path can complete → archive without `compared` |
| AC-18 | `compare_dates` path can reach `compared` then `completed` → `archived` |
| AC-19 | Conversation/Ask transport cannot bypass Case repository write for decision-bearing UI after dual-write hook |
| AC-20 | LLM disabled / stubbed: deterministic core still produces valid package (text modules may use templates) |

---

## Part 9 — Testing Strategy

### 9.1 Unit tests

- Intake completion predicates
- State transition guard functions
- Package schema validators
- Confidence penalty calculators
- Compare rank sort purity

### 9.2 Domain tests

- INV-1…INV-12 as executable tests
- Family/type registry load + unknown type
- Eligibility state claim rules

### 9.3 Integration tests

- API create → intake → evaluate → complete → archive
- Compare path end-to-end
- DB transaction atomicity (state+history+eval)

### 9.4 Contract tests

- JSON Schema for `DecisionEvaluationPackage` `1.0.0`
- Fixture packages for each stance
- Projection mappers to ADR-0006 summary / ADR-0007 fields (lossy, optional)

### 9.5 State machine tests

- Exhaustive legal transition table
- Exhaustive illegal transition table (expect reject)

### 9.6 Repository tests

- Immutability of evaluation rows
- Owner isolation
- List pagination sanity
- Concurrent eval version monotonicity

### 9.7 Acceptance tests

- Map 1:1 to AC-01…AC-20
- Run in CI as gate for EPIC-001 merge

### 9.8 Tooling locations (expected)

| Layer | Location |
|-------|----------|
| API / domain | `apps/api` pytest |
| Engine | `packages/decision_engine` pytest |
| Web client adapters | `apps/web` vitest |
| Schemas | shared JSON Schema under `packages/decision_engine` or `apps/api` schemas |

---

## Part 10 — Implementation Plan (tasks)

Complexity: **S** &lt; 1d · **M** 1–3d · **L** 3–5d (one engineer).

### T01 — Package JSON Schema + TypeScript/Python models

| | |
|--|--|
| **Purpose** | Freeze Contract v1 in code |
| **Dependencies** | None |
| **Files** | `packages/decision_engine/schemas/decision_evaluation_package.v1.json`; `packages/decision_engine/package_models.py`; `apps/web/lib/decision-case/package-types.ts` |
| **Acceptance** | Schema validates golden fixtures; AC-07 unit |
| **Risk** | Drift from ACR module IDs — reject aliases |
| **Complexity** | M |

### T02 — Decision Type registry v1 (3 types)

| | |
|--|--|
| **Purpose** | Schema-driven intake config |
| **Dependencies** | T01 |
| **Files** | `packages/decision_engine/registry/decision_types.v1.json`; loader + tests |
| **Acceptance** | 3 types load; unknown type fails; AC-02 |
| **Risk** | Scope creep adding types — hard cap 3 in this epic |
| **Complexity** | S |

### T03 — State machine module

| | |
|--|--|
| **Purpose** | Pure transition function |
| **Dependencies** | None |
| **Files** | `packages/decision_engine/state_machine.py` (+ TS mirror if needed for client guards) |
| **Acceptance** | Legal/illegal tables green; AC-12 |
| **Risk** | Implementing ACR states not in EPIC-001 — forbidden |
| **Complexity** | S |

### T04 — PostgreSQL persistence + migrations

| | |
|--|--|
| **Purpose** | Case Repository tables |
| **Dependencies** | T03 |
| **Files** | `apps/api` migrations; repository module under `apps/api/src/.../decision_case/` |
| **Acceptance** | R-INV-1…5 tests; AC-11, AC-13, AC-14 |
| **Risk** | Using localStorage as SoR — rejected |
| **Complexity** | L |

### T05 — Repository write/read API

| | |
|--|--|
| **Purpose** | HTTP boundary for Case ops |
| **Dependencies** | T04 |
| **Files** | `apps/api` routes ` /api/v1/decision-cases/*` |
| **Acceptance** | AC-01, AC-03, AC-14 |
| **Risk** | Coupling to Conversation execute — keep separate |
| **Complexity** | M |

### T06 — Intake engine

| | |
|--|--|
| **Purpose** | Adaptive slot answering + completion |
| **Dependencies** | T02, T05 |
| **Files** | `apps/api/.../intake.py`; web intake components under `apps/web` decision-case intake |
| **Acceptance** | AC-03, AC-04; max 7 slots enforced |
| **Risk** | Free-text-first UX — forbidden as primary |
| **Complexity** | M |

### T07 — Evidence bind (provisional allow-list)

| | |
|--|--|
| **Purpose** | Bind timing/profile signals with eligibility |
| **Dependencies** | T05 |
| **Files** | evidence binder in API; provisional allow-list config |
| **Acceptance** | AC-05 path includes evidence_ready; INV-9 tests |
| **Risk** | Claiming `supported` without registry — use `provisional` until registered |
| **Complexity** | M |

### T08 — DIE evaluation core (deterministic)

| | |
|--|--|
| **Purpose** | Stance, timing, drivers, confidence without LLM ownership |
| **Dependencies** | T01, T03, T07 |
| **Files** | `packages/decision_engine/` extend beyond facade mapper; stop inventing parallel engines |
| **Acceptance** | AC-06, AC-08, AC-20 |
| **Risk** | Wrapping only ActivityScore summary as full package without drivers — fails DQS |
| **Complexity** | L |

### T09 — Compare Dates ranking

| | |
|--|--|
| **Purpose** | Deterministic multi-date rank |
| **Dependencies** | T08 |
| **Files** | `packages/decision_engine/compare_dates.py` |
| **Acceptance** | AC-09 |
| **Risk** | Non-deterministic floating noise — fix sort keys |
| **Complexity** | M |

### T10 — Package assembly + DQS gate

| | |
|--|--|
| **Purpose** | Assemble Contract v1; fail closed |
| **Dependencies** | T08, T09 |
| **Files** | assembler + `dq_gate.py`; template text fillers (non-LLM OK for v1) |
| **Acceptance** | AC-07, AC-16 |
| **Risk** | Shipping essays — enforce budgets |
| **Complexity** | M |

### T11 — Evaluate / Compare application services

| | |
|--|--|
| **Purpose** | Orchestrate Case → engine → persist eval |
| **Dependencies** | T05, T10 |
| **Files** | API application services |
| **Acceptance** | AC-05, AC-06, AC-17, AC-18 |
| **Risk** | Client-side stance — forbidden |
| **Complexity** | M |

### T12 — Web Decision Case intake + result workspace (minimal)

| | |
|--|--|
| **Purpose** | Primary UX path without chat-as-SoR |
| **Dependencies** | T06, T11 |
| **Files** | `apps/web/app/...` decision-case routes; `apps/web/lib/decision-case/*`; adapt Ask entry to create Case |
| **Acceptance** | Manual + AC-01…06; no chat thread as history SoR |
| **Risk** | Rebuilding Ask V3 chat metaphor — reject |
| **Complexity** | L |

### T13 — History + version list UI/API

| | |
|--|--|
| **Purpose** | Show immutable evaluation versions |
| **Dependencies** | T05, T11 |
| **Files** | history endpoints + minimal web list |
| **Acceptance** | AC-10, AC-11, AC-13 |
| **Risk** | Editable history — forbidden |
| **Complexity** | S |

### T14 — Dual-write projection adapters (compat)

| | |
|--|--|
| **Purpose** | M1 compat: project package → ADR-0006/0007 shapes without making them SoR |
| **Dependencies** | T11 |
| **Files** | `apps/api` / `apps/web` adapters; feature flag `decision_case_dual_write` |
| **Acceptance** | AC-19; projections marked non-authoritative in code comments/tests |
| **Risk** | UI reading projection as SoR — acceptance test forbids |
| **Complexity** | M |

### T15 — CI acceptance suite

| | |
|--|--|
| **Purpose** | Gate merge on AC-01…AC-20 |
| **Dependencies** | T01–T14 |
| **Files** | `apps/api/tests/acceptance/test_epic001_decision_case.py` (+ web as needed) |
| **Acceptance** | All AC green in CI |
| **Risk** | Flaky timing — pin clocks/seeds |
| **Complexity** | M |

### Task graph

```
T01 → T02 → T06
T01 → T08 → T09 → T10 → T11 → T12
T03 → T04 → T05 → T06
T05 → T07 → T08
T11 → T13
T11 → T14
T01…T14 → T15
```

---

## Quality Rules (enforcement)

1. Architecture / Constitution / ACR / ADR-0014 — **no edits that redesign**.
2. Decision Case ownership — **no bypass**.
3. LLM — **no stance ownership** (AC-20).
4. No parallel evaluation engines.
5. No new abstractions beyond this spec’s named entities.
6. Prefer deletion of dead Ask SoR paths over wrapping them.
7. Prefer deterministic ranking/templates over “smart” opaque text.
8. If a choice increases complexity without Decision Quality → **reject**.

---

## Definition of Done (EPIC-001)

- [ ] AC-01…AC-20 green in CI
- [ ] Three Decision Types intake → evaluate/compare → store → history
- [ ] Repository is PostgreSQL SoR
- [ ] Package schema `1.0.0` frozen
- [ ] State machine only EPIC-001 states
- [ ] No Find Best Window
- [ ] Dual-write projections optional but Case SoR mandatory for new UI path
- [ ] No architecture document redesign in the PR set

---

## Document control

| Change | Rule |
|--------|------|
| Field rename in package | Requires ACR amendment — out of epic |
| New Decision Type beyond 3 | Separate epic |
| New state | Forbidden in EPIC-001 |
| New date mode | Forbidden in EPIC-001 |

---

**End of EPIC-001 Engineering Execution Specification**
