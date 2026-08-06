# EPIC-001 Lifecycle Activation Profile

| Field | Value |
|-------|-------|
| **ID** | LAP-001 |
| **Status** | **ACCEPTED** (including §2.9–§2.11 — **ACCEPTED and binding** per DEC-0019) |
| **Date** | 2026-08-04 |
| **Authority** | Subordinate to ACR-0001 §B4; does not amend ACR |
| **Resolves** | EG-01 (Engineering Governance Audit); GOV-LC-01…04 via GOV-ISSUE-002 **CLOSED** |
| **Board** | Governance Resolution Board / Governance Clarification Board / Product Owner |

---

## 1. Determination

EPIC-001 is **A — a legal Lifecycle Activation Profile**.

It is **not** a redefinition of the canonical lifecycle.

| Layer | Authority |
|-------|-----------|
| Canonical lifecycle (states + legal transitions) | **ACR-0001 §B4 only** |
| Which transitions are user-triggered vs system-auto in EPIC-001 | **This Activation Profile** |
| EPIC-001 Engineering Spec Part 5 | Must conform to this profile; descriptive UX shorthand must not replace SoR states |

---

## 2. Normative rules (exact)

### 2.1 Canonical lifecycle unchanged

The complete state set and transition table in ACR-0001 §B4.2–B4.3 remain the sole lifecycle authority.

No EPIC document may remove, rename, or replace ACR states:
`draft`, `intake`, `evidence_ready`, `evaluated`, `compared`, `planned`, `scheduled`, `executing`, `completed`, `reflected`, `archived`, `paused`, `superseded`, `rejected`.

### 2.2 Decision Case Repository stores only ACR states

`DecisionCase.state` MUST be an ACR state.
EPIC-001 MUST NOT introduce a parallel state enum as System of Record.

### 2.3 EPIC-001 activated user triggers

In EPIC-001, **user- or API-triggered** transitions are limited to:

| From | To | Trigger |
|------|----|---------|
| — | `draft` | `create_case` |
| `draft` | `intake` | first intake answer |
| `intake` | `intake` | further answers |
| `intake` | `evidence_ready` | `complete_intake` (+ evidence bind) |
| `evidence_ready` | `evaluated` | `create_evaluation` success |
| `evaluated` | `evaluated` | re-evaluation (new evaluation_version) |
| `evaluated` | `compared` | `save_comparison` when mode is `compare_dates` |
| `compared` | `compared` | new comparison evaluation |
| `evaluated` or `compared` | *(completion composite — §2.4)* | `complete_case` |
| `completed` | *(archive composite — §2.5)* | `archive_case` |

ACR-optional skip of `compared` remains: `evaluate_date` mode may omit `compared`.

ACR-optional skip of `scheduled` remains: EPIC-001 does not require scheduling.

### 2.4 Completion composite (preserves ACR path to `completed`)

When `complete_case` is invoked from `evaluated` or `compared`:

1. If current state is `evaluated` or `compared`, system MUST transition to `planned` (commit action plan from latest package; plan may be empty list only if package `action_plan.steps` is empty — still a commit record).
2. System MUST skip `scheduled` (ACR-optional).
3. System MUST transition `planned` → `executing`.
4. System MUST transition `executing` → `completed` (user declaration of completion is the trigger for the composite; completion remains user-declared, not invented by the engine).
5. Each step MUST append a `DecisionHistory` state_transition event with ACR `from`/`to`.
6. The composite is atomic: all history events commit with the final state `completed`, or none do.

**Normative meaning:** EPIC-001 does not legalize `evaluated → completed` as a single ACR edge. It authorizes a **composite user command** that executes the ACR path `evaluated|compared → planned → executing → completed` with `scheduled` skipped.

### 2.5 Archive composite (preserves ACR path to `archived`)

When `archive_case` is invoked from `completed`:

1. System MUST transition `completed` → `reflected` (reflection payload MAY be empty under ACR “empty reflection allowed”).
2. System MUST transition `reflected` → `archived`.
3. Each step MUST append history events.
4. Atomic with final state `archived`.

**Normative meaning:** EPIC-001 does not legalize `completed → archived` as a single ACR edge. It authorizes a composite that executes `completed → reflected → archived`.

### 2.6 Side states

`paused`, `superseded`, `rejected` remain canonical. EPIC-001 happy path does not require UI for them; Repository MUST accept them if written. No requirement to build UX for them in EPIC-001.

**Clarification (GOV-ISSUE-002 / DEC-0019):** Enumerable side-state law is defined in §2.9. ACR-0001 §B4.3 `*` MUST NOT remain as implementation wildcard.

### 2.7 API / UX shorthand

APIs and UI MAY expose an **informational** `activation_phase` for EPIC-001 ergonomics (`draft` | `intake` | `evidence_ready` | `evaluated` | `compared` | `completed` | `archived`) derived from ACR `state` after composites settle.

`activation_phase` is **not** System of Record. Clients MUST NOT write `activation_phase` as Case state.

**Clarification (GOV-ISSUE-002 / DEC-0019):** Total `CaseState →` derivation (including explicit `NO_ACTIVE_PHASE`) is defined in §2.11. Vocabulary above is unchanged.

### 2.8 Engineering Spec conformity

EPIC-001 Engineering Spec Part 5 and Implementation Plan §6.2 MUST be read as describing **user commands and activation_phase**, not as replacing ACR edges. Where those documents previously implied direct `evaluated→completed` or `completed→archived` SoR edges, **this profile supersedes that reading**.

### 2.9 Side-state transition enumeration (GOV-LC-01 / GOV-LC-03)

Normative detail: [GOV-ISSUE-002](./GOV-ISSUE-002-LIFECYCLE-SIDE-STATE-AND-ACTIVATION-CLARIFICATION.md) §§3–6.

| Classification | States |
|----------------|--------|
| Parking | `paused` |
| Terminal (side) | `superseded`, `rejected` |
| Terminal (main) | `archived` |

| Transition | Allowed sources (exact) | Forbidden sources | Records `prior_active_state` | Reversible |
|------------|-------------------------|-------------------|------------------------------|------------|
| `→ paused` | `draft`, `intake`, `evidence_ready`, `evaluated`, `compared`, `planned`, `scheduled`, `executing`, `completed`, `reflected` | `archived`, `paused`, `superseded`, `rejected` | Yes (= source) | Yes (resume) |
| `→ superseded` | pause sources ∪ `{paused}` | `archived`, `superseded`, `rejected` | No | No |
| `→ rejected` | pause sources ∪ `{paused}` | `archived`, `superseded`, `rejected` | No | No |

Side-state-to-side-state lifecycle: only `paused → superseded` and `paused → rejected` are legal. No transitions out of `superseded`, `rejected`, or `archived`. History append on terminal states remains allowed and is not a lifecycle transition.

### 2.10 Paused / resume semantics (GOV-LC-02)

Normative detail: GOV-ISSUE-002 §5.

1. `prior_active_state` is aggregate metadata, not a Case state.
2. Required and ∈ pause sources while `state = paused`; null otherwise.
3. Resume allowed only from `paused`; target is exactly `prior_active_state`.
4. Absent/invalid `prior_active_state` → resume fails loudly; state unchanged.
5. Successful resume restores that state and clears `prior_active_state`.
6. Re-pause after resume is allowed; history is append-only.

### 2.11 Complete activation-phase derivation (GOV-LC-04)

Normative detail: GOV-ISSUE-002 §7.

| CaseState | Result |
|-----------|--------|
| `draft` | `draft` |
| `intake` | `intake` |
| `evidence_ready` | `evidence_ready` |
| `evaluated` | `evaluated` |
| `compared` | `compared` |
| `planned` \| `scheduled` \| `executing` | `compared` if `mode = compare_dates`; else `evaluated` |
| `completed` | `completed` |
| `reflected` | `completed` |
| `archived` | `archived` |
| `paused` | derive from `prior_active_state` via this table; else `NO_ACTIVE_PHASE` |
| `superseded` \| `rejected` | `NO_ACTIVE_PHASE` |

`NO_ACTIVE_PHASE` is not an ActivationPhase vocabulary member and not a Case state.

**Owner Option A (DEC-0019):** `activation_phase` is a derived projection only. Invalid/absent `prior_active_state` while `paused` yields `NO_ACTIVE_PHASE` (does not fail loudly). Resume and other lifecycle validators remain fail-loudly.

---

## 3. Documents amended by this acceptance

| Document | Amendment |
|----------|-----------|
| EPIC-001 Engineering Spec Part 5 | Conform to §2 (composites + ACR SoR states) |
| EPIC-001 Implementation Plan §6.2 | Same |
| EPIC-001 Governance Audit EG-01 | Resolved by LAP-001 |
| GOV-ISSUE-002 | Side-state `*` enumeration + activation total map (DEC-0019) |

ACR-0001 text is **not** amended.

---

**End of LAP-001**
