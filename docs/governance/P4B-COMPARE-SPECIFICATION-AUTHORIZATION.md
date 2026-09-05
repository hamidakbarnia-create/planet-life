# P4B-COMPARE-SPEC — Compare Semantic Presentation Specification Authorization

> **Status:** PROPOSED
> **Version:** 0.1.0
> **Date:** 2026-09-05
> **Owner:** METIORO Product Owner
> **Authority:** Operational authorization for specification and review only
> **Hierarchy:** Level 5 — Operational procedure / workstream proposal

## Purpose

Register the bounded proposal and review workstream commonly described as
“Phase 4B Compare” without confusing it with the historical and CLOSED
`SPRINT-4B` Decision request mapping layer.

The canonical workstream ID is `P4B-COMPARE-SPEC`. The phrase “Phase 4B
Compare” is a working label only and grants no authority by itself.

## Authorization decision

The METIORO Product Owner authorizes:

- read-only verification of the canonical code and governance state;
- drafting a Compare semantic-presentation specification;
- compatibility review against locked product, architecture, Reading Contract,
  producer-responsibility, evidence, localization, and safety boundaries;
- documenting open questions, risks, proposed scope, and proposed acceptance
  criteria for a later owner decision.

This authorization permits proposal and review work only.

## Explicit non-authorizations

This record does **not** authorize:

- application-code or test-code changes;
- backend, runtime, API, schema, registry, scoring, ranking, tie, or policy changes;
- UI, renderer, localization-catalog, prompt, or LLM changes;
- production activation, deployment, experiment, migration, or backfill;
- treating readiness, an existing payload, an audit, a preview, a roadmap, or a
  detailed implementation sketch as implementation authority;
- reinterpreting `SPRINT-4B` or any CLOSED workstream as authority for this work;
- Salary Raise / Compensation Review work;
- changing a Compare winner or deriving a second winner through presentation.

## Governing boundaries

The specification and its review must preserve at least these boundaries:

1. Decision Case remains the sole system of record and the existing
   Case-to-Engine-to-`DecisionEvaluationPackage` pathway remains exclusive.
2. Presence and semantic validity remain separate. Producer semantic validity
   is not transferred to the contract, adapter, renderer, or UI.
3. Consumers must not guess, synthesize, reinterpret, or derive missing
   comparative meaning.
4. Score is not probability, Confidence, guaranteed outcome, or Decision Value.
5. Presentation must not infer claims from planet/aspect names, raw identifiers,
   or ungrounded cross-dimension comparisons.
6. No evidence means no specific comparative claim.
7. Posture or semantic interpretation must not silently replace or rerank the
   canonical Compare result.
8. User-facing language must remain calm, explainable, non-mystical,
   non-fatalistic, and localized without leaking internal codes.

## Required proposal outputs

Before any implementation authorization may be requested, the proposal must
produce:

- a provenance-verified, read-only code-state report from the canonical branch;
- Review Question Zero and written answers to Sprint Protocol Q1–Q4;
- an explicit producer/consumer responsibility map;
- an evidence and insufficiency policy for comparative claims;
- behavior for two through five options without consumer-side semantic
  derivation;
- preservation rules for ranking, winner/tie, score, and Confidence;
- EN/FA/AR/RU localization and RTL boundaries;
- a bounded implementation proposal and verification plan;
- a separate Product Owner decision granting or refusing implementation.

## Current gate

| Gate | State |
|------|-------|
| Specification drafting | Authorized |
| Compatibility review | Authorized |
| Architecture change | Not authorized |
| Implementation | Not authorized |
| Deployment / production activation | Not authorized |

The workstream remains `PROPOSED` until a reviewed specification is explicitly
accepted. Acceptance of a future specification must not be interpreted as
implementation authorization unless the owner records that authorization
separately and the Sprint Protocol preconditions are satisfied.
