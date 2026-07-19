# NEWS PROVIDER EVIDENCE REGISTER

Status: IN PROGRESS  
Branch: governance-foundation  
Programme: PRG-03 — Production News Provider Evaluation  

### Document Control — Provenance Note

Providers 001–003 restored from the Product Owner-approved execution transcript after the original results were found not to have been persisted in the repository.

This transcript is the authoritative source only for the previously approved evaluation outcomes. It is not an official provider documentation source.

---

## Evaluation Standard

PRG-03.3 Pre-Benchmark Eligibility (documentation-only eligibility stage).

Decision states used for gate cells: `PASS` | `FAIL` | `UNKNOWN` | `NOT_EVALUATED`.

Eligibility outcomes used for provider disposition:

- `ELIGIBLE`
- `NOT_ELIGIBLE`
- `BLOCKED_UNKNOWN`

Rules applied:

- `FAIL` blocks benchmark.
- `UNKNOWN` blocks benchmark until clarified. `UNKNOWN` is not permission.
- `NOT_EVALUATED` means evidence work is incomplete and blocks benchmark.
- Short-circuit evaluation applies after the first blocking non-language gate outcome.
- Language Gate evaluates all Supported Language Snapshot locales even if the first language fails.
- Official documentation only. No AI summaries. No third-party comparisons.
- Effective real-world Persian coverage remains a benchmark metric even when FA is officially documented.

---

## Snapshot Information

| Field | Value |
| ----- | ----- |
| Product Configuration Commit | `556079e3` — feat(web): complete PRG-02 world news state contract |
| Supported Language Snapshot | `en`, `fa`, `ru`, `ar` |
| Evaluation Date (UTC) | 2026-07-19 |
| Reviewer | Platform |
| Methodology Reference | `docs/governance/PRG-03.3-pre-benchmark-eligibility.md` |

---

## Provider 001 — Guardian

### Provider ID

001

### Provider Name

Guardian (Open Platform / Content API)

### Evaluation Status

COMPLETE

### Eligibility Outcome

NOT_ELIGIBLE

### Reason

Language Gate FAIL

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| Open Platform access / key tiers | https://open-platform.theguardian.com/access/ | 2026-07-19 |
| Open Platform documentation | https://open-platform.theguardian.com/documentation/ | 2026-07-19 |
| Open Platform terms | https://www.theguardian.com/open-platform/terms-and-conditions | 2026-07-19 |
| Content API editions (api-key=test) | https://content.guardianapis.com/editions | 2026-07-19 |

### Authentication

PASS

### Commercial Availability

PASS

### Pricing

UNKNOWN

### Legal Gates

PASS

### Language Gate

| Locale | Result |
| ------ | ------ |
| EN | PASS |
| FA | FAIL |
| AR | FAIL |
| RU | FAIL |

### Documentation vs Coverage Notes

Effective FA Coverage remains a benchmark metric and is not decided here.

### Evidence Notes

Outcomes restored from the Product Owner-approved execution transcript. This transcript is not an official provider source.

### Decision

NOT_ELIGIBLE — Language Gate FAIL.

### Proceed to Benchmark

NO

---

## Provider 002 — New York Times

### Provider ID

002

### Provider Name

New York Times (Developer APIs / Article Search)

### Evaluation Status

COMPLETE

### Eligibility Outcome

NOT_ELIGIBLE

### Reason

Commercial Availability FAIL

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| Developer portal | https://developer.nytimes.com/ | 2026-07-19 |
| Article Search overview | https://developer.nytimes.com/docs/articlesearch-product/1/overview | 2026-07-19 |
| Get Started | https://developer.nytimes.com/get-started | 2026-07-19 |
| Article Search API (unauthenticated probe) | https://api.nytimes.com/svc/search/v2/articlesearch.json | 2026-07-19 |

### Authentication

PASS

### Commercial Availability

FAIL

### Pricing

NOT_EVALUATED

### Legal Gates

NOT_EVALUATED

### Language Gate

NOT_EVALUATED

### Documentation vs Coverage Notes

Language Gate not evaluated under approved short-circuit after Commercial Availability FAIL.

### Evidence Notes

Outcomes restored from the Product Owner-approved execution transcript. This transcript is not an official provider source.

### Decision

NOT_ELIGIBLE — Commercial Availability FAIL.

### Proceed to Benchmark

NO

---

## Provider 003 — NewsData.io

### Provider ID

003

### Provider Name

NewsData.io

### Evaluation Status

COMPLETE

### Eligibility Outcome

ELIGIBLE

### Reason

Passed all eligibility gates

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| Documentation | https://newsdata.io/documentation | 2026-07-19 |
| Pricing | https://newsdata.io/pricing | 2026-07-19 |
| Terms | https://newsdata.io/terms | 2026-07-19 |
| Official documentation bundle (Supported Languages; Authentication) | https://s.newsdata.io/assets/DocumentationPage-Cjh09Tba.js | 2026-07-19 |
| Official terms bundle | https://s.newsdata.io/assets/TermsConditions-CjW6fGAk.js | 2026-07-19 |
| Official pricing bundle | https://s.newsdata.io/assets/Pricing-BF77I1Ty.js | 2026-07-19 |

### Authentication

PASS

### Commercial Availability

PASS

### Pricing

PASS

### Legal Gates

PASS

### Language Gate

| Locale | Result |
| ------ | ------ |
| EN | PASS |
| FA | PASS |
| AR | PASS |
| RU | PASS |

### Documentation vs Coverage Notes

Effective FA Coverage remains a benchmark metric and is not decided here.

### Evidence Notes

Outcomes restored from the Product Owner-approved execution transcript. This transcript is not an official provider source.

### Decision

ELIGIBLE — Passed all eligibility gates.

### Proceed to Benchmark

YES

---

## Provider 004 — Currents

### Provider ID

004

### Provider Name

Currents API

### Evaluation Status

COMPLETE

### Eligibility Outcome

NOT_ELIGIBLE

### Reason

Language Gate FAIL for FA. Official available-languages API response does not include Persian / Farsi / `fa`.

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| Documentation | https://currentsapi.services/en/docs/ | 2026-07-19 |
| Pricing | https://currentsapi.services/en/pricing | 2026-07-19 |
| Available languages | https://api.currentsapi.services/v1/available/languages | 2026-07-19 |
| Latest news (unauthenticated probe) | https://api.currentsapi.services/v1/latest-news | 2026-07-19 |

### Authentication

PASS — Official documentation requires an API key via `Authorization` / `Authorization: Bearer` header.

### Commercial Availability

PASS — Official Pricing page documents paid Builder / Professional / Scale plans, including Professional described for production workflows.

### Pricing

PASS — Official Pricing page documents Free and paid plan prices and quotas.

### Legal Gates

| Gate | Result |
| ---- | ------ |
| Automated polling permitted | NOT_EVALUATED |
| Caching/storage permitted | NOT_EVALUATED |
| Redistribution/display restrictions verified | NOT_EVALUATED |
| Attribution requirements verified | NOT_EVALUATED |
| License compatible with METIORO World usage | NOT_EVALUATED |

Short-circuit after Language Gate FAIL.

### Language Gate

| Locale | Result | Evidence |
| ------ | ------ | -------- |
| EN | PASS | Official languages API includes `"English":"en"`. |
| AR | PASS | Official languages API includes `"Arabic":"ar"`. |
| RU | PASS | Official languages API includes `"Russian":"ru"`. |
| FA | FAIL | Official languages API response does not include Persian / Farsi / `fa`. |

### Documentation vs Coverage Notes

FA official documentation FAIL. Effective FA Coverage not assessed.

### Evidence Notes

Pricing page states redistribution/republication may require separate terms; not scored due to short-circuit after Language Gate FAIL.

### Decision

NOT_ELIGIBLE — FA Language Gate FAIL.

### Proceed to Benchmark

NO

---

## Provider 005 — Bing News Search

### Provider ID

005

### Provider Name

Bing News Search API

### Evaluation Status

COMPLETE

### Eligibility Outcome

NOT_ELIGIBLE

### Reason

Language Gate FAIL for FA. Official Bing supported language codes for `setLang` do not include Persian / Farsi / `fa`.

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| Bing News Search overview | https://learn.microsoft.com/en-us/bing/search-apis/bing-news-search/overview | 2026-07-19 |
| Market and language codes | https://learn.microsoft.com/en-us/bing/search-apis/bing-news-search/reference/market-codes | 2026-07-19 |
| Query parameters | https://learn.microsoft.com/en-us/bing/search-apis/bing-news-search/reference/query-parameters | 2026-07-19 |

### Authentication

PASS — Official overview documents subscription key authentication for API calls.

### Commercial Availability

PASS — Official overview documents obtaining a paid/subscription key via Bing API Pricing for API use.

### Pricing

PASS — Official overview references Bing API Pricing as the source for subscription selection.

### Legal Gates

| Gate | Result |
| ---- | ------ |
| Automated polling permitted | NOT_EVALUATED |
| Caching/storage permitted | NOT_EVALUATED |
| Redistribution/display restrictions verified | NOT_EVALUATED |
| Attribution requirements verified | NOT_EVALUATED |
| License compatible with METIORO World usage | NOT_EVALUATED |

Short-circuit after Language Gate FAIL.

### Language Gate

| Locale | Result | Evidence |
| ------ | ------ | -------- |
| EN | PASS | Official Bing supported language codes include English / `en`. |
| AR | PASS | Official Bing supported language codes include Arabic / `ar`. |
| RU | PASS | Official Bing supported language codes include Russian / `ru`. |
| FA | FAIL | Official Bing supported language codes list does not include Persian / Farsi / `fa`. |

### Documentation vs Coverage Notes

FA official documentation FAIL. Effective FA Coverage not assessed.

### Evidence Notes

Overview also states Bing News Search API may only be used as a result of a direct user query or search-like user action. Polling gate not scored due to short-circuit after Language Gate FAIL.

### Decision

NOT_ELIGIBLE — FA Language Gate FAIL.

### Proceed to Benchmark

NO

---

## Provider 006 — Event Registry

### Provider ID

006

### Provider Name

Event Registry / NewsAPI.ai

### Evaluation Status

COMPLETE

### Eligibility Outcome

BLOCKED_UNKNOWN

### Reason

Language Gate contains UNKNOWN values for EN, RU, and FA. Official primary documentation portal pages returned “JavaScript is disabled” without an extractable exhaustive supported-language list. Partial mentions (e.g. Arabic in SDK README examples) are insufficient to close all Supported Language Snapshot locales. `UNKNOWN` blocks benchmark.

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| NewsAPI.ai home | https://newsapi.ai/ | 2026-07-19 |
| NewsAPI.ai documentation portal | https://newsapi.ai/documentation | 2026-07-19 |
| NewsAPI.ai plans/pricing | https://newsapi.ai/plans | 2026-07-19 |
| Event Registry documentation portal | https://eventregistry.org/documentation | 2026-07-19 |
| Official Python SDK README | https://github.com/EventRegistry/event-registry-python | 2026-07-19 |

### Authentication

PASS — Official materials document API key authentication (`Get FREE API key`; SDK `EventRegistry(apiKey=...)`).

### Commercial Availability

PASS — Official site positions the API for use in products/services; official plans page offers paid monthly plans.

### Pricing

PASS — Official plans page documents priced plans (example observed: 5K Plan $90.00 per month).

### Legal Gates

| Gate | Result |
| ---- | ------ |
| Automated polling permitted | NOT_EVALUATED |
| Caching/storage permitted | NOT_EVALUATED |
| Redistribution/display restrictions verified | NOT_EVALUATED |
| Attribution requirements verified | NOT_EVALUATED |
| License compatible with METIORO World usage | NOT_EVALUATED |

Short-circuit after Language Gate UNKNOWN outcomes.

### Language Gate

| Locale | Result | Evidence |
| ------ | ------ | -------- |
| EN | UNKNOWN | No extractable exhaustive official supported-language list from primary documentation portal. |
| AR | PASS | Official SDK README explicitly mentions Arabic among searchable languages. |
| RU | UNKNOWN | No extractable exhaustive official supported-language list confirming Russian / `ru`. |
| FA | UNKNOWN | No extractable official documentation explicitly listing Persian / Farsi / `fa`. |

### Documentation vs Coverage Notes

FA remains UNKNOWN at documentation gate. Effective FA Coverage not assessed.

### Evidence Notes

Primary documentation portals were not readable without JavaScript execution. No third-party comparison pages used.

### Decision

BLOCKED_UNKNOWN — Language Gate UNKNOWN for one or more required locales.

### Proceed to Benchmark

NO

---

## Provider 007 — World News API

### Provider ID

007

### Provider Name

World News API

### Evaluation Status

COMPLETE

### Eligibility Outcome

NOT_ELIGIBLE

### Reason

Caching/storage permitted FAIL. Official Terms state you may not copy or store API information, and caching is allowed only with prior written permission (maximum one hour).

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| Authentication | https://worldnewsapi.com/docs/authentication/ | 2026-07-19 |
| Search News docs | https://worldnewsapi.com/docs/search-news/ | 2026-07-19 |
| Language codes | https://worldnewsapi.com/docs/language-codes/ | 2026-07-19 |
| Pricing | https://worldnewsapi.com/pricing | 2026-07-19 |
| Terms | https://worldnewsapi.com/terms | 2026-07-19 |

### Authentication

PASS — Official authentication guide documents API key via `api-key` query parameter or `x-api-key` header.

### Commercial Availability

PASS — Official Pricing page documents paid Reporter / Journalist / Editor plans for API subscription use.

### Pricing

PASS — Official Pricing page documents Free and paid monthly prices and quotas.

### Legal Gates

| Gate | Result |
| ---- | ------ |
| Automated polling permitted | PASS — Official documentation provides Rate Limiting & Quotas for repeated API requests under subscription plans. |
| Caching/storage permitted | FAIL — Official Terms prohibit copying/storing API information except caching with prior written permission for a maximum of 1 hour. |
| Redistribution/display restrictions verified | NOT_EVALUATED |
| Attribution requirements verified | NOT_EVALUATED |
| License compatible with METIORO World usage | NOT_EVALUATED |

Short-circuit after Caching/storage FAIL.

### Language Gate

| Locale | Result | Evidence |
| ------ | ------ | -------- |
| EN | PASS | Official language codes list includes English / `en`. |
| AR | PASS | Official language codes list includes Arabic / `ar`. |
| RU | PASS | Official language codes list includes Russian / `ru`. |
| FA | PASS | Official language codes list includes Persian / `fa`. |

### Documentation vs Coverage Notes

FA is officially documented. Effective FA Coverage remains a benchmark metric and is not decided here.

### Evidence Notes

Terms also restrict creating a competing experience and reselling data; those gates were not scored due to short-circuit after Caching/storage FAIL.

### Decision

NOT_ELIGIBLE — Caching/storage FAIL.

### Proceed to Benchmark

NO

---

## Provider 008 — Associated Press

### Provider ID

008

### Provider Name

Associated Press (AP Developer / Media API)

### Evaluation Status

COMPLETE

### Eligibility Outcome

BLOCKED_UNKNOWN

### Reason

Authentication method for production Media API access is UNKNOWN from publicly retrieveable official developer homepage content (access path is contact/enterprise oriented without extractable auth-method documentation sufficient for EG-01 PASS). `UNKNOWN` blocks benchmark.

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| AP Developer Home | https://developer.ap.org/ | 2026-07-19 |

### Authentication

UNKNOWN — Official homepage describes Media API/Agent and related APIs but does not document a concrete public authentication method sufficient to score PASS.

### Commercial Availability

NOT_EVALUATED

### Pricing

NOT_EVALUATED

### Legal Gates

| Gate | Result |
| ---- | ------ |
| Automated polling permitted | NOT_EVALUATED |
| Caching/storage permitted | NOT_EVALUATED |
| Redistribution/display restrictions verified | NOT_EVALUATED |
| Attribution requirements verified | NOT_EVALUATED |
| License compatible with METIORO World usage | NOT_EVALUATED |

Short-circuit after Authentication UNKNOWN.

### Language Gate

| Locale | Result | Evidence |
| ------ | ------ | -------- |
| EN | NOT_EVALUATED | Short-circuit before Language Gate. |
| AR | NOT_EVALUATED | Short-circuit before Language Gate. |
| RU | NOT_EVALUATED | Short-circuit before Language Gate. |
| FA | NOT_EVALUATED | Short-circuit before Language Gate. |

### Documentation vs Coverage Notes

No language-list evidence retrieved from official public developer homepage.

### Evidence Notes

Homepage directs to contact for API access. No third-party materials used.

### Decision

BLOCKED_UNKNOWN — Authentication UNKNOWN.

### Proceed to Benchmark

NO

---

## Provider 009 — Reuters

### Provider ID

009

### Provider Name

Reuters (Reuters News Agency / LSEG distribution)

### Evaluation Status

COMPLETE

### Eligibility Outcome

BLOCKED_UNKNOWN

### Reason

Authentication method for a Reuters production news API suitable for METIORO World ingestion is UNKNOWN. Public official pages describe agency/licensing and LSEG developer offerings, but no extractable self-serve news-search API authentication method was found that satisfies EG-01.

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| Reuters News Agency | https://www.reutersagency.com/en/ | 2026-07-19 |
| LSEG Data & Analytics | https://www.lseg.com/en/data-analytics | 2026-07-19 |
| LSEG Developer Community | https://developers.lseg.com/ | 2026-07-19 |

### Authentication

UNKNOWN — No extractable official documentation of a concrete Reuters news API authentication method for the evaluated World ingestion use.

### Commercial Availability

NOT_EVALUATED

### Pricing

NOT_EVALUATED

### Legal Gates

| Gate | Result |
| ---- | ------ |
| Automated polling permitted | NOT_EVALUATED |
| Caching/storage permitted | NOT_EVALUATED |
| Redistribution/display restrictions verified | NOT_EVALUATED |
| Attribution requirements verified | NOT_EVALUATED |
| License compatible with METIORO World usage | NOT_EVALUATED |

Short-circuit after Authentication UNKNOWN.

### Language Gate

| Locale | Result | Evidence |
| ------ | ------ | -------- |
| EN | NOT_EVALUATED | Short-circuit before Language Gate. |
| AR | NOT_EVALUATED | Short-circuit before Language Gate. |
| RU | NOT_EVALUATED | Short-circuit before Language Gate. |
| FA | NOT_EVALUATED | Short-circuit before Language Gate. |

### Documentation vs Coverage Notes

No Supported Language Snapshot language-list evidence retrieved for a Reuters news API in this evaluation.

### Evidence Notes

Enterprise licensing surfaces were identified; they were not treated as PASS without concrete official API auth/language/legal documentation. No third-party comparisons used.

### Decision

BLOCKED_UNKNOWN — Authentication UNKNOWN.

### Proceed to Benchmark

NO

---

## Register Summary

| Provider ID | Provider Name | Eligibility Outcome | Proceed to Benchmark |
| ----------- | ------------- | ------------------- | -------------------- |
| 001 | Guardian | NOT_ELIGIBLE | NO |
| 002 | New York Times | NOT_ELIGIBLE | NO |
| 003 | NewsData.io | ELIGIBLE | YES |
| 004 | Currents | NOT_ELIGIBLE | NO |
| 005 | Bing News Search | NOT_ELIGIBLE | NO |
| 006 | Event Registry | BLOCKED_UNKNOWN | NO |
| 007 | World News API | NOT_ELIGIBLE | NO |
| 008 | Associated Press | BLOCKED_UNKNOWN | NO |
| 009 | Reuters | BLOCKED_UNKNOWN | NO |

Under the restored approved outcomes, Provider 003 (NewsData.io) is the only provider in this register authorized to proceed to benchmark under PRG-03.3.
