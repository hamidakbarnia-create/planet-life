# ADR-0008: News Freshness Policy

**Status:** Accepted
**Date:** 2026-07-14
**Decision makers:** METIORO Platform Engineering
**Scope:** World live news surfaces (`/api/world/news` and all UI consumers)
**Normative language:** `MUST`, `MUST NOT`, `SHALL`, `SHALL NOT`, `MAY`, `SHOULD`

---

## Lifecycle

ADR-0008 originated in an external product-review cycle during Sprint P1 and entered the repository as a Proposed ADR with its ADR_INDEX entry in the same change set.

Status advanced from Proposed to Accepted on 2026-07-14 under the ADR_INDEX template lifecycle (`Proposed | Accepted | Deprecated | Superseded`). LOCKED is not required for this policy ADR; LOCKED remains reserved for contract ADRs that the repository explicitly locks (for example ADR-0006 and ADR-0007).

---

## Context

World live panels surface third-party headlines as secondary context beside sky signals. The current BFF (`apps/web/app/api/world/news/route.ts`) returns the first RSS items without age filtering, ranking, or publication-date display. Consumers (`NewsList`, section detail) can therefore show stale or undated filler when the feed is thin.

METIORO is not a news product. Headlines exist only as credible, recent grounding for live readings. Stale articles undermine trust more than an honest empty state.

This ADR locks the freshness boundaries, display, low-signal behaviour, and enforcement ownership for every news list shown to users. Relevance ranking remains implementation-owned; see Non-Decisions.

---

## Decision

### D1. Preferred freshness window (7 days)

Articles published within the previous **7 days** are the primary candidate set.

Freshness is evaluated relative to request time in UTC.

---

### D2. Conditional extended freshness window

If insufficient articles published within the primary 7-day freshness window satisfy the relevance criteria, the retrieval window MAY expand to articles published within the previous **30 days**.

The relevance criteria referenced in this decision are implementation-owned; see Non-Decisions.

Articles published **8–30 days** before the request MAY appear only when insufficient qualifying articles exist within the primary 7-day window.

Whenever both freshness windows contribute results, all qualifying articles from the primary 7-day window SHALL rank above all fallback articles from the 8–30-day window.

---

### D3. Hard age cutoff

Articles older than **30 days** SHALL NOT be returned by the World news BFF or displayed on freshness-gated current-news surfaces.

Articles with missing, invalid, unparseable, or unverifiable publication timestamps SHALL be excluded.

The 8–30-day range is a conditional fallback window only; it is not part of the primary candidate set.

---

### D4. Ranking principle

Freshness SHALL be a primary ranking signal.

Results from the primary 7-day window SHALL rank above results admitted from the fallback 8–30-day window.

Within those normative freshness boundaries, the definition of relevance and the relevance-ranking algorithm remain implementation-owned.

---

### D5. Publication date display

Every displayed article SHALL show its publication date in a human-readable form appropriate to the active locale.

Relative labels MAY supplement the date, but SHALL NOT replace an unambiguous publication date where the surface permits it.

---

### D6. Low-signal state

If fewer than **2** credible recent articles remain after the applicable freshness filtering, the product SHALL render an explicit low-signal state instead of stale, undated, unrelated, placeholder, or out-of-window content.

This is a valid product state, not a generic loading or server-error state.

When the low-signal condition holds, the rendered news list SHALL contain zero articles.

The BFF SHALL NOT silently backfill the result with articles outside the permitted freshness windows.

**Credible** means:

* a non-empty title
* a valid outbound link
* an identifiable source
* a verifiable publication timestamp within the active freshness window

---

### D7. Enforcement ownership

The Backend-for-Frontend SHALL enforce freshness filtering, fallback window admission, hard cutoff, and freshness-boundary ranking.

The UI SHALL render either:

* the policy-compliant dataset returned by the BFF, or
* an explicit low-signal state

The UI SHALL NOT implement an independent freshness policy or independently rescue filtered articles.

Publication-date presentation remains a UI responsibility.

---

### D8. Authoritative freshness timestamp

Freshness SHALL be evaluated exclusively using the article publication timestamp.

Cache timestamps, ingestion timestamps, retrieval timestamps, re-indexing timestamps, or other internal processing timestamps SHALL NOT be substituted for the publication timestamp.

Articles without a verifiable publication timestamp SHALL be excluded from freshness-gated surfaces.

A recent ingestion or cache timestamp SHALL NOT make an old article eligible as current news.

---

## Non-Decisions

This ADR intentionally does not freeze:

* the definition of relevance
* the relevance-ranking algorithm
* relevance weights or scoring formulae
* provider selection
* news-source vendor selection
* feed-selection strategy
* caching strategy or cache duration
* number of displayed articles
* UI visual design
* card layout or presentation density

The definition of relevance and the relevance-ranking algorithm are implementation-owned and MAY change without an ADR amendment, provided all normative freshness boundaries in this ADR remain satisfied.

D2’s reference to relevance criteria intentionally points to these implementation-owned rules; their absence from the ADR is deliberate, not an omission.

---

## Consequences

### Positive

* Users do not see undated or >30-day-old material as current news.
* Recent qualifying articles always outrank fallback-window articles.
* Thin coverage fails closed with a low-signal state.
* Relevance implementation may evolve without amendment.
* One shared BFF-owned policy prevents client-side freshness drift.

### Negative / accepted costs

* Some themes may frequently show a low-signal state.
* Feeds without reliable publication timestamps may lose otherwise useful items.

### Implementation impact

* World news BFF — enforce publication-timestamp freshness filtering, conditional 8–30-day fallback admission, hard cutoff, and freshness-boundary ranking.
* World news UI consumers — render publication dates and an explicit low-signal state when fewer than 2 credible recent articles remain.
* Localization resources — low-signal copy for news emptiness.

---

## Alternatives Considered

| Option | Why rejected |
|--------|----------------|
| Always show top-N RSS items regardless of age | Maximizes fill rate but presents stale context as current news. |
| Soft-warn on old articles but still display them | Users treat visible headlines as current; warnings are insufficient. |
| Client-only filtering | Easy to bypass or diverge across surfaces; policy must be BFF-owned. |
| Hide dates to reduce chrome | Violates the requirement that every article show its publication date. |
| Freeze a fixed numeric threshold for opening the fallback window | Over-constrains retrieval; sufficiency of recent coverage is relevance-dependent and implementation-owned. |
| Substitute cache or ingestion timestamps for publication time | Would admit stale articles as current news. |

---

## References

* World news BFF: `apps/web/app/api/world/news/route.ts`
* World UI consumers: `apps/web/app/world/page.tsx`
* Evidence freshness (related, broader pipeline): [EVIDENCE_PIPELINE_SPECIFICATION.md](../architecture/EVIDENCE_PIPELINE_SPECIFICATION.md) §6.4
* ADR index: [ADR_INDEX.md](../governance/ADR_INDEX.md)
