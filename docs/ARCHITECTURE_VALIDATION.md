# Architecture Scalability Validation

> **Validation date:** 2026-07-07  
> **Scope:** Current-state architecture assessment against long-term METIORO product vision — validation only  
> **Inputs:** `PHASE2_ARCHITECTURE_BASELINE.md`, `PHASE3_ARCHITECTURE_BLUEPRINT.md`, `ENGINEERING_READINESS.md`, repository inspection  
> **Constraints:** No code changes, no ADRs, no governance changes, no speculative redesign

---

## Executive Summary

METIORO's **backend architecture scales well** for the Personal Decision Intelligence vision. The calculation core is centralized in `packages/astro_engine`, domain behavior is routed through `ScoringContext` presets, and a Phase 3 `DecisionEngineFacade` provides a migration path toward a unified decision layer. API tests (167) and scoring invariants are strong.

The **frontend architecture scales poorly** beyond incremental feature growth. Routes are flat, pages are monolithic (five exceed 750 lines; two exceed 1,400), state lives in `localStorage` without a data layer, and i18n is fragmented across 13 lib files plus eight inline page dictionaries. This matches the Phase 2 baseline finding: *"calculation core centralized; presentation fragmented."*

**Product domain mapping is partial.** Ask, Calendar, Pathfinder, People, World, and Vault have clear route/API boundaries. **Provider** exists only as a Vault section stub. **Julia** is marketing/copy and advisor cards — no service boundary, scheduling, or expert workflow. Premium tiers are client-side stubs (`membership.ts`), blocking real monetization scale.

**Validation conclusion:** The current architecture is **sufficient for continued MVP-to-platform execution** over the next 12–18 months if evolution follows the documented Phase 2/3 direction (facade adoption, shared contracts, incremental extraction). It is **not yet sufficient** for multi-device authenticated users, enterprise accounts, or rapid parallel team scaling without addressing frontend coupling, entitlement server-side authority, and operational observability.

**Overall scalability score: 64 / 100** — backend-weighted; frontend and operations drag the average.

---

## Scalability Score by Dimension

| Dimension | Score | Trend |
|-----------|-------|-------|
| 1. Frontend scalability | 52 / 100 | Risk increases with each new surface |
| 2. Backend scalability | 78 / 100 | Solid core; pathfinder/batch are hotspots |
| 3. Domain architecture | 60 / 100 | 6/8 domains mapped; Provider/Julia immature |
| 4. Data flow | 70 / 100 | Clear pipeline; threshold duplication |
| 5. Extensibility | 65 / 100 | Framework-ready backend; frontend resists plug-in |
| 6. Operational scalability | 48 / 100 | Dual deploy, no CI, in-process caches |
| 7. Dependency risk | 62 / 100 | Swiss Ephemeris + Nominatim concentration |
| **Weighted overall** | **64 / 100** | |

---

## Strengths

1. **Centralized scoring engine** — `packages/astro_engine/scoring.py` is the single numerical authority; modules differ by `ScoringContext`, not forked logic.
2. **ScoringContext presets** — `CONTEXT_CALENDAR_DAY`, `CONTEXT_ASK_ELECTIONAL`, `CONTEXT_PATHFINDER`, etc. cleanly encode per-domain location and component rules.
3. **Stable API contracts** — `schemas/score_breakdown.py` and `score_reasoning.py` with validation helpers; 167 API tests guard invariants.
4. **Decision Engine facade (Phase 3 seed)** — `packages/decision_engine/` wraps existing pipeline without behavior change; finance route proves parity pattern.
5. **Deterministic explainability** — `reasoning.py` builds explanations from score data; aligns with constitutional explainability requirement without LLM dependency.
6. **Monorepo package boundaries** — `apps/web`, `apps/api`, `packages/astro_engine`, `packages/decision_engine` separate deployable surfaces from domain logic.
7. **Batch parallelism** — `ThreadPoolExecutor(max_workers=8)` and geocoding priming for calendar month/hour loads.
8. **Design token authority (DS-01)** — Registry establishes long-term theming governance path independent of page-level inline styles.
9. **Visual regression matrix** — 78 Playwright baselines protect UX consistency during architectural evolution.
10. **Deployment topology documented** — Railway (API) + Cloudflare Workers (web) with explicit env contract (`NEXT_PUBLIC_API_BASE`).

---

## Risks

| ID | Risk | Dimension | Severity |
|----|------|-----------|----------|
| AR-1 | Monolithic client pages absorb all fetch, i18n, layout, and entitlement logic | Frontend | **High** |
| AR-2 | `localStorage` as primary data store — no multi-device, no server authority | Frontend / Data | **High** |
| AR-3 | Client-side tier gating (`membership.ts`) — cannot scale premium/enterprise | Extensibility | **High** |
| AR-4 | Partial facade adoption — finance uses facade; business/real-estate do not | Backend / Data flow | **Medium** |
| AR-5 | UI/backend score band thresholds diverge (85/60/40 vs 80/65/45/30) | Data flow | **Medium** |
| AR-6 | In-process LRU caches (geocode, timezone, world sky) — no cross-replica consistency | Backend / Ops | **Medium** |
| AR-7 | Nominatim geocoding — external rate limit, no circuit breaker | Dependency | **Medium** |
| AR-8 | i18n fragmentation — 4 languages require touching 20+ files | Frontend | **Medium** |
| AR-9 | Provider/Julia lack domain boundaries — cannot scale expert services | Domain | **Medium** |
| AR-10 | No distributed job queue for heavy pathfinder/batch workloads | Backend / Ops | **Medium** |
| AR-11 | No API auth, versioning, or rate limiting | Backend / Ops | **Medium** |
| AR-12 | Observability limited to stdout logging (`chart_monitor`) — no tracing/metrics | Ops | **Medium** |
| AR-13 | `'use client'` on all feature routes — limited RSC data-fetching leverage | Frontend | **Low–Medium** |
| AR-14 | Vault API surface minimal (`POST /api/vault/mars` only) — six other sections are frontend-only | Domain | **Medium** |

---

## 1. Frontend Scalability

### Routing structure

- **Flat App Router** under `apps/web/app/` — 22 user-facing routes, no `(marketing)` / `(app)` route groups.
- **Shell patterns:** `AppShell` (13 routes), standalone `login`, legacy `dashboard` (BottomNav only), server legal pages.
- **BFF routes:** `app/api/cities`, `translate`, `world/markets`, `world/news` — thin proxies.

**Scaling risk:** New features follow the pattern of new top-level `page.tsx` files with embedded logic rather than composable route modules. No lazy route groups for code splitting beyond landing WebGL.

### Feature boundaries

| Surface | Route | Boundary clarity |
|---------|-------|------------------|
| Today | `/home` | Moderate — delegates to `DailyBriefView` but page owns orchestration |
| Calendar | `/calendar` | **Weak** — 1,100+ lines, ICS, GPS, scores, prefs |
| Ask | `/ask` | **Weak** — wizard + fetch + inline i18n |
| People | `/people`, `/people/[id]` | Moderate — storage in `people-storage.ts`, dashboard component |
| Pathfinder | `/pathfinder` | Moderate — API client extracted |
| World | `/world` | **Weak** — mixed BFF and direct API |
| Vault | `/vault`, `/vault/[section]` | **Weak** — section page 1,400+ lines |
| Upgrade | `/upgrade` | **Weak** — 1,500+ lines, pricing + i18n + modals |

### Shared components

- **Primitives exist but under-adopted:** `PageHeader`, `GlassCard`, `SegmentControl`, `MetricCard`, `AlertBanner` in `components/ui/`.
- **Known inconsistency:** Settings/Login use inline chip buttons instead of `SegmentControl`.
- **Heavy shared components:** `NatalChart` (616 lines), `DailyBriefView` (498 lines) — themselves decomposition candidates.

### State management

- **No global store** (no Zustand/Redux/Context for app state).
- **~29 files** touch `localStorage` with `planet-life-*` keys.
- **Cross-tab sync:** `storage` events + `planet-life-membership-changed` custom event only.
- **Repeated hydration:** Every AppShell page re-implements `loadAppLang()` / `loadBirthProfile()` in `useEffect`.

**Scaling risk:** Adding authenticated server state requires replacing page-local patterns across 14+ client routes simultaneously.

### Localization

- **13 dedicated `*-i18n.ts` files** in `lib/` (largest: `synastry-i18n.ts` 814 lines).
- **8 pages** carry inline `Record<AppLang, …>` dictionaries.
- **`home-i18n.ts`** acts as a shared nav/settings god object.
- **4 languages:** en, ru, fa, ar with RTL for fa/ar.

**Scaling risk:** Adding a fifth language or centralized copy management requires coordinated multi-file edits; no extraction tooling or ICU/message catalog.

### Theming

- **Three layers:** `brand-theme.ts` (TS tokens), `globals.css` (Tailwind + vars), `metioro-ui-v2.css` + `metioro-shell.css` (class system).
- **Design Token Registry (DS-01)** is canonical but runtime maps (`BAND_STYLES`, etc.) still use raw literals.
- **~400+ inline `style={{}}`** usages across pages undermine token consumption.

**Scaling risk:** Visual consistency depends on developer discipline until DS-02 completes; landing and app remain dual visual languages.

### Design system integration

- Registry + ADR-DS-001/002 define target state; implementation is **documentation-heavy, runtime-light**.
- `mio-glass` class system provides repeatable surfaces on Profile, Vault, World, Pathfinder.
- Score presentation maps are co-located with domain logic (`calendar-scores.ts`, `strategic-gps.ts`, `synergy.ts`).

**Scaling risk:** Low for near-term if DS-02 executes; high if new surfaces copy nearest literals (registry documents this drift path).

### Frontend scaling verdict

**Adequate for 1–2 engineers adding incremental surfaces.** **Inadequate for parallel feature teams or rapid module expansion** without shared hooks, route groups, server-backed state, and i18n consolidation.

---

## 2. Backend Scalability

### API boundaries

```
Client → FastAPI routers (/api/business|finance|real-estate|vault|pathfinder|world)
      → main.py batch/transit endpoints
      → services/* (orchestration)
      → packages/astro_engine (domain math)
      → schemas/* (response contracts)
```

| Router | Prefix | Maturity |
|--------|--------|----------|
| Business | `/api/business` | Production — Ask, chart, location-preview |
| Finance | `/api/finance` | Production — uses DecisionEngineFacade |
| Real Estate | `/api/real-estate` | Production — direct pipeline |
| Vault | `/api/vault` | **Minimal** — Mars only |
| Pathfinder | `/api/pathfinder` | Production — relocation + best-times |
| World | `/api/world` | Production — sky (cached), figure, city |
| Batch | `/api/batch`, `/api/batch-hourly` | Production — in `main.py` |

**Gap:** No API versioning; batch endpoints not in dedicated router; no auth middleware.

### Service organization

| Service | Role | Scalability note |
|---------|------|------------------|
| `scoring_pipeline.py` | Chart + score orchestration | Thin, stable — good |
| `chart_data.py` | Ephemeris + geocode + timezone | **Bottleneck** — external geocode |
| `pathfinder.py` | Relocation + best-times sweeps | **Bottleneck** — O(dates × scoring) |
| `world_feed.py` | Sky overlay + 30min cache | Good pattern, process-local |
| `vault_readings.py` | Rules → templates | Extensible per planet |
| `decision_engine.py` | Facade singleton | Under-adopted |

### Domain separation

`ScoringContext` is the primary domain separator — avoids scoring forks:

| Preset | Domain |
|--------|--------|
| `CONTEXT_NATAL` | Vault natal readings |
| `CONTEXT_CALENDAR_DAY` / `HOURLY` | Calendar |
| `CONTEXT_ASK_ELECTIONAL` | Ask, business, finance |
| `CONTEXT_PROPERTY` | Real estate |
| `CONTEXT_PATHFINDER` | Pathfinder |

Pathfinder additionally uses `services/pathfinder.py` for relocation-specific aggregation beyond standard activity scoring.

### Request lifecycle

1. Pydantic validates route-local request models (duplicated birth/location fields across routes).
2. Handler calls service or facade.
3. `score_with_context` → `build_chart_payload` → `calculate_activity_score`.
4. `build_scoring_response` validates breakdown + optional reasoning (soft-fail).
5. JSON response with `ActivityScoreResponse` shape.

**Batch path:** Prime geocoding → `asyncio.gather` + thread pool → per-item error dicts (partial failure tolerant).

### Validation

- Regex patterns on dates/times; lang enum; numeric bounds on search windows.
- `validate_component_breakdown()` and `validate_score_reasoning()` on responses.
- Action allowlists per route (`FINANCE_ACTIONS`, etc.).

**Gap:** Duplicate request model definitions across business/finance/real-estate/batch — drift risk at scale.

### Caching opportunities

| Current | Opportunity |
|---------|-------------|
| `@lru_cache` geocode/timezone (2048, in-process) | Redis/KV for multi-replica |
| World `/sky` 30min dict cache | Extend to `/figure`, `/city` |
| None for chart fingerprints | Cache natal chart by birth fingerprint |
| None for pathfinder best-times | Precompute or async job for long windows |
| Calendar batch per-request | Acceptable; very large ranges need job queue |

### Backend scaling verdict

**Strong for single-tenant consumer scale** on one Railway instance. **Needs distributed cache, job queue, and unified facade** before high traffic or enterprise batch workloads.

---

## 3. Domain Architecture

### Domain mapping matrix

| Product domain | Route / API | Backend module | Mapping quality | Coupling risks |
|----------------|-------------|----------------|-----------------|----------------|
| **Ask** | `/ask` → `POST /api/business/analyze` | `CONTEXT_ASK_ELECTIONAL` | **Clean** | Shares pipeline with dashboard/finance; oracle copy in `oracle-questions.ts` |
| **Calendar** | `/calendar` → batch + hourly + transit | `CONTEXT_CALENDAR_*` | **Clean** | Frontend `calendar/page.tsx` couples GPS, ICS, scores, prefs |
| **Pathfinder** | `/pathfinder` → `/api/pathfinder/*` | `pathfinder.py` + `CONTEXT_PATHFINDER` | **Clean** | Separate aggregation model; paywall in frontend only |
| **People** | `/people` → localStorage + synastry lib | `relationship_profile.py` (**tests only, no API route**) | **Partial** | Synastry computed client-side or via business analyze; no dedicated people API |
| **Provider** | `/vault/provider` (UI stub) | No dedicated API; wealth lines in vault copy | **Immature** | Concept split between Vault section and finance/dashboard |
| **Vault** | `/vault`, `/vault/[section]` | `vault_rules.py`, `vault_templates.py`, `POST /api/vault/mars` | **Partial** | 6 of 7 sections lack backend endpoints; tier gate client-only |
| **Julia** | Upgrade VIP copy, Ask advisor card, `DailyBriefView` | **None** | **Not mapped** | Expert service has no scheduling, CRM, or delivery boundary |
| **World** | `/world` → `/api/world/*` + BFF | `world_feed.py`, `world_figures.py` | **Moderate** | Mixed fetch paths; qualitative tones separate from scoring |

### Cross-domain coupling

```
                    ┌─────────────────┐
                    │  astro_engine   │
                    │   scoring.py    │
                    └────────┬────────┘
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
    Calendar            Ask/Finance         Pathfinder
         │                   │                   │
         └─────────┬─────────┴─────────┬─────────┘
                   ▼                   ▼
            calendar-scores.ts    score-breakdown.ts
            (bands + fetch)       (shared adapter)
                   │
                   ▼
              BAND_STYLES / scoreToBand
              (shared presentation)
```

- **People → Ask:** Relationship profiles reference meeting actions that resolve to Ask action types.
- **Calendar → Home:** `MonthHeatmapGrid` and `DailyBriefView` share `calendar-scores.ts` and `BAND_STYLES`.
- **Vault → Profile:** Vault readings require natal chart from birth profile.
- **Dashboard (legacy) → Business/Finance/RE:** Triplicate analyze flows outside AppShell.

### Domain scaling verdict

**Core timing/scoring domains (Ask, Calendar, Pathfinder) map cleanly** to backend contexts. **Relationship, Provider, Julia, and full Vault** require new API and service boundaries before they can scale as independent product lines.

---

## 4. Data Flow

### Client/server boundaries

| Layer | Pattern |
|-------|---------|
| Landing `/` | Static prerender + client WebGL |
| App routes | Client components; hydrate → localStorage → fetch API |
| Legal | Server components |
| BFF | Next.js API routes proxy geocode, news, markets |

**No RSC data fetching** for user profile or scores — all client-initiated after hydration.

### Async flow

- Manual `fetch` + `useState`/`useEffect` — no React Query/SWR.
- Calendar caches month scores in `localStorage` with composite keys.
- Batch score loading uses progress counters on Home.
- Pathfinder best-times can be long-running — no streaming or job polling.

### Duplicated logic

| Logic | Locations | Impact |
|-------|-----------|--------|
| Score band thresholds | `scoreToBand()` (85/60/40) vs `_rating()` (80/65/45/30) | User-visible label/score mismatch risk |
| Birth/location request shape | 4+ Pydantic models in API routes | Schema drift |
| Lang bootstrap | 14+ pages | Copy-paste hydration |
| Font injection `.fc`/`.fi` | AppShell, Login, Legal, Dashboard, Disclaimer | Style duplication |
| API base URL | `calendar-scores.ts` vs `dashboard` hardcoded localhost | Environment bug |

### Scoring pipeline (canonical)

```
Birth profile (client localStorage)
  → POST /api/batch | /api/business/analyze | /api/pathfinder/*
  → score_with_context(ScoringContext)
  → calculate_activity_score()
  → build_scoring_response() + optional reasoning
  → snake_case JSON
  → score-breakdown.ts / calendar-scores.ts (adapters)
  → UI components (BAND_STYLES, ScoreBreakdownPanel)
```

**Strength:** Single pipeline with tested invariants.  
**Weakness:** Frontend adapters and band mapping are a second presentation layer outside API contract.

### API contracts

- `ActivityScoreResponse` with strategic/technical breakdown layers — well-tested.
- `DecisionOutcome` (facade) — maps from activity response; only finance exposes this today.
- Reasoning attachment is optional and soft-fails — good for availability, requires client null-checks.

### Data flow verdict

**Pipeline is sound and testable.** **Presentation-layer duplication and threshold divergence** are the primary scaling defects in data flow.

---

## 5. Extensibility

### New interpretation frameworks

| Capability | Readiness |
|------------|-----------|
| Backend evidence module | **High** — add package under `packages/`, register in Evidence Registry, feed facade |
| ScoringContext extension | **High** — new preset without forking `scoring.py` |
| Frontend module surface | **Low** — requires new monolithic page + i18n files |
| LLM / AI interpretation | **Not present** — reasoning is deterministic; no AI service boundary exists |

Phase 3 Evidence Pipeline spec defines framework admission; **runtime plumbing is backend-ready, frontend-not.**

### Premium tiers

| Capability | Readiness |
|------------|-----------|
| Tier definitions | **Present** — free/pro/premium/vip in `membership.ts` |
| Server enforcement | **Absent** — client localStorage only |
| Stripe / billing | **Documented as future (R3)** — not implemented |
| Feature gating | Scattered `hasTier()` checks in vault, pathfinder, upgrade |

**Cannot scale monetization** without server-side entitlement service.

### Additional AI services

- No abstraction for external model providers.
- `/api/translate` exists as BFF proxy — pattern could extend.
- Constitutional constraints require explainability before accuracy claims — any AI layer must route through Explainability Engine spec (not implemented as runtime).

### New decision domains

- **Backend:** Add router + `ScoringContext` + action profile — **moderate effort**.
- **Frontend:** New page + i18n + nav + band presentation — **high effort** due to page-centric pattern.
- Facade uniform adoption would reduce per-domain integration cost.

### Enterprise capabilities

| Requirement | Current state |
|-------------|---------------|
| Multi-tenant auth | Auth stub in localStorage |
| Org accounts | Not supported |
| Audit logging | `chart_monitor` only; no user audit trail |
| SLA / rate limits | None |
| Data residency | Not configured |
| SSO | Not present |

**Enterprise extensibility: not ready.**

### Extensibility verdict

**Backend modular enough for new evidence frameworks and decision domains.** **Frontend and entitlements block fast product expansion** without evolutionary refactors already identified in Phase 2.

---

## 6. Operational Scalability

### Deployment topology

| Tier | Platform | Artifact |
|------|----------|----------|
| Frontend | Cloudflare Workers | OpenNext build → `wrangler.jsonc` |
| API | Railway | `railway.toml` + `nixpacks.toml`, Python 3.11 |
| Monorepo root | Node `package.json` | Dev scripts only; Nixpacks forces Python |

**Dual-deploy coordination** required for every API URL change.

### Environment separation

- `.env.local` for `NEXT_PUBLIC_API_BASE` (frontend).
- API: no required env vars today per `DEPLOY.md`.
- **No staging/prod environment definitions** in repo.
- Dev routes gated by middleware (`/dev/*` → 404 in production).

### Configuration management

- Build-time env for API base (frontend).
- `.python-version` + `NIXPACKS_PYTHON_VERSION` for API.
- Tier/auth/settings in client localStorage — **not environment config**.

### Observability

| Signal | Implementation |
|--------|----------------|
| Chart errors | `chart_monitor.log_chart_error()` — structured JSON to stdout |
| Reasoning failures | Warning log, returns null |
| Request tracing | **None** |
| Metrics (latency, error rate) | **None** |
| APM / Sentry | **None** in repo |

Logging is **inconsistent** — business routes use `chart_monitor`; finance/real-estate/world often do not.

### Error handling

- Per-route `try/except` → `HTTPException` (422/400/503/500).
- Batch partial failure returns per-item `{"error": str(e)}`.
- No global exception handler; no correlation IDs.
- Frontend: generic error strings; no centralized error boundary.

### Operational verdict

**Adequate for single-team manual deploys.** **Insufficient for weekly production releases at scale** without CI, staging, metrics, and distributed caching (confirmed by `ENGINEERING_READINESS.md`).

---

## 7. Dependency Risk

### Framework lock-in

| Dependency | Lock-in level | Notes |
|------------|---------------|-------|
| **Next.js 16** | **High** | App Router, OpenNext Cloudflare adapter, middleware conventions |
| **FastAPI** | Medium | Standard Python ASGI; portable |
| **React 19** | Medium | Ecosystem standard |
| **Tailwind 4** | Medium | Utility classes throughout |
| **Cloudflare Workers** | **High** for frontend | `nodejs_compat`, OpenNext coupling |
| **Railway** | Medium | Nixpacks-specific but portable to other Python hosts |

### Library concentration

| Library | Role | Criticality |
|---------|------|-------------|
| **pyswisseph** | All chart math | **Critical** — single vendor (Astrodienst SWE) |
| **geopy / Nominatim** | Geocoding | **High** — external HTTP, rate limits |
| **timezonefinder / pytz** | TZ resolution | High |
| **Three.js** | Landing WebGL | Medium — lazy-loaded, removable per baseline gate |
| **Playwright** | Visual/e2e tests | Dev-time only |

### Third-party operational dependencies

- **OpenStreetMap Nominatim** — no fallback geocoder in repo.
- **No CDN asset pipeline** beyond Cloudflare static assets.
- **No payment provider** integrated yet.

### Dependency verdict

**Swiss Ephemeris and geocoding are single points of failure.** Frontend is coupled to Cloudflare OpenNext path. Acceptable for current scale; document fallbacks before international traffic growth.

---

## 8. Top 10 Architectural Hotspots

| Rank | Module / file | Lines (approx.) | Why it becomes a bottleneck |
|------|---------------|-----------------|-----------------------------|
| 1 | `packages/astro_engine/scoring.py` | 891 | Every domain funnels here; changes ripple to all surfaces; hardest to test in isolation at scale |
| 2 | `apps/web/app/upgrade/page.tsx` | 1,519 | Pricing, tiers, i18n, modals, Julia copy — blocks monetization evolution |
| 3 | `apps/web/app/vault/[section]/page.tsx` | 1,401 | Vault expansion requires editing monolith; only Mars has API |
| 4 | `apps/web/app/calendar/page.tsx` | 1,106 | Central timing UX; couples scores, GPS, ICS, prefs, lang |
| 5 | `apps/api/src/services/pathfinder.py` | 675 | Best-times nested loops; heaviest single-request compute |
| 6 | `packages/astro_engine/reasoning.py` | 601 | Explainability growth adds complexity to shared module |
| 7 | `apps/api/src/services/chart_data.py` | 416 | Geocoding + ephemeris I/O; external HTTP latency |
| 8 | `apps/web/lib/calendar-scores.ts` | 460 | Frontend adapter + `BAND_STYLES` + `scoreToBand` + fetch — presentation/data coupling |
| 9 | `apps/web/lib/synastry-i18n.ts` | 814 | i18n god file for People domain; blocks localization scale |
| 10 | `apps/api/src/main.py` | 277 | Thread pool, batch endpoints, CORS — operational hub without router separation |

**Honorable mentions:** `profile/page.tsx` (955), `NatalChart.tsx` (616), duplicate Pydantic request models across routes, `home-i18n.ts` (shared nav god object).

---

## Recommended Refactoring Candidates

*Evolutionary candidates aligned with Phase 2/3 — not redesign proposals.*

| Priority | Candidate | Rationale | Domains helped |
|----------|-----------|-----------|----------------|
| P0 | **Server-side entitlements layer** | Replace `membership.ts` localStorage for real tiers | Premium, Vault, Pathfinder, Julia |
| P0 | **CI + observability baseline** | Metrics, correlation IDs, consistent `chart_monitor` | Operations (all) |
| P1 | **Uniform facade adoption** | Route all analyze endpoints through `DecisionEngineFacade` | Ask, Finance, RE, future domains |
| P1 | **Shared `useAppContext()` hook** | Lang, profile, tier hydration once | All frontend |
| P1 | **Extract calendar page modules** | Month grid, hourly strip, GPS panel, ICS export | Calendar |
| P1 | **Distributed geocode/timezone cache** | Redis/KV across Railway replicas | Calendar, Ask, Pathfinder |
| P2 | **Route groups `(marketing)` / `(app)`** | Layout separation, code splitting | Frontend scale |
| P2 | **Base `BirthLocationRequest` Pydantic model** | Deduplicate API request schemas | All analyze routes |
| P2 | **Vault API per section** | Move section logic from 1,400-line page to API + thin client | Vault, Provider |
| P2 | **People API route** | Expose `relationship_profile.py` via HTTP | People |
| P2 | **Align `scoreToBand` with `_rating` thresholds** | Single band table in API contract | Calendar, Ask, Home |
| P3 | **i18n consolidation** | Message catalog or namespace-per-domain loader | All surfaces |
| P3 | **Async job queue for pathfinder best-times** | Prevent long HTTP holds | Pathfinder |
| P3 | **Julia service boundary** | Scheduling/delivery module when VIP launches | Julia |
| P3 | **Decompose `upgrade/page.tsx`** | Tier cards, comparison table, modals as components | Upgrade |

---

## Validation Conclusion

### Is the current architecture sufficient for long-term execution?

**Yes, conditionally.**

The repository already embodies the most important long-term bet: **one scoring engine, many contexts**. That aligns with the Phase 3 vision of one Decision Intelligence Engine and multiple evidence frameworks. Backend tests, `ScoringContext`, the decision facade, and deterministic reasoning provide a credible foundation for Personal Decision Intelligence at consumer scale.

**Conditions for sustained scale:**

1. **Frontend must evolve from page monoliths to composable modules** — otherwise each new domain (Provider, Julia, enterprise) multiplies copy-paste cost superlinearly.
2. **Entitlements must move server-side** — premium tiers, Vault, and Pathfinder cannot scale on `localStorage`.
3. **Facade and contract unification must complete** — partial adoption and threshold divergence erode the "one engine" story.
4. **Operations must mature** — CI, staging, distributed cache, and basic observability are prerequisites for weekly releases (per engineering readiness).
5. **Immature domains need boundaries before expansion** — Julia and Provider are product concepts without architectural homes; building features before boundaries will create rework.

### What does not need redesign

- Swiss Ephemeris scoring core
- Monorepo layout (`apps/` + `packages/`)
- Railway + Cloudflare dual deploy
- `ScoringContext` domain routing pattern
- Deterministic reasoning approach
- Design Token Registry authority model

### Architecture trajectory

The gap between **current state** (Phase 2 feature monolith) and **target state** (Phase 3 platform) is **well-documented and bridgeable through incremental evolution** — not rewrite. The architecture is validated as **directionally correct** and **execution-ready** for the next engineering sprints (hygiene → DS-02 → facade expansion → entitlement server), with frontend modularization and operational maturity as the gating investments for long-term scale.

---

## References

| Document | Use in this validation |
|----------|------------------------|
| [PHASE2_ARCHITECTURE_BASELINE.md](../PHASE2_ARCHITECTURE_BASELINE.md) | As-built audit, threshold delta, domain table |
| [PHASE3_ARCHITECTURE_BLUEPRINT.md](./architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md) | Long-term vision alignment |
| [ENGINEERING_READINESS.md](./ENGINEERING_READINESS.md) | Build/test/ops gaps |
| [DECISION_INTELLIGENCE_ENGINE.md](./architecture/DECISION_INTELLIGENCE_ENGINE.md) | Target engine model |
| [design-token-registry.md](./design/system/design-token-registry.md) | Theming authority path |
| [PATHFINDER_SCORING.md](../PATHFINDER_SCORING.md) | Pathfinder domain methodology |

---

*This document is the output of the Architecture Scalability Validation sprint. No code, ADRs, or governance were modified.*
