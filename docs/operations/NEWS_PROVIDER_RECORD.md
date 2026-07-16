# PRG-03 — Production News Provider Evaluation Record

Status: In Progress
Branch: governance-foundation
Related: PRG-02, ADR-0008
Decision State: No provider selected

---

## 1. Problem Statement

PRG-02 is complete from an implementation, tests, CI, deployment, freshness, state contract, observability, and bounded-retry perspective.

The production reliability gate failed.

Google News RSS has been rejected as the sole primary provider.

Evidence included HTTP 503, TimeoutError, and intermittent success.

Current evidence does not prove confirmed rate limiting, because HTTP 429 was not observed.

PRG-03 must determine provider replacement or provider composition without changing existing contracts.

---

## 2. Frozen Contracts

The following must not change during PRG-03:

```text
ADR-0008 freshness policy
World external DTO
World state contract: ok | low_signal | unavailable
Publication-time freshness filtering
Bounded retry: exactly one retry
Total latency budget: 8000 ms
Existing production observability fields
Existing acceptance matrix methodology
```

Any prospective change to these items must occur outside PRG-03 and requires a separate ADR or governance approval.

---

## 3. Architectural Question

Decision question:

```text
Can one production provider satisfy reliability, legal, language, topic,
freshness and cost requirements for EN, FA, RU and AR?

If not, what primary + fallback or language-routed provider composition
satisfies the requirements without changing the World API contract?
```

The decision is among these options:

```text
A. Single provider
B. Primary provider + fallback provider
C. Language-routed providers
D. Primary provider + FA-specialized provider
```

None of these options has been selected yet.

---

## 4. Mandatory Hard Gates

These gates are binary. A provider that fails any hard gate cannot be the sole provider.

### 4.1 Authentication

```text
Authenticated API: required
Documented API key or equivalent: required
Anonymous scraping dependency: rejected
```

### 4.2 Legal and Production Use

```text
Commercial production use explicitly permitted
Terms of Service available
Automated API consumption permitted
Redistribution/display constraints documented
No dependency on undocumented scraping behavior
```

### 4.3 Data Contract

The provider must supply at least these fields, or they must be deterministically convertible:

```text
headline/title
canonical article URL
publication timestamp
source/publisher
language or language-filter capability
```

### 4.4 Reliability

```text
Documented quotas
Documented rate-limit behavior where available
Structured HTTP/API errors
Timeout-safe integration
Production plan available
```

A marketing claim such as “reliable” or “enterprise-grade” alone is not evidence.

### 4.5 Language Coverage

Required languages:

```text
en
fa
ru
ar
```

Language support must be evaluated in two independent columns:

```text
fa_parameter_supported
fa_effective_fresh_coverage
```

Accepting `language=fa` alone is not sufficient to pass.

### 4.6 Topic Coverage

Required topics:

```text
geopolitics
markets
realEstate
```

The provider must have a sufficient query/search mechanism to extract these three topics.

### 4.7 Freshness

Results must have publication timestamps and must be able to pass ADR-0008.

Timestamps such as crawl time, ingestion time, or update time must not be used as publication time without proof.

---

## 5. Candidate Status Definitions

Allowed statuses:

```text
PENDING
EVIDENCE_PENDING
DOCS_VERIFIED
PROBE_REQUIRED
PROBE_PASSED
PROBE_FAILED
REJECTED_HARD_GATE
SHORTLISTED
SELECTED
```

Rules:

* Absence of `fa` from the official language list:
  `REJECTED_HARD_GATE` for sole-provider
* Acceptance of `fa` without sufficient volume:
  `PROBE_FAILED`
* Unclear information:
  `PROBE_REQUIRED`
* No provider may be shortlisted from a marketing page alone.

---

## 6. Evidence Standards

Every claim must record one of these evidence types:

```text
OFFICIAL_DOC
OFFICIAL_PRICING
OFFICIAL_TERMS
OFFICIAL_API_RESPONSE
PRODUCTION_PROBE
SUPPORT_CONFIRMATION
UNKNOWN
```

Rules:

* Only official documentation is valid for capabilities, pricing, quotas, and ToS.
* Blog posts, Reddit, comparison sites, and model-generated summaries are not final evidence.
* URLs must be recorded without `utm_source` or tracking parameters.
* An access date must be recorded for every source.
* If a document is JS-rendered or ambiguous, status remains `UNKNOWN` or `PROBE_REQUIRED`.
* Absence of evidence must never be interpreted as supported.

```text
No provider status may transition to DOCS_VERIFIED
until the corresponding Evidence Register entry contains:

- official documentation URL
- access date
- evidence type
- reviewer confirmation
```

---

## Evidence Register

Every provider claim must reference a concrete evidence record.

| Provider     | Evidence Type | Official URL | Access Date (UTC) | Scope              | Status  |
| ------------ | ------------- | ------------ | ----------------- | ------------------ | ------- |
| GNews        | UNKNOWN       |              |                   | Language support   | PENDING |
| Mediastack   | UNKNOWN       |              |                   | Language support   | PENDING |
| NewsAPI.org  | UNKNOWN       |              |                   | Language support   | PENDING |
| NewsData.io  | UNKNOWN       |              |                   | Language support   | PENDING |
| The News API | UNKNOWN       |              |                   | Language support   | PENDING |
| Currents API | UNKNOWN       |              |                   | Language support   | PENDING |

Rules:

* URL must be official.
* URL must not contain `utm_*` or tracking parameters.
* Access Date is mandatory.
* Until evidence is recorded, Status remains `PENDING`.

---

## 7. Candidate Inventory

| Provider     | Current Status   | Sole-provider Eligibility | Reason                                                                     |
| ------------ | ---------------- | ------------------------: | -------------------------------------------------------------------------- |
| GNews        | EVIDENCE_PENDING |                   Unknown | Official language support does not include Persian                         |
| Mediastack   | EVIDENCE_PENDING |                   Unknown | Official language support does not include Persian                         |
| NewsAPI.org  | EVIDENCE_PENDING |                   Unknown | Official language support does not include Persian                         |
| NewsData.io  | PROBE_REQUIRED   |                   Unknown | Persian parameter and effective fresh coverage require direct verification |
| The News API | PROBE_REQUIRED   |                   Unknown | Persian parameter and effective fresh coverage require direct verification |
| Currents API | PENDING          |                   Unknown | Full official verification not yet completed                               |

These statuses are not a final provider selection.

Until the Evidence Register is complete, no provider may be treated as documentation-verified. FA-related Comparison Matrix cells remain `UNKNOWN` and will be filled only after Evidence Register entries are recorded.

---

## 8. Comparison Matrix

| Criterion                    | GNews   | Mediastack | NewsAPI.org | NewsData.io | The News API | Currents API |
| ---------------------------- | ------- | ---------- | ----------- | ----------- | ------------ | ------------ |
| Authenticated API            | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Production plan              | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Commercial use verified      | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Official ToS reviewed        | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Documented quota             | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Documented rate limits       | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Structured errors            | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Publication timestamp        | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Timestamp semantics verified | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| EN documented                | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| AR documented                | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| RU documented                | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| FA documented                | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| `language=fa` accepted       | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| FA geopolitics fresh volume  | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| FA markets fresh volume      | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| FA real estate fresh volume  | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| EN topic coverage            | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| AR topic coverage            | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| RU topic coverage            | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Search/query support         | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Source/domain filtering      | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Monthly production cost      | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Overage behavior             | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Integration complexity       | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Fallback suitability         | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |
| Sole-provider eligible       | UNKNOWN | UNKNOWN    | UNKNOWN     | UNKNOWN     | UNKNOWN      | UNKNOWN      |

Cells without evidence remain `UNKNOWN`, not `No`.

FA-related cells remain `UNKNOWN` for all providers until corresponding Evidence Register entries are complete.

---

## 9. Persian Capability Model

### 9.1 Parameter Support

```text
fa_parameter_supported = provider accepts an official documented Persian
language code or a real API request with Persian filtering without validation error.
```

This only establishes API-level capability.

### 9.2 Effective Coverage

```text
fa_effective_fresh_coverage = provider returns a sufficient number of genuinely
Persian, relevant, publication-timestamped and ADR-0008-fresh articles.
```

This establishes practical capability.

### 9.3 Invalid Equivalences

The following equivalences are explicitly rejected:

```text
parameter accepted != usable coverage
article mentions Iran != Persian-language article
source located in Iran != Persian-language article
crawl timestamp != publication timestamp
translated article != native Persian coverage
one successful query != production reliability
```

---

## 10. Probe Specification

Probes may run only for providers that have lawful credentials and development access.

### Matrix

```text
Languages:
en
fa
ru
ar

Topics:
geopolitics
markets
realEstate
```

In the initial stage, decision-critical focus is on `fa`.

### Minimum Persian Probe

For each provider with plausible FA support, execute these three cells:

```text
fa / geopolitics
fa / markets
fa / realEstate
```

Each cell must be executed multiple times so intermittent behavior can be observed.

### Probe Output Fields

Record for each run:

```text
provider
timestamp UTC
topic
requested language
HTTP status
API error code
latency ms
raw item count
items with publication timestamp
items passing ADR-0008
items detected as Persian
items relevant to requested topic
duplicates
oldest accepted publication time
newest accepted publication time
```

No article body or secret may be stored in the repository.

### Persian Detection

Language verification must not rely only on provider metadata.

In the probe, at least these checks must be performed:

```text
provider language field
Persian script presence
headline language
source/domain
manual sample inspection
```

---

## 11. Preliminary Probe Acceptance Rule

This rule is recorded as a pre-registered draft. It is not final unless governance approval is granted.

For each FA/topic cell:

```text
PASS candidate:
- request succeeds
- no contract-invalid payload
- at least 5 unique articles pass ADR-0008
- at least 80% of accepted headlines are genuinely Persian
- articles are relevant to requested topic
```

Reliability probe:

```text
A cell fails if >=2 runs return unavailable or fewer than the minimum usable
fresh article count.
```

The final threshold must be frozen before the production benchmark runs.

The threshold must not be changed after results are observed.

---

## 12. Architecture Decision Rules

### Single Provider

Allowed only when one provider:

```text
passes all hard gates
passes EN/FA/RU/AR coverage
passes topic coverage
passes freshness requirements
passes production reliability benchmark
has acceptable cost and ToS
```

### Primary + Fallback

Consider when:

```text
one provider is strongest for EN/AR/RU
but cannot satisfy FA
or primary reliability requires a second independent upstream
```

Fallback must not merely consume the same upstream via another path or hostname, unless independence is proven.

### Language-Routed Architecture

Consider when:

```text
FA coverage is structurally unavailable from the strongest primary providers
but another provider can satisfy FA independently.
```

The external World DTO and state contract must remain unchanged.

---

## 13. Cost Model

For each provider, record:

```text
monthly base cost
included requests
estimated monthly requests
overage cost
historical data surcharge
commercial/production plan requirement
currency
tax assumptions
contract minimum
cancellation commitment
```

Pricing must be recorded with an access date and official source.

---

## 14. Provider Independence

For fallback, evaluate:

```text
Does provider B depend on the same upstream corpus or ranking system as provider A?
Does failure of the shared upstream affect both?
Are infrastructure, source ingestion or API delivery independently operated?
```

If independence is unclear, fallback quality must be recorded as `UNKNOWN`.

---

## 15. Rollout Constraints

Adapter implementation must not start until:

```text
comparison matrix is materially complete
hard-gate rejections are recorded
at most three candidates are shortlisted
decision rationale has been reviewed
```

Subsequent rollout must include:

```text
provider interface
secret management
mapping to existing DTO
existing freshness policy
existing retry policy
existing observability
production deployment
same acceptance matrix
rollback path
```

---

## 16. Decision Log

| Date       | Decision                                                            | Evidence                                   | Author   | Status |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------ | -------- | ------ |
| 2026-07-16 | Google News RSS rejected as sole primary provider                   | PRG-02 production benchmark                | Platform | Final  |
| 2026-07-16 | Provider selection not yet made                                     | Persian and production evidence incomplete | Platform | Open   |
| 2026-07-16 | FA parameter support and effective FA coverage evaluated separately | Governance requirement                     | Platform | Final  |

---

## 17. Open Questions

```text
Does NewsData.io officially support `fa`?
Does The News API officially support `fa`?
Does Currents API officially support `fa`?
What is the actual fresh Persian volume by topic?
Are publication timestamps original publication times?
What are the production and redistribution restrictions?
Are candidate fallback providers operationally independent?
What is the minimum acceptable monthly cost?
```

---

## 18. Exit Criteria

PRG-03 is complete only when:

```text
official evidence collected
hard gates applied
maximum three providers shortlisted
probe results recorded
architecture selected
provider adapter implemented
CI passes
production deployment succeeds
production acceptance matrix passes
decision record finalized
PRG-02 formally closed
```

---

## Governance Rule

Provider evaluation proceeds in four independent stages:

1. Official documentation review
2. Evidence registration
3. Controlled API probe
4. Production benchmark

Passing one stage does not imply passing any later stage.
