# PRG-03.3 — Pre-Benchmark Eligibility

**Document ID:** PRG-03.3  
**Title:** Pre-Benchmark Eligibility  
**Status:** IN REVIEW  
**Programme:** PRG-03 — Production News Provider Evaluation  
**Related:** PRG-03.2 Evidence Register; PRG-03.3A; PRG-03.4; PRG-03.5; PRG-03.6; ADR-0008  
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`  
**Date (UTC):** 2026-07-18  

---

## Document Control

| Field | Value |
| ----- | ----- |
| Document ID | PRG-03.3 |
| Version | 0.1.1 |
| Status | IN REVIEW |
| Classification | Governance — Eligibility Gate |
| Owner | PENDING RATIFICATION |
| Approver | PENDING RATIFICATION |
| Effective date (UTC) | PENDING RATIFICATION |
| Supersedes | 0.1.0 |
| Branch | governance-foundation |

This artifact SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. It MUST NOT be represented as `RATIFIED` or `LOCKED` before the corresponding governance steps have been completed.

---

## Purpose

This document defines the documentation-only eligibility stage that MUST be completed before any provider benchmark execution under PRG-03.

PRG-03.3 exists to ensure that legal, commercial, authentication, language-documentation, polling, caching, redistribution, attribution, and license conditions are evaluated from official evidence before any load is applied to a candidate provider.

---

## Scope

### In scope

- Pre-benchmark eligibility gates for candidate news providers evaluated under PRG-03.
- Decision states that determine whether benchmark execution is authorized.
- The eligibility matrix template used to record gate outcomes.
- The benchmark authorization rule that binds eligibility PASS to execution permission.

### Out of scope

- Benchmark execution, harness design, or threshold setting (PRG-03.3A, PRG-03.4).
- Recording of benchmark facts (PRG-03.5).
- Provider architecture selection or implementation authorization (PRG-03.6).
- Modification of frozen World contracts under ADR-0008.
- Production adapter implementation or provider-specific rollout.

---

## Relationship to PRG-03.2 Evidence Register

PRG-03.3 consumes evidence recorded in the PRG-03.2 Evidence Register (maintained in the Production News Provider Evaluation Record).

Rules:

1. Every eligibility gate determination MUST cite a corresponding Evidence Register entry or an explicitly recorded gap.
2. Absence of an Evidence Register entry for a gate SHALL be recorded as `NOT_EVALUATED`.
3. Ambiguous or incomplete official evidence SHALL be recorded as `UNKNOWN`.
4. PRG-03.3 MUST NOT invent evidence, infer permission from silence, or treat marketing claims as official documentation.
5. Completion of the Evidence Register is a precondition for any provider cell to reach eligibility `PASS`.

---

## Eligibility Gates

The following gates MUST be evaluated for each candidate provider before benchmark authorization:

| Gate ID | Gate | Requirement |
| ------- | ---- | ----------- |
| EG-01 | Authentication method documented | Official documentation records the authentication method required for production API access. |
| EG-02 | Commercial production access documented | Official documentation or terms record that commercial production access is available. |
| EG-03 | Pricing documented | Official pricing documentation is identified and recorded. |
| EG-04 | EN officially documented | Official documentation explicitly lists English / `en` (or equivalent). |
| EG-05 | AR officially documented | Official documentation explicitly lists Arabic / `ar` (or equivalent). |
| EG-06 | RU officially documented | Official documentation explicitly lists Russian / `ru` (or equivalent). |
| EG-07 | FA officially documented | Official documentation explicitly lists Persian, Farsi, `fa`, or an equivalent supported language identifier. |
| EG-08 | Automated polling permitted | Official terms or acceptable-use documentation permit automated polling. |
| EG-09 | Caching/storage permitted | Official terms permit caching or temporary storage required by METIORO World usage. |
| EG-10 | Redistribution/display restrictions verified | Redistribution and display restrictions are verified from official terms. |
| EG-11 | Attribution requirements verified | Attribution requirements are verified from official terms. |
| EG-12 | License compatible with METIORO World usage | License or terms are assessed as compatible with intended METIORO World usage. |

### Gate interpretation rules

- General claims such as “supports many languages” are insufficient for locale gates EG-04 through EG-07.
- Acceptance of an undocumented language parameter does not satisfy an official documentation gate.
- Automated polling and caching/storage are independent gates and MUST NOT be treated as implied by commercial access alone.
- Effective real-world Persian coverage remains a benchmark metric even when FA is officially documented (EG-07 PASS does not satisfy Effective FA Coverage under PRG-03.4).

---

## Decision States

Each gate, and the provider-level eligibility outcome, SHALL use exactly one of the following states:

| State | Meaning |
| ----- | ------- |
| PASS | Official evidence supports satisfaction of the gate. |
| FAIL | Official evidence demonstrates that the gate is not satisfied. |
| UNKNOWN | Evidence is ambiguous, incomplete, or unresolved; clarification is required. |
| NOT_EVALUATED | Evidence work for the gate has not been completed. |

### Binding rules

1. `FAIL` blocks benchmark for the affected provider.
2. `UNKNOWN` blocks benchmark for the affected provider until clarified.
3. `NOT_EVALUATED` means evidence work is incomplete and blocks benchmark for the affected provider.
4. Benchmark execution is prohibited before eligibility `PASS` for the provider under authorization.
5. `UNKNOWN` is not equivalent to permission.
6. Provider-level eligibility is `PASS` only when every required eligibility gate for the intended evaluation context is `PASS`.
7. Provider independence: Binding rules 1–3 apply per provider. A gate state of `FAIL`, `UNKNOWN`, or `NOT_EVALUATED` for one provider blocks benchmark authorization for that provider only. It MUST NOT block benchmark authorization for a different provider that independently satisfies the Benchmark Authorization Rule.

---

## Eligibility Matrix

The following matrix template SHALL be used to record provider eligibility. Cells MUST use only the decision states defined above, except where a free-text Reason is required.

| Provider | Auth | Commercial | Pricing | EN | AR | RU | FA | Polling | Caching | Redistribution | Attribution | License | Eligibility | Reason |
| -------- | ---- | ---------- | ------- | -- | -- | -- | -- | ------- | ------- | -------------- | ----------- | ------- | ----------- | ------ |
| PENDING RATIFICATION | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | NOT_EVALUATED | Evidence work incomplete |

Column mapping:

| Column | Gate |
| ------ | ---- |
| Auth | EG-01 Authentication method documented |
| Commercial | EG-02 Commercial production access documented |
| Pricing | EG-03 Pricing documented |
| EN | EG-04 EN officially documented |
| AR | EG-05 AR officially documented |
| RU | EG-06 RU officially documented |
| FA | EG-07 FA officially documented |
| Polling | EG-08 Automated polling permitted |
| Caching | EG-09 Caching/storage permitted |
| Redistribution | EG-10 Redistribution/display restrictions verified |
| Attribution | EG-11 Attribution requirements verified |
| License | EG-12 License compatible with METIORO World usage |
| Eligibility | Provider-level eligibility outcome |
| Reason | Concise justification or blocking condition |

---

## Benchmark Authorization Rule

Benchmark execution against a provider is authorized only when all of the following are true:

1. The PRG-03.2 Evidence Register entries required for that provider are complete for every eligibility gate in scope.
2. The provider’s Eligibility Matrix row records Eligibility = `PASS`.
3. No gate for that provider remains `FAIL`, `UNKNOWN`, or `NOT_EVALUATED`.
4. PRG-03.3A (Reference Load Profile) is ratified for the intended run, or the run is explicitly deferred until such ratification (see PRG-03.4 preconditions).
5. PRG-03.4 (Production Benchmark Definition) is ratified for the intended run.

Until Eligibility = `PASS` for that provider, benchmark execution against that provider MUST NOT proceed.

Unresolved `FAIL`, `UNKNOWN`, or `NOT_EVALUATED` gates on any other provider MUST NOT be treated as programme-wide authorization blockers for a provider that independently satisfies conditions 1–5.

`UNKNOWN` is not permission. Silence, incomplete review, or unverified assumptions MUST NOT be treated as authorization.

---

## Amendment and Versioning Rules

1. This document is version-controlled. Material changes require a new version identifier.
2. Changes to gate definitions, decision-state semantics, or the authorization rule require a formal amendment and re-ratification.
3. Completed Eligibility Matrix rows for a published evaluation context are immutable except by formal amendment that records the correction reason and superseding version.
4. No retroactive gate promotion is permitted. A newly introduced or tightened gate MUST NOT be applied retroactively to authorize or reject a prior benchmark run without a new eligibility determination and, where thresholds or gates affect benchmark outcomes, a new benchmark run under the amended framework.
5. Numeric production thresholds are out of scope for this document and MUST NOT be invented here.

---

## Ratification Checklist

Before this document may move from `IN REVIEW` to `RATIFIED`, the following MUST be confirmed:

- [ ] Document Control fields are complete except where explicitly marked PENDING RATIFICATION pending approver assignment.
- [ ] All twelve eligibility gates are defined and mapped to the Eligibility Matrix columns.
- [ ] Decision states `PASS`, `FAIL`, `UNKNOWN`, and `NOT_EVALUATED` are defined with binding block rules.
- [ ] Rule recorded: binding block rules apply per provider (provider independence).
- [ ] Relationship to the PRG-03.2 Evidence Register is explicit.
- [ ] Benchmark Authorization Rule prohibits execution before Eligibility = `PASS` for the provider under authorization.
- [ ] Rule recorded: unresolved gates on another provider MUST NOT programme-block an independently eligible provider.
- [ ] Rule recorded: `UNKNOWN` is not equivalent to permission.
- [ ] Rule recorded: Effective FA Coverage remains a benchmark metric even when FA is officially documented.
- [ ] No invented numeric thresholds appear in this document.
- [ ] No approval names have been invented.
- [ ] Owner and Approver identities are assigned by authorized governance process (PENDING RATIFICATION until assigned).

**Ratification status:** IN REVIEW  
**Ratified by:** PENDING RATIFICATION  
**Ratification date (UTC):** PENDING RATIFICATION  
