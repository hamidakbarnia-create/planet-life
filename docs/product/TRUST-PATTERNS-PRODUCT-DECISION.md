# Trust Patterns — Product Decision

**Status:** Accepted — Corrected
**Date:** 2026-07-26
**Decision owner:** Product Owner
**Canonical name:** Trust Patterns
**Relationship to Cheating Radar:** Separate feature; not a rename

---

## Correction Notice

The initial version of this decision incorrectly stated that `Cheating Radar` was renamed to `Trust Patterns`.

Repository evidence confirms that these are two distinct, concurrently implemented Shadow Room features with separate routes, services, renderers, client helpers, UI entries, and tests.

This correction supersedes the rename statement in the initial version of this document.

---

## Decision

`Trust Patterns` is the canonical name of a distinct Shadow Room feature.

It does not replace, rename, or alias `Cheating Radar`.

Any future decision to retire, rename, merge, or remove `Cheating Radar` requires separate authorization and a compatibility assessment.

---

## Authorized Scope

Trust Patterns may analyze only:

- user-observable relationship patterns
- reported consistency or inconsistency
- boundaries and expectations
- information gaps
- alternative explanations
- verification steps
- conversation steps
- protective and actionable user decisions

The feature provides decision support based on observable patterns.

---

## Prohibited Behaviour

Trust Patterns MUST NOT:

- infer third-party cheating
- diagnose deception
- predict hidden conduct
- accuse a third party
- generate a probability of cheating
- present suspicion as fact
- present astrology or unverifiable inference as real-world evidence
- claim knowledge of behaviour that the user cannot observe or verify

---

## Product Rule

> Pattern, not diagnosis.
>
> Decision support, not accusation.

---

## Repository Evidence

The repository contains distinct implementations for both features.

### Trust Patterns

- API route: `/trust-patterns`
- Service: `trust_patterns_reading`
- Renderer: `render_trust_patterns_reading`
- Web client endpoint: `trust-patterns`
- Test suite: `test_vault_trust_patterns.py`
- UI entry: `Trust Patterns`

### Cheating Radar

- API route: `/cheating-radar`
- Service: `cheating_radar_reading`
- Renderer: `render_cheating_radar_reading`
- Web client endpoint: `cheating-radar`
- Test suite: `test_vault_cheating_radar.py`
- UI entry: `Cheating Radar`

The Trust Patterns test suite also contains an explicit regression guard confirming that Trust Patterns is not a renamed Cheating Radar implementation.

---

## Repository Impact

This decision documents and constrains the existing Trust Patterns feature.

It does not authorize:

- removal or rename of Cheating Radar
- scoring redesign
- engine behaviour changes
- API contract changes
- route changes
- schema changes
- UI implementation changes
- template changes
- test changes

A separate product and governance decision is required before changing the existence, name, route, or behaviour of Cheating Radar.

---

## Implementation Constraint

Any future Trust Patterns implementation MUST preserve the authorized scope in this decision.

Trust Patterns and Cheating Radar MUST remain technically and semantically distinct unless a later accepted decision explicitly authorizes consolidation or retirement.

---

## Decision State

```text
Product decision: ACCEPTED — CORRECTED
Trust Patterns implementation: EXISTS
Cheating Radar implementation: EXISTS
Relationship: DISTINCT FEATURES
Gap audit: COMPLETED
Runtime behaviour redesign: NOT AUTHORIZED
Cheating Radar retirement or rename: NOT AUTHORIZED
