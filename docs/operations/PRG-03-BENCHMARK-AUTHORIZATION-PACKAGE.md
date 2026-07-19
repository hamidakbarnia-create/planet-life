# PRG-03 — Benchmark Authorization Package

**Document type:** Benchmark Authorization Package  
**Programme:** PRG-03 — Production News Provider Evaluation  
**Status:** PENDING AUTHORIZATION — BENCHMARK NOT AUTHORIZED  
**Date (UTC):** 2026-07-19  
**Branch:** governance-foundation  

This package is the final pre-execution authorization checklist for PRG-03 benchmark runs.  
It aligns with PRG-03.3 v0.1.1 provider independence.
It does **not** invent thresholds, approvals, or architecture decisions.
It does **not** authorize or execute a benchmark run.

---

## Decision Summary

| Field | Value |
| ----- | ----- |
| Authorization decision | **BENCHMARK NOT AUTHORIZED** |
| Decision date (UTC) | 2026-07-19 |
| Sole ELIGIBLE provider | Provider 003 — NewsData.io |
| May execution start now? | **No** |

### Why the benchmark is still not permitted (NewsData.io)

Under PRG-03.3 v0.1.1, NewsData.io authorization requires provider-scoped eligibility (already recorded) plus shared ratification items. The following still block NewsData.io:

1. **Effective Coverage Threshold (X) is not ratified**  
   Product acceptance bar for Effective FA Coverage (PRG-03.4 HG-05) remains PENDING PRODUCT RATIFICATION.

2. **Reference Load Profile (RLP) is not ratified**  
   PRG-03.3A remains unratified. No authorized workload version exists for a comparable run.

3. **PRG-03.4 Production Benchmark Definition is not ratified**  
   Document Control Owner/Approver identities remain PENDING RATIFICATION (**AUTHORITY UNDEFINED** until named). Environment Freeze not recorded.

**Not a NewsData.io authorization blocker:** Event Registry EG-08 UNKNOWN. Per PRG-03.3 v0.1.1, that gate blocks Event Registry only. Register Unknown Resolution may remain OPEN without programme-blocking NewsData.io.

**Binding rule restated:** Eligibility = PASS for a provider is necessary but not sufficient. Until X, RLP, and PRG-03.4 are ratified (and authorization is recorded), benchmark execution MUST NOT proceed. `UNKNOWN` is not permission.

**Stop line:** Do not start harness execution, probes-as-benchmark, or production load against any provider under this package.

---

## 1. Authorization Verdict

| Field | Value |
| ----- | ----- |
| Benchmark execution | **NOT AUTHORIZED** |
| Eligible provider(s) recorded | Provider 003 — NewsData.io (`ELIGIBLE`, Proceed = YES) |
| Providers resolved from prior UNKNOWN | Associated Press → `NOT_ELIGIBLE`; Reuters → `NOT_ELIGIBLE` |
| Remaining UNKNOWN provider / gate | Event Registry — **EG-08 only** (`BLOCKED_UNKNOWN`) — provider-scoped |
| Unknown Resolution (register) | OPEN (tracking only; not a NewsData.io authorization blocker under PRG-03.3 v0.1.1) |

---

## 2. Evidence Basis (read-only citations)

| Artifact | Path / identity | Role |
| -------- | --------------- | ---- |
| Evidence Register | `docs/operations/NEWS_PROVIDER_EVIDENCE_REGISTER.md` | PRG-03.2 / eligibility evidence |
| Provider Record | `docs/operations/NEWS_PROVIDER_RECORD.md` | Programme record + UNKNOWN-resolution sync |
| Eligibility method | `docs/governance/PRG-03.3-pre-benchmark-eligibility.md` v0.1.1 | Gate semantics + provider independence |
| Reference Load Profile | `docs/governance/PRG-03.3A-reference-load-profile.md` | Workload (pending ratification) |
| Benchmark definition | `docs/governance/PRG-03.4-production-benchmark-definition.md` | Method/thresholds (pending ratification) |
| Final Ratification Package | `docs/operations/PRG-03-FINAL-RATIFICATION-PACKAGE.md` | Exact X/RLP/authority tables |
| Report template | `docs/governance/PRG-03.5-benchmark-report.md` | Fact record template (not instantiated) |

---

## 3. Provider Disposition Summary

| Provider ID | Provider | Eligibility | Proceed to Benchmark | Notes |
| ----------- | -------- | ----------- | -------------------- | ----- |
| 001 | Guardian | NOT_ELIGIBLE | NO | Language Gate FAIL |
| 002 | New York Times | NOT_ELIGIBLE | NO | Commercial Availability FAIL |
| 003 | NewsData.io | ELIGIBLE | YES | Sole ELIGIBLE provider |
| 004 | Currents | NOT_ELIGIBLE | NO | FA Language Gate FAIL |
| 005 | Bing News Search | NOT_ELIGIBLE | NO | FA Language Gate FAIL |
| 006 | Event Registry | BLOCKED_UNKNOWN | NO | EG-08 UNKNOWN — blocks 006 only |
| 007 | World News API | NOT_ELIGIBLE | NO | Caching/storage FAIL |
| 008 | Associated Press | NOT_ELIGIBLE | NO | Redistribution/display FAIL (B2C) |
| 009 | Reuters | NOT_ELIGIBLE | NO | Language Gate FAIL |

---

## 4. Remaining UNKNOWN — exact statement

### 4.1 Event Registry (006) — gate breakdown

| Gate ID | Gate | State |
| ------- | ---- | ----- |
| EG-01 | Authentication | PASS |
| EG-02 | Commercial production access | PASS |
| EG-03 | Pricing | PASS |
| EG-04 | EN officially documented | PASS |
| EG-05 | AR officially documented | PASS |
| EG-06 | RU officially documented | PASS |
| EG-07 | FA officially documented | PASS |
| EG-08 | Automated polling permitted | **UNKNOWN** |
| EG-09 | Caching/storage permitted | NOT_EVALUATED |
| EG-10 | Redistribution/display restrictions verified | NOT_EVALUATED |
| EG-11 | Attribution requirements verified | NOT_EVALUATED |
| EG-12 | License compatible with METIORO World usage | NOT_EVALUATED |

| Field | Value |
| ----- | ----- |
| UNKNOWN gates (exact) | **EG-08 only** |
| Blocks Event Registry benchmark? | Yes |
| Blocks NewsData.io eligibility? | No |
| Blocks NewsData.io authorization? | No (PRG-03.3 v0.1.1) |

### 4.2 Associated Press / Reuters

Prior Authentication UNKNOWN items are **closed** (see Evidence Register).

---

## 5. Authorization Checklist

Use this checklist for any proposed PRG-03 benchmark run against a named provider. **AC-01–AC-09 must be checked before AUTHORIZE for that provider.**

### 5.1 Pre-conditions (mandatory for any run)

- [ ] **AC-01** Product Owner has ratified Effective Coverage Threshold **(X)** with version, owner, and UTC approval date.
- [ ] **AC-02** Operations has ratified a specific **PRG-03.3A RLP version**; the run will cite that exact version.
- [ ] **AC-03** **PRG-03.4** is ratified by its Document Control Owner and Approver (identities currently PENDING RATIFICATION / **AUTHORITY UNDEFINED** until named); the run will cite that exact version.
- [ ] **AC-04** Environment Freeze fields required by PRG-03.4 are completed and recorded (commit SHA, harness, region, runtime, network path, credential class, dataset version).
- [ ] **AC-05** No threshold, gate, or workload parameter will be invented or changed after observation begins.

### 5.2 Provider-specific (NewsData.io — Provider 003)

- [x] **AC-06** Evidence Register entry for Provider 003 is COMPLETE for eligibility gates in scope.
- [x] **AC-07** Provider 003 Eligibility = `ELIGIBLE` / PASS.
- [x] **AC-08** Provider 003 has no open `FAIL`, `UNKNOWN`, or `NOT_EVALUATED` eligibility gate in the register.
- [ ] **AC-09** Authorization Decision Block below records AUTHORIZE for Provider 003 with named authorities and UTC date.

### 5.3 Provider-scoped tracking (Event Registry — not required for NewsData.io AUTHORIZE)

- [ ] **AC-10** Event Registry EG-08 clarified to PASS or FAIL from official evidence (required only to authorize Event Registry; does not gate NewsData.io).
- [ ] **AC-11** Evidence Register Unknown Resolution marked COMPLETE when no provider-scoped UNKNOWN remains (tracking; not a NewsData.io authorization precondition under PRG-03.3 v0.1.1).

### 5.4 Checklist result (current)

| Checklist group | Result |
| --------------- | ------ |
| AC-01 … AC-05 (pre-conditions) | **FAIL** — X, RLP, and PRG-03.4 not ratified; PRG-03.4 Owner/Approver **AUTHORITY UNDEFINED** |
| AC-06 … AC-08 (NewsData.io eligibility) | PASS (recorded) |
| AC-09 (signed authorization) | **FAIL** — no AUTHORIZE recorded |
| AC-10 … AC-11 (Event Registry / Unknown Resolution tracking) | OPEN — does **not** fail NewsData.io authorization under PRG-03.3 v0.1.1 |

**Checklist verdict (NewsData.io):** Benchmark remains **NOT AUTHORIZED** (AC-01–AC-05 and AC-09).

---

## 6. Blockers to Clear Before Authorization

| # | Blocker | Authority (exact named role in repo) | Current Status | Scope |
| - | ------- | ------------------------------------ | -------------- | ----- |
| 1 | Effective Coverage Threshold (X) | Product Owner | PENDING PRODUCT RATIFICATION | Programme-wide (shared) |
| 2 | Reference Load Profile (RLP) | Operations | PRG-03.3A not ratified | Programme-wide (shared) |
| 3 | PRG-03.4 ratification | PRG-03.4 Document Control **Owner** and **Approver** — identities PENDING RATIFICATION → **AUTHORITY UNDEFINED** | NOT RATIFIED | Programme-wide (shared) |
| 4 | Environment Freeze recorded | Recorded at run time per PRG-03.4 (no separate named ratifying role beyond freeze completeness) | Not recorded | Programme-wide (shared) |
| 5 | Event Registry EG-08 UNKNOWN | Provider official documentation; Platform recorder for register update | OPEN | **Event Registry only** |

---

## 7. Authorization Decision Block

**Status:** PENDING AUTHORIZATION — BENCHMARK NOT AUTHORIZED  

| Role | Name | Decision (AUTHORIZE / DEFER / REJECT) | Date (UTC) | Confirmation |
| ---- | ---- | ------------------------------------- | ---------- | ------------ |
| Product Owner (X) | PENDING | PENDING | PENDING | PENDING |
| Operations (RLP) | PENDING | PENDING | PENDING | PENDING |
| PRG-03.4 Owner | PENDING / AUTHORITY UNDEFINED | PENDING | PENDING | PENDING |
| PRG-03.4 Approver | PENDING / AUTHORITY UNDEFINED | PENDING | PENDING | PENDING |
| Platform recorder | PENDING | N/A — records only | PENDING | PENDING |

No name, date, or authorization is invented.

---

## 8. Execution Boundary

When (and only when) shared blockers 1–4 are cleared, Authorization Checklist AC-01–AC-09 are checked for the named provider, and this Decision Block records AUTHORIZE for that provider and cited versions:

1. Instantiate a PRG-03.5 Benchmark Report shell citing exact PRG-03.3 / 03.3A / 03.4 versions.  
2. Freeze environment per PRG-03.4.  
3. Execute the ratified RLP only.  

AC-10/AC-11 are not preconditions for NewsData.io AUTHORIZE under PRG-03.3 v0.1.1.

Until then:

- No benchmark run  
- No threshold invention after observation  
- No architecture selection under PRG-03.6  
- Event Registry remains unauthorized while EG-08 is UNKNOWN

---

## 9. Package Control

| Field | Value |
| ----- | ----- |
| Package ID | PRG-03-BENCHMARK-AUTH |
| Package Version | 0.1.3 |
| Status | PENDING AUTHORIZATION — BENCHMARK NOT AUTHORIZED |
| Supersedes | 0.1.2 |
| Aligns to | PRG-03.3 v0.1.1 provider independence |
| Consolidation pointer | `docs/operations/PRG-03-FINAL-RATIFICATION-PACKAGE.md` |

---

**End of Benchmark Authorization Package — BENCHMARK NOT AUTHORIZED**
