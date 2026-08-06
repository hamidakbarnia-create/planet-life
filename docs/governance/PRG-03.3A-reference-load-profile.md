# PRG-03.3A — Reference Load Profile

**Document ID:** PRG-03.3A  
**Title:** Reference Load Profile  
**Status:** IN REVIEW  
**Programme:** PRG-03 — Production News Provider Evaluation  
**Related:** PRG-03.3; PRG-03.4; PRG-03.5; PRG-03.6; ADR-0008  
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`  
**Date (UTC):** 2026-07-18  

---

## Document Control

| Field | Value |
| ----- | ----- |
| Document ID | PRG-03.3A |
| Version | 0.1.0 |
| Status | IN REVIEW |
| Classification | Governance — Benchmark Workload Definition |
| Owner | PENDING RATIFICATION |
| Approver | PENDING RATIFICATION |
| Effective date (UTC) | PENDING RATIFICATION |
| Supersedes | None |
| Branch | governance-foundation |

This artifact SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. It MUST NOT be represented as `RATIFIED` or `LOCKED` before the corresponding governance steps have been completed.

---

## Purpose

This document defines the benchmark workload independently from production architecture and independently from benchmark pass/fail thresholds.

PRG-03.3A exists so that provider comparisons under PRG-03.4 and PRG-03.5 are executed against a pre-registered, versioned Reference Load Profile (RLP), preventing post-hoc workload changes that would invalidate comparability.

---

## Scope

### In scope

- Required workload parameters for PRG-03 benchmark runs.
- Benchmark load profile, burst window, concurrency, and quota assumptions.
- Explicit separation of benchmark cadence from production cadence.
- Action items for later Production Polling Strategy and Failure Handling Strategy ratification.

### Out of scope

- Pass/fail thresholds (PRG-03.4).
- Eligibility determination (PRG-03.3).
- Benchmark result recording (PRG-03.5).
- Architecture selection (PRG-03.6).
- Production polling cadence ratification.
- Production failure-handling ratification.

---

## Ratification Source

This Reference Load Profile becomes binding for benchmark execution only upon ratification of this document.

Until ratification:

- Parameter values marked `PENDING RATIFICATION` MUST NOT be treated as authorized workload commitments.
- Benchmark runs MUST NOT claim conformance to a ratified RLP version.

After ratification, every PRG-03.5 Benchmark Report MUST cite the exact RLP version used for the run.

---

## Required Parameters

The following parameters MUST be defined for any ratified RLP version used in a production benchmark:

| Parameter | Status |
| --------- | ------ |
| Topics | PENDING RATIFICATION |
| Locales | PENDING RATIFICATION |
| Queries per locale/topic cell | PENDING RATIFICATION |
| Request interval | PENDING RATIFICATION |
| Benchmark duration | See Benchmark Load Profile (six-hour benchmark window currently specified for cadence framing) |
| Concurrency | PENDING RATIFICATION |
| Burst size | PENDING RATIFICATION |
| Burst interval | PENDING RATIFICATION |
| Cache assumptions | PENDING RATIFICATION |
| Authentication assumptions | PENDING RATIFICATION |
| Region/network assumptions | PENDING RATIFICATION |

No numeric threshold, quota ceiling, or production SLA is established by listing these parameters. Values remain `PENDING RATIFICATION` until explicitly ratified in a subsequent version of this document or a formal amendment.

---

## Benchmark Load Profile

### Current benchmark cadence

| Field | Value |
| ----- | ----- |
| Benchmark window | Six-hour benchmark window |
| Production implication | None |

### Explicit cadence rules

1. Benchmark cadence does not imply production cadence.
2. Production cadence remains unresolved until ratified separately.
3. The six-hour benchmark window is a measurement window for comparable provider evaluation under PRG-03. It is not an authorization to poll production systems on a six-hour cycle.

### Profile statement

The benchmark load profile SHALL apply the ratified values of the Required Parameters uniformly across providers under comparison, except where a provider-specific authentication or plan constraint is pre-declared in the Environment Freeze (PRG-03.4) and recorded in the Benchmark Report (PRG-03.5).

---

## Burst Window

Burst behavior MAY be exercised during the benchmark for evidence collection.

Rules:

1. Burst size and burst interval remain `PENDING RATIFICATION` until explicitly set.
2. Burst evidence is evidence-only unless a future amendment promotes it to a gate.
3. Any promotion of HTTP 429 or burst behavior to a gate requires a new benchmark run.
4. No retroactive application of a newly promoted gate is permitted.
5. No retroactive gate promotion may be used to reject or accept a completed run after the fact.

---

## Concurrency

Concurrency is a Required Parameter of the RLP.

| Field | Value |
| ----- | ----- |
| Concurrent request level | PENDING RATIFICATION |
| Relationship to production concurrency | Not implied; production concurrency remains unresolved until ratified separately |

Concurrent load used in the benchmark MUST be recorded in the PRG-03.5 Execution Metadata and MUST match the ratified RLP version cited by the report.

---

## Quota Assumptions

Quota assumptions used for benchmark planning SHALL be recorded as assumptions, not as provider pass/fail determinations.

| Assumption class | Value |
| ---------------- | ----- |
| Plan tier assumed for benchmark credentials | PENDING RATIFICATION |
| Request budget assumed for the six-hour window | PENDING RATIFICATION |
| Handling when provider quota is exhausted mid-run | PENDING RATIFICATION (see Failure Handling Strategy Action Item) |

Quota exhaustion observed during a run is factual evidence for PRG-03.5 and MUST NOT be reinterpreted as a hard gate unless and until such a gate is ratified under PRG-03.4 with no retroactive gate promotion.

---

## Production Polling Strategy Action Item

**Action item ID:** PRG-03.3A-AI-01  
**Status:** OPEN — PENDING RATIFICATION  
**Owner:** PENDING RATIFICATION  

A separate Production Polling Strategy MUST be ratified before production provider integration is authorized under PRG-03.6. That strategy MUST cover at least:

| Topic | Requirement |
| ----- | ----------- |
| Cadence | Production request cadence (distinct from the six-hour benchmark window). |
| Trigger model | Scheduled, event-driven, or hybrid trigger model. |
| Cache policy | What may be cached, for how long, and under which invalidation rules. |
| Quota model | How provider quotas are budgeted and protected in production. |
| Freshness target | Target freshness relative to ADR-0008 and product requirements. |

Until this action item is closed by ratification of the Production Polling Strategy, production cadence remains unresolved.

---

## Failure Handling Strategy Action Item

**Action item ID:** PRG-03.3A-AI-02  
**Status:** OPEN — PENDING RATIFICATION  
**Owner:** PENDING RATIFICATION  

A separate Failure Handling Strategy MUST be ratified before production provider integration is authorized under PRG-03.6. That strategy MUST cover at least:

| Topic | Requirement |
| ----- | ----------- |
| Retry | Whether retries are permitted and under which error classes. |
| Backoff | Backoff algorithm and limits. |
| Circuit breaker | Open/half-open/closed conditions and ownership. |
| Fail-open/fail-closed behavior | Behavior when the provider path is unavailable, aligned with World state contract constraints. |

Benchmark observation of failures does not itself ratify production failure handling.

---

## Versioning and Amendments

1. Each ratified RLP is immutable for runs that cite it.
2. Material changes to parameters, burst rules, or cadence framing require a new RLP version.
3. Promotion of burst behavior or HTTP 429 from evidence-only status to a gate requires:
   - amendment of the relevant governance artifacts (at minimum PRG-03.3A and PRG-03.4);
   - a new benchmark run under the amended framework;
   - no retroactive application to prior runs.
4. Changing rationale or assumptions requires an amendment in the same manner as changing a numeric parameter.

---

## Ratification Checklist

Before this document may move from `IN REVIEW` to `RATIFIED`, the following MUST be confirmed:

- [ ] All Required Parameters are either explicitly valued or expressly retained as PENDING RATIFICATION with a plan to complete them before first authorized run.
- [ ] Six-hour benchmark window is recorded without implying production cadence.
- [ ] Rules recorded: benchmark cadence does not imply production cadence; production cadence remains unresolved until ratified separately.
- [ ] Burst evidence remains evidence-only unless amended.
- [ ] Rules recorded: promotion of HTTP 429 or burst behavior to a gate requires a new benchmark run; no retroactive gate promotion.
- [ ] Production Polling Strategy action item covers cadence, trigger model, cache policy, quota model, and freshness target.
- [ ] Failure Handling Strategy action item covers retry, backoff, circuit breaker, and fail-open/fail-closed behavior.
- [ ] No invented numeric thresholds appear where none have been ratified.
- [ ] No approval names have been invented.
- [ ] Owner and Approver identities are assigned by authorized governance process (PENDING RATIFICATION until assigned).

**Ratification status:** IN REVIEW  
**Ratified by:** PENDING RATIFICATION  
**Ratification date (UTC):** PENDING RATIFICATION  
