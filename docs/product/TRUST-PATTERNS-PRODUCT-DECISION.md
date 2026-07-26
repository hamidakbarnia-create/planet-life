# Trust Patterns — Product Decision

**Status:** Accepted
**Date:** 2026-07-26
**Decision owner:** Product Owner
**Previous name:** Cheating Radar
**Canonical name:** Trust Patterns

---

## Decision

The product feature previously named `Cheating Radar` is renamed to `Trust Patterns`.

The previous name is retired because it implies detection or prediction of third-party cheating, while the authorized feature scope does not support that claim.

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

## Repository Impact

This decision establishes the canonical product name and authorized scope.

Existing repository references to `Cheating Radar` remain implementation debt until a separately authorized rename task is completed.

This decision does not authorize:

- scoring redesign
- engine behaviour changes
- API contract changes
- route changes
- schema changes
- UI implementation changes
- template changes
- test changes

A separate gap audit MUST identify all affected surfaces before implementation.

---

## Implementation Constraint

Any future implementation MUST preserve the authorized scope in this decision.

Backward compatibility for API identifiers, routes, stored keys, or external consumers must be assessed before technical identifiers are renamed.

---

## Decision State

```text
Product decision: ACCEPTED
Repository implementation: NOT STARTED
Gap audit: REQUIRED
Runtime behaviour redesign: NOT AUTHORIZED



```
