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

- `FAIL` blocks benchmark for the affected provider.
- `UNKNOWN` blocks benchmark for the affected provider until clarified. `UNKNOWN` is not permission.
- `NOT_EVALUATED` means evidence work is incomplete and blocks benchmark for the affected provider.
- Provider independence (PRG-03.3 v0.1.1): unresolved gates on one provider MUST NOT programme-block a different provider that independently satisfies the Benchmark Authorization Rule.
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

### Execution Status

| Field | Value |
| ----- | ----- |
| Evidence Collection | COMPLETE |
| Unknown Resolution | OPEN — Event Registry EG-08 remains UNKNOWN (provider-scoped). Associated Press and Reuters UNKNOWN blockers resolved (see provider sections). |

### Benchmark Execution Authorization

**BLOCKED** (for any authorized run, including NewsData.io)

Programme-wide / shared ratification reasons (apply to every provider run):

1. Product Ratification
   - Effective Coverage Threshold (X)

2. Operations Ratification
   - Reference Load Profile (RLP)

3. Benchmark-definition ratification
   - PRG-03.4 Production Benchmark Definition (Owner/Approver identity assignment remains PENDING RATIFICATION)

Provider-scoped reason (does **not** programme-block NewsData.io):

4. Event Registry (006) EG-08 UNKNOWN → Provider 006 remains `BLOCKED_UNKNOWN`; Proceed to Benchmark = NO for Event Registry only (PRG-03.3 v0.1.1 provider independence).

Packaging clarification (2026-07-19): Prior listing of Event Registry clarification as a programme-level Benchmark Execution Authorization reason is corrected to provider-scoped blocking only, consistent with PRG-03.3 v0.1.1. Provider 003 (NewsData.io) remains `ELIGIBLE` / Proceed = YES. Event Registry is not authorized for benchmarking while EG-08 is UNKNOWN. NewsData.io eligibility is unchanged.

### Clarification Queue

| Provider | Open clarification | Status | Blocks |
| -------- | ------------------ | ------ | ------ |
| Event Registry | Automated polling permission (explicit Terms/AUP permission required; rate-limit text alone insufficient). Caching/storage remains NOT_EVALUATED under short-circuit. | OPEN | Event Registry only |
| Associated Press | API authentication/access and commercial availability | CLOSED — Auth/Commercial resolved; provider NOT_ELIGIBLE (Redistribution/display FAIL) | N/A |
| Reuters | API authentication/access and commercial availability | CLOSED — Auth/Commercial resolved; provider NOT_ELIGIBLE (Language Gate FAIL) | N/A |

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

Automated polling permitted is UNKNOWN. Official Terms of Service do not explicitly permit automated/programmatic polling. A documented rate-limit bypass prohibition alone is not permission. `UNKNOWN` is not permission and blocks benchmark.

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| NewsAPI.ai home | https://newsapi.ai/ | 2026-07-19 |
| NewsAPI.ai documentation portal | https://newsapi.ai/documentation | 2026-07-19 |
| NewsAPI.ai plans/pricing | https://newsapi.ai/plans | 2026-07-19 |
| Event Registry documentation portal | https://eventregistry.org/documentation | 2026-07-19 |
| Official Python SDK README | https://github.com/EventRegistry/event-registry-python | 2026-07-19 |
| Official Supported languages (SDK wiki) | https://github.com/EventRegistry/event-registry-python/wiki/Supported-languages | 2026-07-19 |
| Terms of Service | https://newsapi.ai/terms | 2026-07-19 |

### Gate-by-Gate Status (EG-01–EG-12)

| Gate ID | Gate | Result | Notes |
| ------- | ---- | ------ | ----- |
| EG-01 | Authentication method documented | PASS | API key (`Get FREE API key`; SDK `EventRegistry(apiKey=...)`). |
| EG-02 | Commercial production access documented | PASS | Paid-plan commercial license in Terms; paid plans on plans page. |
| EG-03 | Pricing documented | PASS | Public priced plans (example: 5K Plan $90.00 per month). |
| EG-04 | EN officially documented | PASS | Supported languages list includes English (`eng`). |
| EG-05 | AR officially documented | PASS | Supported languages list includes Arabic (`ara`). |
| EG-06 | RU officially documented | PASS | Supported languages list includes Russian (`rus`). |
| EG-07 | FA officially documented | PASS | Supported languages list includes Persian (`fas`). |
| EG-08 | Automated polling permitted | **UNKNOWN** | Terms lack explicit automated/programmatic polling permission. |
| EG-09 | Caching/storage permitted | NOT_EVALUATED | Short-circuit after EG-08 UNKNOWN. |
| EG-10 | Redistribution/display restrictions verified | NOT_EVALUATED | Short-circuit after EG-08 UNKNOWN. |
| EG-11 | Attribution requirements verified | NOT_EVALUATED | Short-circuit after EG-08 UNKNOWN. |
| EG-12 | License compatible with METIORO World usage | NOT_EVALUATED | Short-circuit after EG-08 UNKNOWN. |

**UNKNOWN gates (exact):** EG-08 only (`Automated polling permitted`).

**NOT_EVALUATED gates (exact):** EG-09, EG-10, EG-11, EG-12 (blocked from scoring by short-circuit after EG-08 UNKNOWN).

### Authentication

PASS — Official materials document API key authentication (`Get FREE API key`; SDK `EventRegistry(apiKey=...)`).

### Commercial Availability

PASS — Official Terms grant paid-plan license to use data for commercial purposes; official plans page offers paid monthly plans.

### Pricing

PASS — Official plans page documents priced plans (example observed: 5K Plan $90.00 per month).

### Legal Gates

| Gate | Result |
| ---- | ------ |
| Automated polling permitted (EG-08) | **UNKNOWN** — Official Terms do not explicitly permit automated/programmatic polling; rate-limit text alone is insufficient. |
| Caching/storage permitted (EG-09) | NOT_EVALUATED |
| Redistribution/display restrictions verified (EG-10) | NOT_EVALUATED |
| Attribution requirements verified (EG-11) | NOT_EVALUATED |
| License compatible with METIORO World usage (EG-12) | NOT_EVALUATED |

Short-circuit after Automated polling UNKNOWN (EG-08).

### Language Gate

| Locale | Result | Evidence |
| ------ | ------ | -------- |
| EN | PASS | Official Supported languages list includes English (`eng`). |
| AR | PASS | Official Supported languages list includes Arabic (`ara`). |
| RU | PASS | Official Supported languages list includes Russian (`rus`). |
| FA | PASS | Official Supported languages list includes Persian (`fas`). |

### Documentation vs Coverage Notes

FA is officially documented as Persian (`fas`). Effective FA Coverage remains a benchmark metric and is not decided here.

### Evidence Notes

Closure review (2026-07-19): Automated polling reclassified from PASS to UNKNOWN because https://newsapi.ai/terms contains no explicit automated/programmatic polling permission (only a prohibition on bypassing rate limits). Per PRG-03.3 short-circuit, Caching/storage and later legal gates remain NOT_EVALUATED. Caching/storage permission remains queued for clarification. No third-party comparison pages used.

Unknown-resolution re-review (2026-07-19): Re-fetched official Terms at https://newsapi.ai/terms and https://eventregistry.org/terms (same content). Paid-plan commercial license and rate-limit bypass prohibitions remain; no clause explicitly permits automated/programmatic polling. Official plans/SDK materials document API request usage and tokens but do not supply acceptable-use permission for scheduled polling. **Only EG-08 is UNKNOWN.** EG-09–EG-12 are NOT_EVALUATED (not UNKNOWN). `UNKNOWN` is not permission. No third-party sources used.

### Decision

BLOCKED_UNKNOWN — EG-08 Automated polling UNKNOWN.

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

NOT_ELIGIBLE

### Reason

Redistribution/display restrictions FAIL. Official FAQ states AP Media API does not support B2C syndication and that content and feeds must not be published directly to websites. METIORO World is a consumer-facing display surface. Language Gate FA also FAIL (no official supported-language list including Persian / `fa`).

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| AP Developer Home | https://developer.ap.org/ | 2026-07-19 |
| AP Media API product page | https://developer.ap.org/ap-media-api/ | 2026-07-19 |
| Getting started with Media API | https://api.ap.org/media/v/docs/Getting_Started_API.htm | 2026-07-19 |
| Frequently Asked Questions | https://api.ap.org/media/v/docs/FrequentlyAskedQuestions.htm | 2026-07-19 |
| Pricing | https://api.ap.org/media/v/docs/Pricing.htm | 2026-07-19 |
| Quota limits / best practices | https://api.ap.org/media/v/docs/Quota_Limits.htm | 2026-07-19 |
| Getting content updates | https://api.ap.org/media/v/docs/Getting_Content_Updates.htm | 2026-07-19 |
| Official OpenAPI / Swagger | https://api.ap.org/media/v/swagger.json | 2026-07-19 |
| Official APISamples README | https://github.com/TheAssociatedPress/APISamples | 2026-07-19 |

### Authentication

PASS — Official Getting Started and Swagger document API key authentication via `x-api-key` HTTP header (also `x-apikey`). Official FAQ: API key required for Media API calls.

### Commercial Availability

PASS — Official docs describe access to licensed multimedia content via API; API key issued through AP Customer Support / Sales or Licensing channels (official APISamples README and Getting Started).

### Pricing

PASS — Official Pricing page documents plan types (Unlimited subscription, Metered, Metered credits, A la carte, Choice, Limited duration) and contract-based item pricing.

### Legal Gates

| Gate | Result |
| ---- | ------ |
| Automated polling permitted | PASS — Official docs describe programmatic feed ingestion, custom programs for feed processing, HTTP long polling, and periodic latest-content workflows (e.g. rebuilding a page/ticker). |
| Caching/storage permitted | PASS — Official Quota best practices instruct storing `itemid` and `etag` (or version) in a database and serving repeats from that store instead of re-downloading. |
| Redistribution/display restrictions verified | FAIL — Official FAQ: API is B2B only; content and feeds must not be published directly to websites; B2C syndication not supported. |
| Attribution requirements verified | NOT_EVALUATED |
| License compatible with METIORO World usage | NOT_EVALUATED |

Short-circuit after Redistribution/display FAIL.

### Language Gate

| Locale | Result | Evidence |
| ------ | ------ | -------- |
| EN | PASS | Official Swagger language field description examples include `en`. |
| AR | FAIL | No official supported-language list entry for Arabic / `ar`. |
| RU | FAIL | No official supported-language list entry for Russian / `ru`. |
| FA | FAIL | No official supported-language list entry for Persian / Farsi / `fa`. |

### Documentation vs Coverage Notes

Swagger documents a two-letter language code field with examples `en` or `es` only. Effective FA Coverage not assessed.

### Evidence Notes

Unknown-resolution re-review (2026-07-19): Prior Authentication UNKNOWN cleared using official Media API docs/Swagger (not homepage alone). Evaluation continued under PRG-03.3. Blocking disposition is Redistribution/display FAIL for World consumer display. No third-party materials used.

### Decision

NOT_ELIGIBLE — Redistribution/display FAIL (B2C prohibition). Language Gate FA also FAIL.

### Proceed to Benchmark

NO

---

## Provider 009 — Reuters

### Provider ID

009

### Provider Name

Reuters (Reuters News Agency / LSEG News API on Refinitiv Data Platform)

### Evaluation Status

COMPLETE

### Eligibility Outcome

NOT_ELIGIBLE

### Reason

Language Gate FAIL (EG-04–EG-07). Official LSEG pages state Reuters language *counts* only and do not explicitly list English/`en`, Arabic/`ar`, Russian/`ru`, or Persian/`fa`. Under PRG-03.3, general language-count claims are insufficient for locale gates.

### Official Sources

| Source | URL | Access Date (UTC) |
| ------ | --- | ----------------- |
| Reuters News Agency | https://www.reutersagency.com/en/ | 2026-07-19 |
| LSEG Developer Community | https://developers.lseg.com/ | 2026-07-19 |
| News API for Wealth (RDP) | https://developers.lseg.com/en/api-catalog/refinitiv-data-platform/news-API | 2026-07-19 |
| News Service on Refinitiv Data Platform | https://developers.lseg.com/en/product/news/news_service_rdp | 2026-07-19 |
| News product overview | https://developers.lseg.com/en/product/news/overview | 2026-07-19 |
| OAuth grant types in Refinitiv Data Platform | https://developers.lseg.com/en/article-catalog/article/oauth-grant-types-in-refinitiv-data-platform | 2026-07-19 |
| Limitations and Guidelines for the RDP Authentication Service | https://developers.lseg.com/en/article-catalog/article/limitations-and-guidelines-for-the-rdp-authentication-service | 2026-07-19 |
| Methodology (gate rule) | `docs/governance/PRG-03.3-pre-benchmark-eligibility.md` — Gate interpretation: general language claims insufficient for EG-04–EG-07 | 2026-07-19 |

### Official Controlling Quotations (Language Gate)

Quoted from official LSEG developer pages accessed 2026-07-19 UTC:

1. **News API for Wealth** — https://developers.lseg.com/en/api-catalog/refinitiv-data-platform/news-API

   > “It delivers more than 2.2 million News Stories per year in 16 languages, actively covering 41,000 companies.”

2. **News Service on Refinitiv Data Platform** — https://developers.lseg.com/en/product/news/news_service_rdp

   > “Languages – Reuters: 15 languages”

**Observation recorded from those same pages:** No supported-language inventory naming English/`en`, Arabic/`ar`, Russian/`ru`, or Persian/Farsi/`fa` (or equivalents) appears adjacent to these count statements, nor elsewhere on the reviewed official pages for this evaluation.

**Gate-rule binding (PRG-03.3):** “General claims such as ‘supports many languages’ are insufficient for locale gates EG-04 through EG-07.” A numeric language count without an explicit locale list does not satisfy EG-04–EG-07; therefore each Supported Language Snapshot locale is scored FAIL (not UNKNOWN).

### Authentication

PASS — Official LSEG developer materials document RDP OAuth 2.0 authentication (password / refresh / client-credentials style machine access) with access tokens for API calls. News API overview states standard authentication and entitlements and machine session establishment; API Playground access via username/password from account manager.

### Commercial Availability

PASS — Official News API / News Service pages document Professional and non-professional subscription packaging, sales/free-trial channels, and account-manager access for Reuters/RDP news.

### Pricing

PASS — Official materials identify subscription packaging (Professional / non-professional) and sales/trial procurement paths. Public numeric list prices are not published; pricing path is recorded from official pages.

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
| EN | FAIL | Official quote records “16 languages” / “Reuters: 15 languages” only; English / `en` not explicitly listed (PRG-03.3 general-claim rule). |
| AR | FAIL | Same official sources; Arabic / `ar` not explicitly listed. |
| RU | FAIL | Same official sources; Russian / `ru` not explicitly listed. |
| FA | FAIL | Same official sources; Persian / Farsi / `fa` not explicitly listed. |

### Documentation vs Coverage Notes

Official language evidence is limited to count claims quoted above. Effective FA Coverage not assessed.

### Evidence Notes

Unknown-resolution re-review (2026-07-19): Prior Authentication UNKNOWN cleared using official LSEG News API + RDP OAuth documentation. Language Gate retained as FAIL with controlling official quotations above (not reverted to BLOCKED_UNKNOWN). Official News product overview also states Standard News Feeds licenses do not permit distribution/redistribution (including client-derived data); that Redistribution gate was not scored due to short-circuit after Language Gate FAIL. No third-party comparisons used.

### Decision

NOT_ELIGIBLE — Language Gate FAIL (EG-04–EG-07), supported by official quotations in this section.

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
| 008 | Associated Press | NOT_ELIGIBLE | NO |
| 009 | Reuters | NOT_ELIGIBLE | NO |

Provider 003 (NewsData.io) remains the only provider in this register with Eligibility = ELIGIBLE / Proceed to Benchmark = YES under PRG-03.3.

Benchmark execution for NewsData.io remains BLOCKED on programme-wide ratification items only: Effective Coverage Threshold (X), Reference Load Profile (RLP), and PRG-03.4. Event Registry EG-08 UNKNOWN blocks Event Registry only (PRG-03.3 v0.1.1). Unknown Resolution may remain OPEN without programme-blocking NewsData.io.
