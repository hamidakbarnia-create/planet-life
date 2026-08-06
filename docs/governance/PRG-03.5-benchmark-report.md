# PRG-03.5 — Benchmark Report

**Document ID:** PRG-03.5  
**Title:** Benchmark Report  
**Status:** IN REVIEW  
**Programme:** PRG-03 — Production News Provider Evaluation  
**Related:** PRG-03.3; PRG-03.3A; PRG-03.4; PRG-03.6; ADR-0008  
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`  
**Date (UTC):** 2026-07-18  

---

## Document Control

| Field | Value |
| ----- | ----- |
| Document ID | PRG-03.5 |
| Version | 0.1.0 |
| Status | IN REVIEW |
| Classification | Governance — Benchmark Fact Report Template |
| Owner | PENDING RATIFICATION |
| Approver | PENDING RATIFICATION |
| Effective date (UTC) | PENDING RATIFICATION |
| Supersedes | None |
| Branch | governance-foundation |

This artifact SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. It MUST NOT be represented as `RATIFIED` or `LOCKED` before the corresponding governance steps have been completed.

This document defines the immutable report template and integrity rules for PRG-03 benchmark fact records. Individual run reports SHALL instantiate this template and cite exact dependency versions.

---

## Purpose

This document records benchmark facts only, without provider recommendation or architecture advice.

A completed PRG-03.5 report is a factual instrument for later architecture decision-making under PRG-03.6. It MUST NOT contain subjective commentary, commercial negotiation advice, implementation plans, or architecture recommendations.

---

## Scope

### In scope

- Template sections and reusable tables for hard gates, soft gates, deferred gates, error taxonomy, and per-locale/topic metrics.
- Execution and environment metadata requirements.
- Automatic classification values and integrity rules.
- Sign-off fields for completed runs.

### Out of scope (forbidden content)

- Architecture recommendation
- Provider recommendation
- Subjective commentary
- Commercial negotiation advice
- Implementation plan

---

## Referenced Eligibility Record

| Field | Value |
| ----- | ----- |
| Eligibility document | PRG-03.3 — Pre-Benchmark Eligibility |
| Eligibility document version | PENDING RATIFICATION / recorded per run |
| Provider eligibility outcome | MUST be `PASS` before execution; record exact matrix row reference |
| Eligibility record identifier | PENDING RATIFICATION / recorded per run |

The report MUST cite the exact eligibility record version used. Execution without Eligibility = `PASS` renders the run `INVALID_RUN`.

---

## Referenced RLP Version

| Field | Value |
| ----- | ----- |
| RLP document | PRG-03.3A — Reference Load Profile |
| RLP version | PENDING RATIFICATION / recorded per run |

The report MUST cite the exact RLP version. Mismatch between executed workload and cited RLP version renders the run `INVALID_RUN`.

---

## Referenced Benchmark Definition Version

| Field | Value |
| ----- | ----- |
| Benchmark definition document | PRG-03.4 — Production Benchmark Definition |
| Benchmark definition version | PENDING RATIFICATION / recorded per run |

The report MUST cite the exact benchmark-definition version. The report MUST NOT reinterpret thresholds defined in that version.

---

## Execution Metadata

| Field | Value |
| ----- | ----- |
| Provider | PENDING RATIFICATION / recorded per run |
| Run ID | PENDING RATIFICATION / recorded per run |
| Start UTC | PENDING RATIFICATION / recorded per run |
| End UTC | PENDING RATIFICATION / recorded per run |
| Commit SHA | PENDING RATIFICATION / recorded per run |
| Harness version | PENDING RATIFICATION / recorded per run |
| Region | PENDING RATIFICATION / recorded per run |
| Runtime | PENDING RATIFICATION / recorded per run |
| Network path | PENDING RATIFICATION / recorded per run |
| Credential class | PENDING RATIFICATION / recorded per run |
| Dataset version | PENDING RATIFICATION / recorded per run |

All Execution Metadata fields are mandatory for a valid published report.

---

## Environment Metadata

| Field | Value |
| ----- | ----- |
| Environment freeze record ID | PENDING RATIFICATION / recorded per run |
| Cache assumptions applied | As cited from RLP / freeze |
| Authentication assumptions applied | As cited from RLP / freeze |
| Region/network assumptions applied | As cited from RLP / freeze |
| Deviations from freeze | None allowed after start; if discovered, classify `INVALID_RUN` |

---

## Dataset Summary

| Field | Value |
| ----- | ----- |
| Dataset version | PENDING RATIFICATION / recorded per run |
| Topics | As executed |
| Locales | As executed |
| Queries per locale/topic cell | As executed |
| Total requests attempted | PENDING RATIFICATION / recorded per run |
| Total requests completed | PENDING RATIFICATION / recorded per run |

### Per-locale/topic metrics table (reusable)

| Locale | Topic | Requests | DTO successes | Missing timestamps | Duplicate URLs | Notes |
| ------ | ----- | -------- | ------------- | ------------------ | -------------- | ----- |
| PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | Fact-only notes permitted |

---

## Hard Gate Results

Reusable hard-gate results table:

| Gate ID | Hard Gate | Threshold (cited) | Observed value | Result (PASS/FAIL) | Evidence reference |
| ------- | --------- | ----------------- | -------------- | ------------------ | ------------------ |
| HG-01 | Provider Reachability | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| HG-02 | Infrastructure Failure Rate | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| HG-03 | DTO Success Rate | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| HG-04 | Missing Timestamp Rate | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| HG-05 | Effective FA Coverage | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

Provider Reachability means the harness reached the provider application layer and received any HTTP response.

Infrastructure Failure Rate observations MUST apply PRG-03.4 counting rules (timeout, network failure, provider-originated 5xx counted; edge/proxy/BFF/harness failures excluded from provider rate and preserved diagnostically).

---

## Soft Gate Results

Reusable soft-gate results table:

| Gate ID | Soft Gate | Threshold (cited) | Observed value | Result signal | Evidence reference |
| ------- | --------- | ----------------- | -------------- | ------------- | ------------------ |
| SG-01 | Latency | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| SG-02 | Duplicate URL rate | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| SG-03 | Freshness | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| SG-04 | EN locale success | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| SG-05 | AR locale success | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| SG-06 | RU locale success | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

Soft-gate signals MUST NOT be rewritten as hard-gate outcomes in this report.

---

## Deferred Gate Evidence

Reusable deferred-gate evidence table:

| Gate ID | Deferred Gate | Observed value | Distribution / notes (fact-only) | Evidence reference |
| ------- | ------------- | -------------- | -------------------------------- | ------------------ |
| DG-01 | HTTP 429 / rate-limit | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

HTTP 429 evidence in benchmark v1 MUST NOT be mapped to hard-gate FAIL. No retroactive rejection. No retroactive gate promotion.

---

## Evidence-Only Metrics

| Metric | Observed value | Evidence reference |
| ------ | -------------- | ------------------ |
| FA by topic | PENDING RATIFICATION | PENDING RATIFICATION |
| Topic diversity | PENDING RATIFICATION | PENDING RATIFICATION |
| Editorial diversity | PENDING RATIFICATION | PENDING RATIFICATION |
| Burst behavior | PENDING RATIFICATION | PENDING RATIFICATION |
| 429 distribution | PENDING RATIFICATION | PENDING RATIFICATION |

Evidence-only metrics MUST NOT be treated as gates in the automatic classification for benchmark v1.

---

## Error Taxonomy Results

Reusable error taxonomy table:

| Category | Count | Rate | Evidence reference |
| -------- | ----- | ---- | ------------------ |
| timeout | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| network | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| provider_5xx | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| edge_proxy_5xx | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| auth_error | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| rate_limit | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| schema_error | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| empty_result | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| invalid_timestamp | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| duplicate_url | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| unknown | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

---

## Raw Evidence References

| Evidence artifact | Locator | Integrity hash (if applicable) |
| ----------------- | ------- | ------------------------------ |
| PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

Raw evidence locators MUST be durable enough for audit. Tracking parameters MUST NOT be introduced into official URL records.

---

## Automatic Classification

Automatic classification SHALL be exactly one of:

| Value | Meaning |
| ----- | ------- |
| PASS | Run integrity is valid and all ratified hard gates meet cited thresholds. |
| FAIL | Run integrity is valid and one or more ratified hard gates miss cited thresholds. |
| INVALID_RUN | Run integrity failed, dependency versions mismatched, eligibility was not PASS, freeze was violated, evidence is incomplete/corrupt, or thresholds were reinterpreted. |

| Field | Value |
| ----- | ----- |
| Automatic classification | PENDING RATIFICATION / recorded per run |
| Classification basis | Hard-gate mapping under cited PRG-03.4 version only |

The report MUST NOT reinterpret thresholds. Soft gates, deferred gates, and evidence-only metrics MUST NOT alter automatic classification except insofar as PRG-03.4 explicitly requires (benchmark v1: they do not).

---

## Integrity and Immutability Rules

1. Published reports are immutable.
2. Corrections require a new run or formal amendment.
3. The report must not reinterpret thresholds.
4. The report must cite the exact eligibility, RLP, and benchmark-definition versions.
5. Adding architecture advice, provider recommendation, subjective commentary, commercial negotiation advice, or an implementation plan is a report-integrity violation and requires superseding correction process.
6. No retroactive gate promotion may alter a published report’s automatic classification.

---

## Sign-off

| Role | Name | Date (UTC) | Signature / confirmation |
| ---- | ---- | ---------- | ------------------------ |
| Report preparer | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| Evidence custodian | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |
| Governance reviewer | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION |

Sign-off confirms factual completeness and integrity only. Sign-off is not provider selection and is not architecture ratification.

---

## Ratification Checklist (Template Governance)

Before this template document may move from `IN REVIEW` to `RATIFIED`, the following MUST be confirmed:

- [ ] All required sections exist as specified.
- [ ] Execution Metadata fields are complete in the template.
- [ ] Reusable tables exist for hard gates, soft gates, deferred gates, error taxonomy, and per-locale/topic metrics.
- [ ] Automatic classification values are limited to PASS, FAIL, and INVALID_RUN.
- [ ] Forbidden content list is explicit.
- [ ] Immutability and citation rules are explicit.
- [ ] No invented numeric thresholds appear as ratified values.
- [ ] No approval names have been invented.

**Ratification status:** IN REVIEW  
**Ratified by:** PENDING RATIFICATION  
**Ratification date (UTC):** PENDING RATIFICATION  
