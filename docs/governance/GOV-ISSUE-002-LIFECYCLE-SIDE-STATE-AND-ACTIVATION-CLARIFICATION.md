# GOV-ISSUE-002 — Lifecycle Side-State `*` and Activation-Phase Mapping

| Field | Value |
|-------|-------|
| **ID** | GOV-ISSUE-002 |
| **Status** | **CLOSED** |
| **Date** | 2026-08-04 |
| **Closed** | 2026-08-04 — Owner ratification DEC-0019 (Option A) |
| **Board** | METIORO Governance Clarification Board / Product Owner |
| **Blocks** | None (E3 authorized; E4 still gated on E3 PASS) |
| **Issues** | GOV-LC-01 … GOV-LC-04 — **resolved** |
| **Authority** | Clarifies ACR-0001 §B4.2–B4.3 and LAP-001 §2.6–§2.7 **without amending ACR text** |
| **Ratification vehicle** | DEC-0019 (**ACCEPTED**) + LAP-001 §2.9–§2.11 (**ACCEPTED**, binding) |

### Owner ratification note (Option A)

`activation_phase` is a derived projection. It does not validate, repair, or own lifecycle correctness. When `CaseState == paused` and `prior_active_state` is absent or invalid, `activation_phase()` **MUST** return `NO_ACTIVE_PHASE`. Resume, repository, state-machine, and persistence validation **MUST** continue to fail loudly.

---

## 1. Governance issue summary

E3 is blocked because ACR-0001 uses non-enumerable `*` for side-state entry, labels side states “terminal or parking” without assignment, leaves `prior active` undefined, and LAP-001 leaves `CaseState → activation_phase` incomplete for several ACR states.

This resolution enumerates the intended meaning of ACR §B4 side-state rows and completes LAP activation derivation. It does **not** add Case states, does **not** alter the main lifecycle, and does **not** amend ACR-0001 wording.

---

## 2. Current ambiguity

| ID | Ambiguity |
|----|-----------|
| GOV-LC-01 | Exact source set for `* → paused \| superseded \| rejected` |
| GOV-LC-02 | Semantics of `paused → prior active` |
| GOV-LC-03 | Which side states are terminal vs parking; archived terminality |
| GOV-LC-04 | Complete `CaseState → ActivationPhase` (or explicit no-phase) |

---

## 3. Canonical interpretation

### 3.1 Intent of ACR §B4.2 “terminal or parking”

| Classification | States | Meaning |
|----------------|--------|---------|
| **Parking** | `paused` | Temporary suspension; resume restores prior main-lifecycle state |
| **Terminal (side)** | `superseded`, `rejected` | Lifecycle ended by replacement or rejection; no further lifecycle transitions |
| **Terminal (main)** | `archived` | Happy-path end; no further lifecycle transitions |

This assignment follows from the only side-state *exit* in ACR §B4.3 (`paused → prior active`) and the role of `archived` as the final main-lifecycle state. It does not add edges.

### 3.2 Intent of ACR §B4.3 `*`

`*` means: **any non-terminal Case state that is a legal subject of that action**, enumerated below. It does **not** mean “every string in the state enum including terminals.” Terminal states have no outgoing lifecycle transitions.

### 3.3 Intent of LAP-001 §2.7

`activation_phase` remains the fixed vocabulary:

`draft` \| `intake` \| `evidence_ready` \| `evaluated` \| `compared` \| `completed` \| `archived`

Derivation must be total over all ACR Case states: each state maps to exactly one vocabulary value **or** explicit **`NO_ACTIVE_PHASE`** (not a Case state; not a new vocabulary member; means “do not expose a phase”).

---

## 4. Exact normative transition table (side states — enumerable)

### 4.0 Sets (normative)

```
MAIN_LIFECYCLE = {
  draft, intake, evidence_ready, evaluated, compared,
  planned, scheduled, executing, completed, reflected, archived
}

PAUSE_SOURCES = MAIN_LIFECYCLE \ {archived}
  = {
  draft, intake, evidence_ready, evaluated, compared,
  planned, scheduled, executing, completed, reflected
}

TERMINAL = {archived, superseded, rejected}

SUPERSEDE_REJECT_SOURCES = PAUSE_SOURCES ∪ {paused}
  = {
  draft, intake, evidence_ready, evaluated, compared,
  planned, scheduled, executing, completed, reflected, paused
}
```

Main-lifecycle edges in ACR §B4.3 (including LAP identity loops) are unchanged and out of scope for this issue’s *new* law; they remain as already ratified.

### 4.1 Pause

| Field | Normative value |
|-------|-----------------|
| **Trigger** | `pause` |
| **Guard** | User (or authorized actor) pause requested |
| **Target** | `paused` |
| **Allowed sources** | exactly `PAUSE_SOURCES` |
| **Forbidden sources** | `archived`, `paused`, `superseded`, `rejected` |
| **Records prior active?** | **Yes** — set `prior_active_state` := source state (must be ∈ `PAUSE_SOURCES`) |
| **Reversible?** | **Yes** — via resume (§5) |
| **Archived behavior** | Forbidden |
| **Side→side** | `paused → paused` forbidden; supersede/reject from `paused` allowed (§4.2–4.3) |

### 4.2 Supersede

| Field | Normative value |
|-------|-----------------|
| **Trigger** | `supersede` |
| **Guard** | New Case replaces / supersede requested |
| **Target** | `superseded` |
| **Allowed sources** | exactly `SUPERSEDE_REJECT_SOURCES` |
| **Forbidden sources** | `archived`, `superseded`, `rejected` |
| **Records prior active?** | **No** (not used for resume). History payload MAY record `from_state` |
| **Reversible?** | **No** |
| **Archived behavior** | Forbidden |
| **Side→side** | `paused → superseded` allowed; `superseded → *` lifecycle forbidden; `rejected → superseded` forbidden |

### 4.3 Reject

| Field | Normative value |
|-------|-----------------|
| **Trigger** | `reject` |
| **Guard** | User rejects Case |
| **Target** | `rejected` |
| **Allowed sources** | exactly `SUPERSEDE_REJECT_SOURCES` |
| **Forbidden sources** | `archived`, `superseded`, `rejected` |
| **Records prior active?** | **No** |
| **Reversible?** | **No** |
| **Archived behavior** | Forbidden |
| **Side→side** | `paused → rejected` allowed; `rejected → *` lifecycle forbidden; `superseded → rejected` forbidden |

### 4.4 Implementation law

No wildcard remains. Legal side edges are exactly the Cartesian expansions of §§4.1–4.3 over their allowed source sets, plus resume (§5).

---

## 5. Exact paused / resume rules

| Rule ID | Normative rule |
|---------|----------------|
| P-1 | `paused` is a **parking** state (not terminal). |
| P-2 | Only states in `PAUSE_SOURCES` may transition to `paused`. |
| P-3 | `prior_active_state` is **Case aggregate metadata** (not a Case state). Allowed values: exactly `PAUSE_SOURCES`. |
| P-4 | While `state = paused`, `prior_active_state` is **required** and MUST be ∈ `PAUSE_SOURCES`. |
| P-5 | While `state ≠ paused`, `prior_active_state` MUST be null/absent. |
| P-6 | Resume trigger: `resume`. Allowed only when `state = paused`. |
| P-7 | Resume target: **exactly** `prior_active_state` (no other target permitted). |
| P-8 | Resume validation: if `prior_active_state` is absent or ∉ `PAUSE_SOURCES`, resume **fails loudly**; Case remains `paused`. |
| P-9 | On successful resume: `state := prior_active_state`; then clear `prior_active_state` (set null). |
| P-10 | A Case **may** be paused again after resume; each pause overwrites `prior_active_state` with the new source. |
| P-11 | Pause/resume **do not erase** history: each transition appends history; clearing `prior_active_state` is current-row metadata only. |
| P-12 | Resume **must not** target `paused`, `superseded`, `rejected`, or `archived`. (Enforced because `prior_active_state` ∈ `PAUSE_SOURCES`.) |

---

## 6. Exact terminal-state rules

| State | Terminal? | Outgoing lifecycle transitions | Pause / supersede / reject as target from this state | History / metadata append |
|-------|-----------|--------------------------------|------------------------------------------------------|---------------------------|
| `archived` | **Yes** | **None** | **Forbidden** (cannot leave; cannot enter pause/supersede/reject from here) | **Allowed** (append-only audit; not a lifecycle transition) |
| `superseded` | **Yes** | **None** | N/A as source; cannot be paused/rejected/superseded again | **Allowed** |
| `rejected` | **Yes** | **None** | N/A as source; cannot be paused/superseded/rejected again | **Allowed** |
| `paused` | **No** (parking) | Resume; also supersede; reject | — | **Allowed** |

**Immutable history append ≠ lifecycle transition.** Terminality constrains `state` changes only.

---

## 7. Complete CaseState → ActivationPhase table

ActivationPhase vocabulary (**unchanged**):
`draft` \| `intake` \| `evidence_ready` \| `evaluated` \| `compared` \| `completed` \| `archived`

Derivation result is either one vocabulary value or **`NO_ACTIVE_PHASE`**.

| CaseState | Derived result | Rule |
|-----------|----------------|------|
| `draft` | `draft` | Identity |
| `intake` | `intake` | Identity |
| `evidence_ready` | `evidence_ready` | Identity |
| `evaluated` | `evaluated` | Identity |
| `compared` | `compared` | Identity |
| `planned` | `compared` if `mode = compare_dates`; else `evaluated` | Last EPIC-001 user-visible milestone before plan/execution region |
| `scheduled` | same as `planned` | Same |
| `executing` | same as `planned` | Same |
| `completed` | `completed` | Identity |
| `reflected` | `completed` | Reflection is post-completion, pre-archive; still completion region until `archived` |
| `archived` | `archived` | Identity |
| `paused` | `activation_phase(prior_active_state)` using this table | Preserves phase of parked main state; if `prior_active_state` invalid/absent → `NO_ACTIVE_PHASE` |
| `superseded` | `NO_ACTIVE_PHASE` | Terminal side; not in activation vocabulary |
| `rejected` | `NO_ACTIVE_PHASE` | Terminal side; not in activation vocabulary |

**Justification for `reflected → completed`:** Archive is a distinct activation phase. Reflection does not mean archived; ACR allows empty reflection on the path to archive. Exposing `completed` until `archived` matches LAP’s settled ergonomics.

**Determinism:** Uses only persisted `state`, `mode`, and (when `state=paused`) `prior_active_state`.

---

## 8. Required persisted metadata

| Field | Type | Rules |
|-------|------|-------|
| `prior_active_state` | ACR main state string or null | Required iff `state=paused`; value ∈ `PAUSE_SOURCES`; null otherwise |

No new Case state. `activation_phase` MUST NOT be persisted as SoR.

---

## 9. Documents to create

| Document | Role |
|----------|------|
| This file (`GOV-ISSUE-002-...`) | Issue + normative clarification body |
| DEC-0019 in Decision Log | Ratification record |

---

## 10. Documents to amend

| Document | Amendment |
|----------|-----------|
| `EPIC-001-LIFECYCLE-ACTIVATION-PROFILE.md` (LAP-001) | Add §2.9–§2.11 incorporating this clarification by reference |
| `EPIC-001-E3-TASK-SPEC.md` | Align side-state and activation sections with this resolution (subordinate correction; not architecture) |

**Do not amend:** Product Constitution, DQS, ADR-0014, DecisionEvaluationPackage, API contracts (beyond already-derived `activation_phase`).

---

## 11. Whether ACR-0001 requires amendment

**No.** ACR §B4.2–B4.3 text remains. This issue enumerates the meaning of `*`, “terminal or parking,” and “prior active” for implementation law under LAP/DEC.

---

## 12. Whether LAP-001 requires clarification

**Yes.** Add normative subsections for side-state enumeration, pause metadata, and total activation mapping (without expanding ActivationPhase vocabulary).

---

## 13. E3 implementation impact

**Authorized** under DEC-0019 (ACCEPTED):

- Implement enumerable side edges from §§4–6
- Implement resume with `prior_active_state` validation (fail loudly)
- Implement activation derivation from §7 (`NO_ACTIVE_PHASE` on invalid pause metadata — Option A)
- E3 remains pure (metadata field is a parameter/result concern for callers; machine validates resume target)

---

## 14. E4 implementation impact

- Persist `prior_active_state` on Case root with CHECK: null XOR (`state='paused'` AND value ∈ `PAUSE_SOURCES`)
- `state` CHECK still full ACR set
- No `activation_phase` column
- Terminal states: reject lifecycle transitions in repository via E3

---

**End of GOV-ISSUE-002**
