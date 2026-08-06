# PRG-03.6 — Architecture Decision

**Document ID:** PRG-03.6  
**Title:** Architecture Decision  
**Status:** IN REVIEW  
**Programme:** PRG-03 — Production News Provider Evaluation  
**Related:** PRG-03.2; PRG-03.3; PRG-03.3A; PRG-03.4; PRG-03.5; ADR-0008  
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`  
**Date (UTC):** 2026-07-18  

---

## Document Control

| Field | Value |
| ----- | ----- |
| Document ID | PRG-03.6 |
| Version | 0.1.0 |
| Status | IN REVIEW |
| Classification | Governance — Provider Architecture Decision |
| Owner | PENDING RATIFICATION |
| Approver | PENDING RATIFICATION |
| Effective date (UTC) | PENDING RATIFICATION |
| Supersedes | None |
| Branch | governance-foundation |

This artifact SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. It MUST NOT be represented as `RATIFIED` or `LOCKED` before the corresponding governance steps have been completed.

---

## Purpose

This document converts completed benchmark evidence into a ratified provider architecture decision.

PRG-03.6 is the sole authorization point for provider architecture commitment under PRG-03. It consumes eligibility, load-profile, benchmark-definition, and benchmark-report artifacts and records the selected architecture, rejected alternatives, ownership boundaries, and implementation authorization conditions.

---

## Scope

### In scope

- Decision options and selected architecture recording.
- Provider responsibilities, routing rules, failure policy, cache policy, and freshness policy.
- Rejected alternatives and governance rationale.
- Risks, operational responsibilities, traceability, and implementation authorization.
- Amendment rules and ratification checklist.

### Out of scope until ratification

- Provider adapter implementation.
- Production integration or rollout.
- Provider-specific architecture commitment in code or infrastructure.
- Reinterpretation of PRG-03.5 facts or PRG-03.4 thresholds.

---

## Preconditions

PRG-03.6 MAY be ratified only when all of the following are true:

1. PRG-03.2 Evidence Register is complete for every provider in the decision set.
2. PRG-03.3 Eligibility is `PASS` for every provider that is a candidate for selection in the decision set (providers rejected at eligibility may appear only as rejected alternatives with eligibility-based reasons).
3. PRG-03.3A is ratified.
4. PRG-03.4 is ratified.
5. A PRG-03.5 report is completed for every benchmarked provider in the decision set.

Benchmark execution remains prohibited before eligibility `PASS`. `UNKNOWN` is not permission. No retroactive gate promotion may be used to manufacture a decision precondition after the fact.

---

## Inputs

| Input | Required identity |
| ----- | ----------------- |
| PRG-03.2 Evidence Register | Complete register reference — PENDING RATIFICATION / recorded at decision time |
| PRG-03.3 Eligibility records | Exact versions and PASS outcomes — PENDING RATIFICATION / recorded at decision time |
| PRG-03.3A RLP | Exact ratified version — PENDING RATIFICATION / recorded at decision time |
| PRG-03.4 Benchmark Definition | Exact ratified version — PENDING RATIFICATION / recorded at decision time |
| PRG-03.5 Benchmark Reports | One completed report per benchmarked provider — PENDING RATIFICATION / recorded at decision time |
| ADR-0008 and frozen World contracts | Remain unchanged by this decision unless a separate ADR process authorizes change |

---

## Decision Options

Allowed architecture outputs:

| Option ID | Architecture output |
| --------- | ------------------- |
| A | Single provider |
| B | Primary plus fallback |
| C | Language routing |
| D | Topic routing |
| E | Hybrid architecture |

| Field | Value |
| ----- | ----- |
| Options considered | PENDING RATIFICATION |
| Options excluded before decision | PENDING RATIFICATION |

---

## Selected Architecture

| Field | Value |
| ----- | ----- |
| Selected architecture output | PENDING RATIFICATION |
| Selected providers | PENDING RATIFICATION |
| Decision date (UTC) | PENDING RATIFICATION |
| Decision status | Not selected — pending completed inputs and ratification |

The decision MUST document:

- Selected providers
- Rejected providers
- Rejection reasons
- Routing ownership
- Cache ownership
- Retry/backoff/circuit-breaker ownership
- Fail-open/fail-closed behavior
- Legal and attribution responsibilities
- Operational monitoring
- Re-evaluation triggers

Until ratification, no selected architecture exists.

---

## Provider Responsibilities

| Provider | Role (primary / fallback / locale route / topic route / hybrid component) | Responsibilities | Status |
| -------- | --------------------------------------------------------------------------- | ---------------- | ------ |
| PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

Responsibilities SHALL be stated in operational terms (fetch, normalize, respect attribution, emit observability) without authorizing implementation before ratification.

---

## Routing Rules

| Rule ID | Condition | Target provider / path | Owner |
| ------- | --------- | ---------------------- | ----- |
| PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

Routing ownership MUST be explicit. Language routing and topic routing, if selected, MUST state the precedence order between rules.

---

## Failure Policy

| Topic | Decision value |
| ----- | -------------- |
| Retry | PENDING RATIFICATION |
| Backoff | PENDING RATIFICATION |
| Circuit breaker | PENDING RATIFICATION |
| Fail-open / fail-closed behavior | PENDING RATIFICATION |
| Ownership of retry/backoff/circuit-breaker | PENDING RATIFICATION |
| Alignment to World state contract (`ok` / `low_signal` / `unavailable`) | PENDING RATIFICATION |

Failure policy values SHOULD consume the ratified Failure Handling Strategy arising from PRG-03.3A-AI-02 when available.

---

## Cache Policy

| Topic | Decision value |
| ----- | -------------- |
| Cache ownership | PENDING RATIFICATION |
| What may be cached | PENDING RATIFICATION |
| TTL / invalidation | PENDING RATIFICATION |
| Provider term constraints honored | PENDING RATIFICATION |

Cache policy values SHOULD consume the ratified Production Polling Strategy arising from PRG-03.3A-AI-01 when available.

---

## Freshness Policy

| Topic | Decision value |
| ----- | -------------- |
| Freshness target | PENDING RATIFICATION |
| Relationship to ADR-0008 | MUST remain consistent unless a separate ADR authorizes change |
| Ownership of freshness enforcement | PENDING RATIFICATION |

---

## Rejected Alternatives

| Provider or architecture option | Rejection reason | Evidence basis (eligibility / benchmark / legal / other) |
| ------------------------------- | ---------------- | -------------------------------------------------------- |
| PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

Rejected providers and rejected architecture options MUST be listed explicitly. Silence is not rejection, and rejection MUST cite evidence.

---

## Governance Rationale

| Field | Value |
| ----- | ----- |
| Rationale summary | PENDING RATIFICATION |
| Hard-gate dependency summary | PENDING RATIFICATION |
| Soft-gate / evidence-only considerations (non-binding) | PENDING RATIFICATION |
| Explicit non-reliance statements | Deferred gates and evidence-only metrics MUST NOT be treated as hard gates unless previously promoted with no retroactive gate promotion |

The rationale MUST NOT invent numeric thresholds or reinterpret PRG-03.5 facts.

---

## Risks

| Risk ID | Risk | Mitigation / acceptance | Owner |
| ------- | ---- | ----------------------- | ----- |
| PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

---

## Operational Responsibilities

| Area | Owner | Responsibility |
| ---- | ----- | -------------- |
| Operational monitoring | PENDING RATIFICATION | PENDING RATIFICATION |
| Legal and attribution responsibilities | PENDING RATIFICATION | PENDING RATIFICATION |
| Quota and polling compliance | PENDING RATIFICATION | PENDING RATIFICATION |
| Incident response for provider path | PENDING RATIFICATION | PENDING RATIFICATION |
| Re-evaluation triggers | PENDING RATIFICATION | See below |

### Re-evaluation triggers

Re-evaluation of this architecture decision is required when any of the following occur:

- Provider terms, pricing, or license materially change.
- Official locale documentation relevant to EN/AR/RU/FA changes.
- A hard gate is amended or a deferred/evidence-only metric is promoted to a gate (requires new benchmark run; no retroactive gate promotion).
- Production freshness, quota, or failure-handling strategy changes invalidate prior assumptions.
- A PRG-03.5 report for a selected provider is superseded by a new run that changes hard-gate outcomes.
- ADR-0008 or World contract changes affect provider integration constraints.

---

## Traceability

| Decision element | Trace to |
| ---------------- | -------- |
| Selected providers | PRG-03.3 eligibility PASS + PRG-03.5 reports |
| Rejected providers | PRG-03.3 and/or PRG-03.5 citations |
| Workload assumptions | PRG-03.3A version |
| Gate and threshold assumptions | PRG-03.4 version |
| Benchmark facts | PRG-03.5 run IDs |
| Contract constraints | ADR-0008 / frozen World contracts |

---

## Implementation Authorization

### Implementation prohibition

No provider adapter, integration, production rollout, or provider-specific architecture commitment is authorized before PRG-03.6 is ratified.

### Authorization statement (completed only upon ratification)

| Field | Value |
| ----- | ----- |
| Implementation authorized | No — PENDING RATIFICATION |
| Authorized artifacts / workstreams | PENDING RATIFICATION |
| Explicitly unauthorized work | Provider adapters, production rollout, and provider-specific architecture commitments remain unauthorized until ratification |

---

## Amendment Rules

1. Material changes to selected architecture, providers, routing, failure/cache/freshness policy, or ownership require a new version and re-ratification.
2. Changes driven by newly promoted gates require a new benchmark run and updated PRG-03.5 inputs before amendment of this decision.
3. No retroactive gate promotion may rewrite the historical basis of a prior ratified decision without a formal amendment trail.
4. This document MUST NOT modify ADR files or frozen contracts; contract changes require separate ADR governance.

---

## Ratification Checklist

Before this document may move from `IN REVIEW` to `RATIFIED`, the following MUST be confirmed:

- [ ] PRG-03.2 Evidence Register complete for the decision set.
- [ ] PRG-03.3 Eligibility PASS recorded for every selected-provider candidate as required.
- [ ] PRG-03.3A ratified and cited.
- [ ] PRG-03.4 ratified and cited.
- [ ] PRG-03.5 report completed for every benchmarked provider in the decision set.
- [ ] Selected architecture is one of: Single provider; Primary plus fallback; Language routing; Topic routing; Hybrid architecture.
- [ ] Selected providers, rejected providers, and rejection reasons are documented.
- [ ] Routing ownership, cache ownership, and retry/backoff/circuit-breaker ownership are documented.
- [ ] Fail-open/fail-closed behavior is documented.
- [ ] Legal and attribution responsibilities are documented.
- [ ] Operational monitoring and re-evaluation triggers are documented.
- [ ] Implementation prohibition was respected prior to ratification.
- [ ] No invented numeric thresholds appear as if ratified.
- [ ] No approval names have been invented.

**Ratification status:** IN REVIEW  
**Ratified by:** PENDING RATIFICATION  
**Ratification date (UTC):** PENDING RATIFICATION  
