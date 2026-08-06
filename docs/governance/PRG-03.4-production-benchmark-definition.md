# PRG-03.4 — Production Benchmark Definition

**Document ID:** PRG-03.4  
**Title:** Production Benchmark Definition  
**Status:** IN REVIEW  
**Programme:** PRG-03 — Production News Provider Evaluation  
**Related:** PRG-03.3; PRG-03.3A; PRG-03.5; PRG-03.6; ADR-0008  
**Normative language:** `SHALL`, `MUST`, `MUST NOT`, `MAY`  
**Date (UTC):** 2026-07-18  

---

## Document Control

| Field | Value |
| ----- | ----- |
| Document ID | PRG-03.4 |
| Version | 0.1.0 |
| Status | IN REVIEW |
| Classification | Governance — Benchmark Method and Gate Definition |
| Owner | PENDING RATIFICATION |
| Approver | PENDING RATIFICATION |
| Effective date (UTC) | PENDING RATIFICATION |
| Supersedes | None |
| Branch | governance-foundation |

This artifact SHALL progress only through `DRAFTED → IN REVIEW → RATIFIED → LOCKED`. It MUST NOT be represented as `RATIFIED` or `LOCKED` before the corresponding governance steps have been completed.

---

## Purpose

This document pre-registers the provider benchmark method and prevents post-hoc threshold changes.

PRG-03.4 binds metric definitions, hard gates, soft gates, deferred gates, evidence-only metrics, error taxonomy, and threshold governance so that PRG-03.5 reports facts against a frozen method rather than a method adjusted after observation.

---

## Scope

### In scope

- Preconditions and environment freeze rules for authorized benchmark runs.
- Representative workload and dataset definition references.
- Metric definitions and gate classifications.
- Error taxonomy and pass/fail mapping rules.
- Threshold governance and the Threshold Justification Register template.
- Output requirements for PRG-03.5 Benchmark Reports.

### Out of scope

- Eligibility evidence collection (PRG-03.3 / PRG-03.2).
- Architecture recommendation or provider selection (PRG-03.6).
- Implementation of adapters or production rollout.
- Invention of numeric thresholds not yet ratified.

---

## Preconditions

A production benchmark run under this definition is authorized only when all of the following are true:

1. PRG-03.2 Evidence Register work required for the provider is complete for the intended evaluation context.
2. PRG-03.3 eligibility for the provider is `PASS`.
3. PRG-03.3A is ratified, and the run cites a specific RLP version.
4. This document (PRG-03.4) is ratified, and the run cites a specific benchmark-definition version.
5. Environment Freeze parameters for the run are recorded before execution begins.

Benchmark execution is prohibited before eligibility `PASS`. `UNKNOWN` is not permission.

---

## Environment Freeze

Before execution, the following MUST be frozen and recorded for the run:

| Freeze item | Value |
| ----------- | ----- |
| Commit SHA | PENDING RATIFICATION / recorded at run time in PRG-03.5 |
| Harness version | PENDING RATIFICATION / recorded at run time in PRG-03.5 |
| Region | PENDING RATIFICATION / recorded at run time in PRG-03.5 |
| Runtime | PENDING RATIFICATION / recorded at run time in PRG-03.5 |
| Network path | PENDING RATIFICATION / recorded at run time in PRG-03.5 |
| Credential class | PENDING RATIFICATION / recorded at run time in PRG-03.5 |
| Dataset version | PENDING RATIFICATION / recorded at run time in PRG-03.5 |
| RLP version | MUST match ratified PRG-03.3A version cited by the run |
| Benchmark-definition version | MUST match this document’s ratified version |

After the freeze is recorded, method or threshold changes require amendment and a new run. No retroactive gate promotion is permitted.

---

## Representative Workload

The representative workload SHALL be the ratified Reference Load Profile under PRG-03.3A, including the six-hour benchmark window where that cadence framing is in force.

Rules:

1. Benchmark cadence does not imply production cadence.
2. Workload parameters MUST NOT be altered mid-run to chase a desired outcome.
3. Provider-specific deviations MUST be pre-declared in the Environment Freeze and restated in PRG-03.5.

---

## Dataset Definition

| Field | Value |
| ----- | ----- |
| Dataset identifier | PENDING RATIFICATION |
| Topics | As ratified in PRG-03.3A |
| Locales | As ratified in PRG-03.3A |
| Queries per locale/topic cell | As ratified in PRG-03.3A |
| Dataset versioning rule | Each dataset revision receives a new version identifier; reports MUST cite the exact version |

The dataset is a governance input. Changing the dataset after a run invalidates comparability and requires a new run under the revised dataset version.

---

## Metric Definitions

| Metric | Definition |
| ------ | ---------- |
| Provider Reachability | The harness reached the provider application layer and received any HTTP response. |
| Infrastructure Failure Rate | Proportion of requests classified as infrastructure failures: timeout, network failure, or provider-originated 5xx. |
| DTO Success Rate | Proportion of requests that yield a response successfully mapped to the World external DTO contract under evaluation. |
| Missing Timestamp Rate | Proportion of otherwise considered items lacking a usable publication timestamp under the evaluation rules. |
| Effective FA Coverage | Measured real-world Persian/FA coverage under the benchmark dataset and method; distinct from official FA documentation under PRG-03.3. |
| Latency | Distribution of observed end-to-end request latencies under the frozen environment. |
| Duplicate URL rate | Proportion of duplicate article URLs observed within the defined comparison window. |
| Freshness | Observed freshness characteristics relative to publication timestamps and the evaluation window. |
| Locale success (EN/AR/RU) | Success characteristics for the named locale under the dataset. |
| Burst behavior | Observed behavior under burst load; evidence-only unless promoted by amendment. |
| HTTP 429 distribution | Observed rate-limit responses; deferred as a hard gate in benchmark v1. |

### Infrastructure Failure Rate — counting rules

Counted against the provider Infrastructure Failure Rate:

- timeout
- network failure
- provider-originated 5xx

MUST NOT be counted against the provider Infrastructure Failure Rate:

- edge-generated 5xx
- proxy-generated 5xx
- Cloudflare Worker or METIORO BFF failures
- local harness failures

Those non-provider failures MUST still be preserved in diagnostic categories for integrity analysis.

---

## Hard Gates

The following are hard gates for benchmark v1. Numeric thresholds remain `PENDING RATIFICATION` until entered in the Threshold Justification Register and ratified.

| Gate ID | Hard Gate | Threshold | Notes |
| ------- | --------- | --------- | ----- |
| HG-01 | Provider Reachability | PENDING RATIFICATION | Any HTTP response from the provider application layer. |
| HG-02 | Infrastructure Failure Rate | PENDING RATIFICATION | Uses counting rules above. |
| HG-03 | DTO Success Rate | PENDING RATIFICATION | World external DTO mapping success. |
| HG-04 | Missing Timestamp Rate | PENDING RATIFICATION | Timestamp usability under evaluation rules. |
| HG-05 | Effective FA Coverage | PENDING RATIFICATION | Remains a hard gate metric even when FA is officially documented. |

Failure of any ratified hard gate fails the provider for the evaluation context defined by this benchmark version.

---

## Soft Gates

Soft gates inform comparison and risk assessment. They do not alone authorize architecture selection.

| Gate ID | Soft Gate | Threshold |
| ------- | --------- | --------- |
| SG-01 | Latency | PENDING RATIFICATION |
| SG-02 | Duplicate URL rate | PENDING RATIFICATION |
| SG-03 | Freshness | PENDING RATIFICATION |
| SG-04 | EN locale success | PENDING RATIFICATION |
| SG-05 | AR locale success | PENDING RATIFICATION |
| SG-06 | RU locale success | PENDING RATIFICATION |

---

## Deferred Gates

| Gate ID | Deferred Gate | Status in benchmark v1 |
| ------- | ------------- | ---------------------- |
| DG-01 | HTTP 429 / rate-limit hard gate | Deferred as a hard gate; collected as evidence in benchmark v1 |

HTTP 429 rules:

1. Deferred as a hard gate.
2. Collected as evidence in benchmark v1.
3. Cannot be promoted until PRG-03.3A is ratified.
4. Promotion requires amendment and a new benchmark run.
5. No retroactive rejection.
6. No retroactive gate promotion.

---

## Evidence-Only Metrics

The following are collected as evidence only in benchmark v1 and MUST NOT be treated as pass/fail gates unless promoted by amendment:

- FA by topic
- Topic diversity
- Editorial diversity
- Burst behavior
- 429 distribution

Promotion of any evidence-only metric to a gate requires amendment, threshold justification, and a new benchmark run. No retroactive gate promotion.

---

## Error Taxonomy

Every failed or anomalous request MUST be classified into exactly one primary diagnostic category:

| Category | Meaning |
| -------- | ------- |
| timeout | Request exceeded the freeze-defined timeout without a usable provider application-layer completion. |
| network | Network failure prevented reaching or completing the provider exchange. |
| provider_5xx | Provider-originated HTTP 5xx. |
| edge_proxy_5xx | Edge-generated or proxy-generated 5xx, including Cloudflare Worker or METIORO BFF failures. |
| auth_error | Authentication or authorization failure. |
| rate_limit | HTTP 429 or equivalent documented rate-limit response. |
| schema_error | Response could not be mapped to the expected schema/DTO. |
| empty_result | Successful transport with unusable empty result under evaluation rules. |
| invalid_timestamp | Timestamp present but invalid or unusable under evaluation rules. |
| duplicate_url | Duplicate URL condition under evaluation rules. |
| unknown | Residual class; use requires explicit justification in the report. |

Local harness failures MUST be identifiable and MUST NOT be silently folded into `provider_5xx`.

---

## Pass/Fail Mapping

| Outcome | Mapping rule |
| ------- | ------------ |
| Provider hard-gate PASS | All ratified hard gates meet their ratified thresholds for the run. |
| Provider hard-gate FAIL | Any ratified hard gate misses its ratified threshold. |
| Soft-gate signals | Recorded for comparison; do not alone determine architecture authorization. |
| Deferred / evidence-only | MUST NOT be mapped to hard-gate FAIL in benchmark v1. |
| INVALID_RUN | Reserved for PRG-03.5 when execution integrity fails (environment mismatch, incomplete freeze, corrupted evidence, etc.). |

PRG-03.5 performs automatic classification against this mapping and MUST NOT reinterpret thresholds.

---

## Threshold Governance

Every threshold MUST have all of the following fields:

| Field | Requirement |
| ----- | ----------- |
| Metric | Named metric or gate |
| Threshold | Numeric or logical threshold value |
| Evidence Basis | Basis for the threshold |
| Justification | Rationale text |
| Owner | Accountable owner |
| Version | Threshold register version |
| Approval date | UTC approval date |

Allowed Evidence Basis examples:

- Industry practice
- Operational assumption
- Product requirement
- ADR dependency

Rules:

1. Threshold justifications are version-controlled governance artifacts.
2. Changing the rationale requires an amendment just like changing the numeric threshold.
3. Unratified thresholds remain `PENDING RATIFICATION` and MUST NOT be invented in reports.
4. Post-hoc threshold changes after observing results are prohibited without amendment and a new run.

---

## Threshold Justification Register

Template (no numeric thresholds are invented herein):

| Metric | Threshold | Evidence Basis | Justification | Owner | Version | Approval date (UTC) |
| ------ | --------- | -------------- | ------------- | ----- | ------- | ------------------- |
| Provider Reachability | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| Infrastructure Failure Rate | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| DTO Success Rate | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| Missing Timestamp Rate | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| Effective FA Coverage | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| Latency | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| Duplicate URL rate | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| Freshness | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| EN locale success | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| AR locale success | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |
| RU locale success | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | PENDING RATIFICATION | 0.1.0 | PENDING RATIFICATION |

---

## Output Requirements

Each authorized run MUST produce a PRG-03.5 Benchmark Report that:

1. Cites exact PRG-03.3 eligibility record identity/version.
2. Cites exact PRG-03.3A RLP version.
3. Cites exact PRG-03.4 benchmark-definition version.
4. Records Execution Metadata and Environment Metadata.
5. Reports hard gates, soft gates, deferred gate evidence, evidence-only metrics, and error taxonomy results.
6. Contains no architecture recommendation, provider recommendation, or commercial negotiation advice.

---

## Amendment Rules

1. Material changes to metrics, gates, taxonomy, or thresholds require a new document version.
2. Promotion of HTTP 429, burst behavior, or any evidence-only metric to a gate requires amendment and a new benchmark run.
3. No retroactive gate promotion.
4. No retroactive rejection based on a newly promoted gate.
5. Threshold rationale changes require amendment equal in formality to numeric threshold changes.

---

## Ratification Checklist

Before this document may move from `IN REVIEW` to `RATIFIED`, the following MUST be confirmed:

- [ ] Preconditions reference PRG-03.3 PASS and ratified PRG-03.3A / PRG-03.4 versions.
- [ ] Provider Reachability is defined as reaching the provider application layer and receiving any HTTP response.
- [ ] Infrastructure Failure Rate counting rules exclude edge/proxy/BFF/harness failures while preserving diagnostic categories.
- [ ] Hard gates include Provider Reachability, Infrastructure Failure Rate, DTO Success Rate, Missing Timestamp Rate, and Effective FA Coverage.
- [ ] HTTP 429 is deferred as a hard gate and collected as evidence in benchmark v1.
- [ ] Soft gates and evidence-only metrics are listed as specified.
- [ ] Error taxonomy includes the required diagnostic categories.
- [ ] Threshold Justification Register exists; unratified values remain PENDING RATIFICATION.
- [ ] Threshold governance requires Metric, Threshold, Evidence Basis, Justification, Owner, Version, and Approval date.
- [ ] Rule recorded: threshold justifications are version-controlled; rationale changes require amendment.
- [ ] No invented numeric thresholds appear as if ratified.
- [ ] No approval names have been invented.

**Ratification status:** IN REVIEW  
**Ratified by:** PENDING RATIFICATION  
**Ratification date (UTC):** PENDING RATIFICATION  
