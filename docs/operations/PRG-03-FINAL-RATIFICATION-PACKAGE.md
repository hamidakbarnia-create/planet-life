# PRG-03 — Final Ratification Package

**Document type:** Final Ratification Package (consolidated)
**Programme:** PRG-03 — Production News Provider Evaluation
**Status:** PENDING AUTHORITY DECISIONS — BENCHMARK NOT AUTHORIZED
**Date (UTC):** 2026-07-19
**Branch:** governance-foundation
**HEAD at preparation:** `006c49b9`

This package consolidates remaining ratification decisions and records conflict resolution under PRG-03.3 v0.1.1.
It does **not** invent thresholds, providers, architecture, or benchmark parameters.
It does **not** invent named-person approval.
It does **not** authorize or execute a benchmark run.
It does **not** change Event Registry EG-08 from UNKNOWN or NewsData.io from ELIGIBLE.

---

## Decision Summary

| Field | Value |
| ----- | ----- |
| Conflict resolution | Unresolved eligibility gates block **the affected provider only** (PRG-03.3 v0.1.1) |
| Sole ELIGIBLE provider | Provider 003 — NewsData.io |
| Event Registry | EG-08 UNKNOWN → unauthorized for benchmarking (provider-scoped) |
| Final authorization verdict | **BENCHMARK NOT AUTHORIZED** |
| May execution start now? | **No** |

---

## 1. Exact conflict and resolution

### 1.1 Conflict (as identified)

| Side | Statement |
| ---- | --------- |
| A — PRG-03.3 | Eligibility / UNKNOWN / FAIL / NOT_EVALUATED gates are **provider-scoped** (“for that provider”). |
| B — prior packaging | Evidence Register Benchmark Execution Authorization reason (3) and Auth Package Decision Summary / AC-10–AC-11 treated Event Registry EG-08 UNKNOWN as a **programme-level** benchmark blocker while NewsData.io remained independently ELIGIBLE. |

### 1.2 Resolution (smallest clarification)

**Rule:** Unresolved gates block **only the affected provider**, unless an existing ratified rule explicitly requires programme-level blocking. No such ratified programme-level rule exists for another provider’s EG UNKNOWN.

**Applied:**
- Event Registry EG-08 UNKNOWN → blocks Event Registry only; Event Registry remains unauthorized.
- NewsData.io eligibility unchanged (`ELIGIBLE` / Proceed = YES).
- NewsData.io authorization still blocked by shared ratification items (X, RLP, PRG-03.4, Environment Freeze, AUTHORIZE signature) — not by EG-08.
- Register Unknown Resolution may remain OPEN without programme-blocking NewsData.io.

**Canonical text:** PRG-03.3 v0.1.1 binding rule 7 + Benchmark Authorization Rule (provider independence). Packaging artifacts aligned in Evidence Register, Benchmark Authorization Package v0.1.3, this package v0.1.2, and NEWS_PROVIDER_RECORD decision log.

---

## 2. Exact unresolved ratification decisions

| # | Decision | Canonical artifact | Current status | Authority |
| - | -------- | ------------------ | -------------- | --------- |
| D1 | Effective Coverage Threshold **(X)** for HG-05 | `NEWS_PROVIDER_RECORD.md` §11 (draft proposal); PRG-03.4 Threshold Register; Auth Package AC-01 | PENDING PRODUCT RATIFICATION | **Product Owner** |
| D2 | Reference Load Profile (PRG-03.3A) ratification | `docs/governance/PRG-03.3A-reference-load-profile.md` v0.1.0 | IN REVIEW — see §4 parameter table | **Operations** (Auth Package AC-02); Document Control Owner/Approver identities PENDING RATIFICATION → **AUTHORITY UNDEFINED** until named |
| D3 | PRG-03.4 Production Benchmark Definition ratification | `docs/governance/PRG-03.4-production-benchmark-definition.md` v0.1.0 | IN REVIEW | Canonical roles: Document Control **Owner** and **Approver** in PRG-03.4 § Document Control (values `PENDING RATIFICATION`). No named identity or alternate Governance/Ratification Authority is defined elsewhere in the repository → retain **AUTHORITY UNDEFINED** for named identities |
| D4 | Event Registry EG-08 | Evidence Register Provider 006 | OPEN — EG-08 UNKNOWN | Provider official documentation for PASS/FAIL; **Platform recorder** for register update. Scope: **Event Registry only** (resolved packaging) |

---

## 3. Exact X decision table (Effective Coverage Threshold)

**Status:** PRODUCT PROPOSAL ONLY — not ratified.
**Provenance:** `NEWS_PROVIDER_RECORD.md` §11 Preliminary Probe Acceptance Rule (existing draft wording only).
**Metric name:** Effective FA Coverage (PRG-03.4 HG-05).

| Field | Exact decision from existing proposed wording | Status |
| ----- | --------------------------------------------- | ------ |
| Exact metric numerator (volume bar) | Count of **unique articles** that **pass ADR-0008** (with cell PASS also requiring: request succeeds; no contract-invalid payload; articles relevant to requested topic) | PROPOSED — `at least 5 unique articles pass ADR-0008` |
| Exact metric denominator (volume bar) | Not a ratio for X_cell; absolute minimum count **5** unique ADR-0008-passing articles per FA/topic cell | PROPOSED — absolute threshold, not N/D |
| Exact metric numerator (language bar) | Count of **accepted headlines** that are **genuinely Persian** | PROPOSED — `at least 80% of accepted headlines are genuinely Persian` |
| Exact metric denominator (language bar) | Count of **accepted headlines** in the cell | PROPOSED wording uses “accepted headlines”; precise membership filters for “accepted” beyond §11 bullets | **MISSING DECISION** (filters that define the accepted set are not further specified) |
| Unit of evaluation | One **FA × topic cell** | PROPOSED — §11 “For each FA/topic cell” |
| Per-cell or aggregate application | **Per-cell**; prior packaging proposed HG-05 PASS only when **every** FA × topic cell meets the bars | PROPOSED in prior Final Package / product posture; §11 itself states per-cell PASS candidate and reliability fail rule |
| Treatment of deduplication | Volume bar uses **unique** articles | PROPOSED — “at least 5 **unique** articles”; further dedup key (URL vs other) | **MISSING DECISION** for exact uniqueness key |
| Treatment of fallback content | Not specified in §11 proposed wording | **MISSING DECISION** |
| PASS equality rule | Volume: **≥ 5** unique ADR-0008-passing articles; Language: **≥ 80%** genuinely Persian accepted headlines; Reliability: cell fails if **≥ 2** runs unavailable or below minimum usable fresh count | PROPOSED — “at least” / “>=2” wording |
| All-language or FA-only scope | **FA-only** for this threshold (`fa` × topic cells); §10 states decision-critical focus on `fa` in the initial stage | PROPOSED — FA/topic cells only |
| Numeric shorthand | **X_cell = 5** plus **≥80%** Persian headlines among accepted | PROPOSED packaging notation for the §11 bundle |

**Ratification note:** Completing D1 requires Product Owner approval of the §11 bundle **and** resolution of every **MISSING DECISION** row above (or explicit retention of MISSING with a recorded deferral that still permits first-run classification). No invented values are supplied here.

---

## 4. Exact RLP parameter table

Source: `docs/governance/PRG-03.3A-reference-load-profile.md` v0.1.0. Read line-by-line from Required Parameters, Benchmark Load Profile, Burst Window, Concurrency, Quota Assumptions, and Action Items. No values invented.

For Required Parameters whose source table has only a Status column, the recorded status **is** the extracted content. Prior packaging that wrote “(none recorded)” for those rows was incorrect; the source records `PENDING RATIFICATION`.

| Parameter | Current proposed value (exact source text) | Current status | Ratifying authority | Source artifact and section |
| --------- | ------------------------------------------ | -------------- | ------------------- | --------------------------- |
| Topics | PENDING RATIFICATION | PENDING RATIFICATION | Operations (Auth Package AC-02); PRG-03.3A Document Control Owner/Approver identities → **AUTHORITY UNDEFINED** until named | PRG-03.3A § Required Parameters |
| Locales | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters |
| Queries per locale/topic cell | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters |
| Request interval | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters |
| Benchmark duration | See Benchmark Load Profile (six-hour benchmark window currently specified for cadence framing) | Pointer to Benchmark Load Profile (not PENDING RATIFICATION in Required Parameters table) | same | PRG-03.3A § Required Parameters |
| Benchmark window | Six-hour benchmark window | Specified for cadence framing | same | PRG-03.3A § Benchmark Load Profile — Current benchmark cadence |
| Production implication | None | Recorded | same | PRG-03.3A § Benchmark Load Profile — Current benchmark cadence |
| Concurrency (Required Parameters) | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters |
| Concurrent request level | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Concurrency |
| Relationship to production concurrency | Not implied; production concurrency remains unresolved until ratified separately | Recorded | same | PRG-03.3A § Concurrency |
| Burst size | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters; § Burst Window |
| Burst interval | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters; § Burst Window |
| Cache assumptions | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters |
| Authentication assumptions | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters |
| Region/network assumptions | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Required Parameters |
| Plan tier assumed for benchmark credentials | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Quota Assumptions |
| Request budget assumed for the six-hour window | PENDING RATIFICATION | PENDING RATIFICATION | same | PRG-03.3A § Quota Assumptions |
| Handling when provider quota is exhausted mid-run | PENDING RATIFICATION (see Failure Handling Strategy Action Item) | PENDING RATIFICATION | same | PRG-03.3A § Quota Assumptions |

**Cadence rules recorded in PRG-03.3A (not numeric parameters):** benchmark cadence does not imply production cadence; production cadence remains unresolved until ratified separately; six-hour window is a measurement window only (PRG-03.3A § Benchmark Load Profile — Explicit cadence rules).

**Burst rules recorded in PRG-03.3A (not numeric parameters):** burst evidence is evidence-only unless amended; promotion of HTTP 429 or burst behavior to a gate requires a new benchmark run; no retroactive gate promotion (PRG-03.3A § Burst Window).

**Non-RLP inputs (not ratified RLP values):** locales `en`/`fa`/`ru`/`ar` and topics `geopolitics`/`markets`/`realEstate` appear in Evidence Register / NEWS_PROVIDER_RECORD probe design; they MUST NOT be treated as ratified RLP content until entered in a ratified PRG-03.3A version.

**Production action items (not Required Parameters; out of benchmark RLP value invention):**

| Action item | Status | Owner | Source |
| ----------- | ------ | ----- | ------ |
| PRG-03.3A-AI-01 Production Polling Strategy | OPEN — PENDING RATIFICATION | PENDING RATIFICATION | PRG-03.3A § Production Polling Strategy Action Item |
| PRG-03.3A-AI-02 Failure Handling Strategy | OPEN — PENDING RATIFICATION | PENDING RATIFICATION | PRG-03.3A § Failure Handling Strategy Action Item |

---

## 5. Authority table

### 5.1 Repository search result (PRG-03.4 Owner / Approver)

| Search term | Result for PRG-03.4 named identity |
| ----------- | ---------------------------------- |
| Document Control Owner / Approver | Role labels appear as Document Control fields on PRG-03.3 / 03.3A / 03.4 / 03.5 / 03.6; values are `PENDING RATIFICATION` |
| Owner / Approver | Same Document Control tables; no named person assigned for PRG-03.4 |
| Governance Authority | No repository hit defining a PRG-03.4 Governance Authority |
| Ratification Authority | No repository hit defining a PRG-03.4 Ratification Authority |

**Canonical source for D3 roles:** `docs/governance/PRG-03.4-production-benchmark-definition.md` § Document Control — Owner = `PENDING RATIFICATION`; Approver = `PENDING RATIFICATION`. Named identities remain **AUTHORITY UNDEFINED**.

### 5.2 Decision authorities

| Decision | Exact named role in repository documents | Named identity | Blocker? |
| -------- | ---------------------------------------- | -------------- | -------- |
| D1 — Effective Coverage Threshold (X) | **Product Owner** (Auth Package AC-01; programme packaging) | PENDING | Yes — PENDING PRODUCT RATIFICATION |
| D2 — RLP ratification | **Operations** (Auth Package AC-02); PRG-03.3A Document Control **Owner** / **Approver** (`PENDING RATIFICATION`) | PENDING | Yes — RLP not ratified; Owner/Approver identity assignment **AUTHORITY UNDEFINED** |
| D3 — PRG-03.4 ratification | PRG-03.4 Document Control **Owner** and **Approver** (canonical: PRG-03.4 § Document Control) | PENDING | Yes — **AUTHORITY UNDEFINED** (identities not assigned); document IN REVIEW |
| D4 — EG-08 register update | **Platform recorder** (Auth Package / this package — records only); PASS/FAIL from provider official documentation | PENDING | Blocks **Event Registry only** |
| Authorization Decision Block signature | Product Owner (X); Operations (RLP); PRG-03.4 Owner; PRG-03.4 Approver; Platform recorder | PENDING | Yes — no AUTHORIZE recorded |
| Environment Freeze completeness | Recorded at run time per PRG-03.4 (fields required; no separate invented role) | Not recorded | Yes — programme-wide shared precondition |

Vague label **“Platform / Ops governance”** is **retired** for D3 in favour of the Document Control Owner/Approver roles above.

---

## 6. Provider-scoped versus programme-scoped blocker table

| Blocker | Applies to NewsData.io (003)? | Applies to Event Registry (006) only? | Programme-wide (shared)? |
| ------- | ----------------------------- | ------------------------------------- | ------------------------ |
| NewsData.io eligibility gates incomplete / FAIL / UNKNOWN | No (all eligibility gates PASS; ELIGIBLE) | N/A | No |
| Event Registry EG-08 UNKNOWN | **No** | **Yes** | **No** (resolved) |
| Event Registry EG-09–EG-12 NOT_EVALUATED | **No** | **Yes** (short-circuit while EG-08 UNKNOWN) | **No** |
| Effective Coverage Threshold (X) unratified | Yes | Yes (if 006 were otherwise eligible) | **Yes** (shared) |
| RLP (PRG-03.3A) unratified | Yes | Yes (if 006 were otherwise eligible) | **Yes** (shared) |
| PRG-03.4 unratified / Owner-Approver AUTHORITY UNDEFINED | Yes | Yes (if 006 were otherwise eligible) | **Yes** (shared) |
| Environment Freeze not recorded | Yes | Yes | **Yes** (shared) |
| AUTHORIZE signature missing (AC-09) | Yes | Yes | **Yes** (shared per named provider run) |
| Register Unknown Resolution OPEN | Tracking only — **does not** block 003 under PRG-03.3 v0.1.1 | Reflects EG-08 OPEN | **No** (not a programme authorization blocker) |

### 6.1 Final authorization calculation

| Class | Blockers |
| ----- | -------- |
| Blockers applying to NewsData.io | D1 X; D2 RLP; D3 PRG-03.4 (+ AUTHORITY UNDEFINED identities); Environment Freeze; AC-09 AUTHORIZE |
| Blockers applying only to Event Registry | EG-08 UNKNOWN; EG-09–EG-12 NOT_EVALUATED (short-circuit); Proceed = NO |
| Blockers applying programme-wide | Shared ratification: X, RLP, PRG-03.4, Environment Freeze discipline, signed AUTHORIZE for the named provider |
| Conditions to change verdict to **BENCHMARK AUTHORIZED** (NewsData.io) | (1) Product Owner ratifies X (resolving MISSING DECISION fields or recording explicit deferrals that still permit HG-05 classification); (2) Operations ratifies a specific PRG-03.3A version with Required Parameters valued or expressly completed for first run; Document Control identities assigned; (3) PRG-03.4 Document Control Owner and Approver identities assigned and document ratified; (4) Environment Freeze recorded; (5) Authorization Decision Block records AUTHORIZE for Provider 003 citing exact versions. **Not required:** Event Registry EG-08 closure. |
| Conditions to authorize Event Registry | All NewsData.io shared conditions **plus** EG-08 clarified to PASS from official evidence **and** remaining short-circuited gates evaluated to PASS (no FAIL/UNKNOWN/NOT_EVALUATED). |

---

## 7. Final authorization verdict

| Field | Value |
| ----- | ----- |
| Verdict | **BENCHMARK NOT AUTHORIZED** |
| NewsData.io | ELIGIBLE; blocked by shared ratification (X, RLP, PRG-03.4, freeze, AUTHORIZE) — **not** by EG-08 |
| Event Registry | **Not authorized** — EG-08 UNKNOWN |
| Benchmark execution | **Prohibited** |

**Stop line:** Do not start harness execution, probes-as-benchmark, or production load.

---

## 8. Approval Block (blank — no invented approval)

| Role | Name | Decision | Date (UTC) | Confirmation |
| ---- | ---- | -------- | ---------- | ------------ |
| Product Owner (D1 — X) | PENDING | PENDING | PENDING | PENDING |
| Operations (D2 — RLP) | PENDING | PENDING | PENDING | PENDING |
| PRG-03.4 Document Control Owner (D3) | PENDING / AUTHORITY UNDEFINED | PENDING | PENDING | PENDING |
| PRG-03.4 Document Control Approver (D3) | PENDING / AUTHORITY UNDEFINED | PENDING | PENDING | PENDING |
| Platform recorder | PENDING | N/A — records only | PENDING | PENDING |

---

## 9. Package Control

| Field | Value |
| ----- | ----- |
| Package ID | PRG-03-FINAL-RATIF |
| Package Version | 0.1.2 |
| Status | PENDING AUTHORITY DECISIONS — BENCHMARK NOT AUTHORIZED |
| Supersedes | 0.1.1 |
| Aligns to | PRG-03.3 v0.1.1 provider independence |
| Related | Evidence Register; NEWS_PROVIDER_RECORD; PRG-03-BENCHMARK-AUTHORIZATION-PACKAGE v0.1.3 |
| Audit | 2026-07-19 pre-commit: RLP extraction corrected against PRG-03.3A; PRG-03.4 Owner/Approver retained AUTHORITY UNDEFINED with canonical Document Control citation |

---

**End of Final Ratification Package — BENCHMARK NOT AUTHORIZED**
