# METIORO Phase 2 — Architecture Baseline

**Document purpose:** Foundation for platform-oriented evolution.  
**Scope:** Audit and design only — no route changes, no new features, no business-logic changes in this sprint.  
**Date:** July 2026  
**Compatibility constraint:** All recommendations must remain compatible with the existing Swiss Ephemeris engine (`packages/astro_engine/ephemeris.py`) and the current scoring pipeline (`packages/astro_engine/scoring.py` → `apps/api/src/services/scoring_pipeline.py`).

---

## Executive Summary

METIORO today is a **feature-oriented monolith**: each surface (Today, Calendar, Ask, People, Pathfinder, World, Vault, Dashboard) owns its own UI, i18n, loading patterns, and often its own interpretation of scores and timing bands. The **calculation core is already centralized** in `packages/astro_engine`, with API routing through `ScoringContext` presets — but **presentation and vocabulary are fragmented** across ~13 i18n files and multiple independent band mappers.

Phase 2 should **evolve, not rewrite**: extract shared decision/timing contracts, consolidate duplicated UI primitives, and align navigation semantics — while keeping every existing endpoint and user flow working during migration.

---

## 1. Current Architecture

### 1.1 Repository Layout

```
planet-life/
├── apps/
│   ├── web/          # Next.js 16 frontend (Cloudflare Workers)
│   └── api/          # FastAPI backend (Railway)
├── packages/
│   └── astro_engine/ # Swiss Ephemeris + scoring + reasoning + vault rules
└── ROADMAP.md        # Product bands (partially diverges from code)
```

| Layer | Role | Key files |
|-------|------|-----------|
| Ephemeris | Chart computation | `packages/astro_engine/ephemeris.py` |
| Scoring | Activity scores 0–100 | `packages/astro_engine/scoring.py` |
| Context routing | Per-module location/technique presets | `packages/astro_engine/scoring_context.py` |
| Reasoning | Deterministic explanations | `packages/astro_engine/reasoning.py` |
| API pipeline | Chart build + score | `apps/api/src/services/scoring_pipeline.py`, `chart_data.py` |
| API contract | Stable response shape | `apps/api/src/schemas/score_breakdown.py`, `score_reasoning.py` |
| Frontend adapters | snake_case → UI types | `apps/web/lib/score-breakdown.ts`, `score-reasoning.ts`, `calendar-scores.ts` |

### 1.2 Frontend Routes

| Route | Page file | In bottom nav? | Primary role |
|-------|-----------|----------------|--------------|
| `/` | `app/page.tsx` | No | Marketing landing |
| `/home` | `app/home/page.tsx` | Yes (`today`) | Daily Brief / Today |
| `/calendar` | `app/calendar/page.tsx` | Yes (`map`) | Month + hourly timing map |
| `/ask` | `app/ask/page.tsx` | Yes (`ask`) | Oracle — templated Q&A scoring |
| `/people` | `app/people/page.tsx` | Yes (`people`) | Relationship list |
| `/people/[id]` | `app/people/[id]/page.tsx` | No | Person detail + synastry |
| `/pathfinder` | `app/pathfinder/page.tsx` | Yes (`pathfinder`) | Relocation / travel timing |
| `/world` | `app/world/page.tsx` | Yes (`world`) | Sky signals / collective timing |
| `/vault` | `app/vault/page.tsx` | Header pill only | Vault gate + section index |
| `/vault/[section]` | `app/vault/[section]/page.tsx` | No | Vault module detail |
| `/profile` | `app/profile/page.tsx` | Yes (`me`) | Birth profile + chart |
| `/settings` | `app/settings/page.tsx` | Yes (`settings`) | App preferences |
| `/dashboard` | `app/dashboard/page.tsx` | **No** | Legacy analyzer (business/finance/RE) |
| `/upgrade` | `app/upgrade/page.tsx` | No | Tier selection |
| `/login` | `app/login/page.tsx` | No | Auth stub |
| `/setting` | `app/setting/page.tsx` | No | Redirect → `/settings` |
| `/privacy`, `/terms`, `/cookies`, `/disclaimer`, `/contact` | Legal pages | No | Compliance |
| `/dev/chart-test` | Dev only | No | Chart debugging |

**Navigation source of truth:** `apps/web/components/BottomNav.tsx`  
Vault is promoted to a **header pill** (`VaultPill`) via `AppShell`, not the sidebar.

### 1.3 Backend API Routes

| Prefix / endpoint | Router | Scoring context | Notes |
|-------------------|--------|-----------------|-------|
| `POST /api/business/analyze` | `routes/business.py` | `CONTEXT_ASK_ELECTIONAL` | Used by `/ask` and legacy `/dashboard` |
| `POST /api/finance/analyze` | `routes/finance.py` | `CONTEXT_ASK_ELECTIONAL` | Dashboard only (not in nav) |
| `POST /api/real-estate/analyze` | `routes/real_estate.py` | `CONTEXT_PROPERTY` | Dashboard only |
| `POST /api/batch` | `main.py` | `CONTEXT_CALENDAR_DAY` | Calendar month scores |
| `POST /api/batch-hourly` | `main.py` | `CONTEXT_CALENDAR_HOURLY` | Calendar hourly strip |
| `POST /api/transit` | `main.py` | — | Transit chart data |
| `POST /api/vault/mars` | `routes/vault.py` | `CONTEXT_NATAL` + vault rules | Only live Vault API |
| `POST /api/pathfinder/*` | `routes/pathfinder.py` | `CONTEXT_PATHFINDER` | Separate aggregated model |
| `POST /api/world/*` | `routes/world.py` | Non-scoring sky signals | Qualitative tones |
| `GET /` | `main.py` | — | Health + platform metadata |

**Scoring context presets** (`scoring_context.py`):

| Preset | `location_mode` | Used by |
|--------|-----------------|---------|
| `CONTEXT_NATAL` | `birthOnly` | Vault, natal-only modules |
| `CONTEXT_SYNASTRY` | `birthOnly` | People (alias of natal) |
| `CONTEXT_CALENDAR_DAY` | `currentLiving` | Calendar month |
| `CONTEXT_CALENDAR_HOURLY` | `currentLiving` | Calendar hours |
| `CONTEXT_ASK_ELECTIONAL` | `eventLocation` | Ask, business, finance |
| `CONTEXT_PROPERTY` | `targetSubject` | Real estate |
| `CONTEXT_PATHFINDER` | `birthAndTarget` | Pathfinder best-times |

### 1.4 Shared Components

| Component | Path | Used by |
|-----------|------|---------|
| `AppShell` | `components/AppShell.tsx` | Most authenticated pages |
| `BottomNav` / `VaultPill` | `components/BottomNav.tsx` | App shell + legacy dashboard/profile |
| `DailyBriefView` | `components/home/DailyBriefView.tsx` | `/home` |
| `CosmosCard` | `components/home/CosmosCard.tsx` | `/home` |
| `MonthHeatmapGrid` | `components/home/MonthHeatmapGrid.tsx` | `/home` |
| `ScoreBreakdownPanel` | `components/ScoreBreakdownPanel.tsx` | Calendar, Ask (detail) |
| `AnalysisResultBreakdown` | `components/AnalysisResultBreakdown.tsx` | `/dashboard` only |
| `ChartSkeleton` | `components/ChartSkeleton.tsx` | Profile, chart views |
| `NatalChart` | `components/NatalChart.tsx` | Profile |
| `CityAutocomplete` | `components/CityAutocomplete.tsx` | Dashboard, Pathfinder, profile flows |
| `ActionLocationPicker` | `components/ActionLocationPicker.tsx` | Ask, calendar location |
| `SynergyIntelligenceDashboard` | `components/SynergyIntelligenceDashboard.tsx` | People detail |
| `DisclaimerGate` / banners | `components/disclaimers/*` | Module entry points |
| `SiteFooter` / `LegalPageShell` | Legal/marketing | Landing, legal pages |

### 1.5 Shared Libraries (Frontend)

| Library | Purpose |
|---------|---------|
| `calendar-scores.ts` | API fetch, `scoreToBand`, golden/danger hour helpers |
| `score-breakdown.ts` | Normalizes `ActivityScoreResponse` for UI |
| `score-reasoning.ts` | Normalizes reasoning payload |
| `birth-profile.ts` | localStorage birth data |
| `user-locations.ts` | Living / event / target locations |
| `app-settings.ts` | Language, calendar type, chart prefs |
| `membership.ts` | Client-side tier (`free \| pro \| premium \| vip`) |
| `strategic-gps.ts` | Month/week/day narrative from scores |
| `synergy.ts` | Client-side synastry score (not API scoring pipeline) |
| `oracle-questions.ts` | Ask templates + band mapping |
| `brand.ts`, `site-metadata.ts`, `legal-content.ts` | Brand + SEO + legal |

### 1.6 i18n Architecture

**Pattern:** Per-feature translation files + large inline dicts in page components.

| File | Scope |
|------|-------|
| `home-i18n.ts` | Today / Daily Brief |
| `astrology-i18n.ts` | Dashboard analysis labels |
| `people-i18n.ts`, `synastry-i18n.ts`, `synastry-dashboard-i18n.ts`, `synastry-reasoning-i18n.ts`, `relationship-profile-i18n.ts`, `relationship-recommendations-i18n.ts` | People / relationships |
| `pathfinder-i18n.ts` | Pathfinder |
| `world-i18n.ts` | World sky signals |
| `chart-profile-i18n.ts` | Profile |
| Inline dicts | `calendar/page.tsx`, `ask/page.tsx`, `vault/page.tsx`, `dashboard/page.tsx`, `upgrade/page.tsx` |

**Languages:** `en`, `ru`, `fa`, `ar` — loaded via `loadAppLang()` / `saveAppLang()` with keys prefixed `planet-life-*`.

---

## 2. Problems & Architectural Inconsistencies

### 2.1 Duplicated Score → Band Logic

The same 0–100 score is classified differently in at least **six places**:

| Source | Thresholds | Labels |
|--------|------------|--------|
| `scoring.py` `_rating()` | 80 / 65 / 45 / 30 | Highly Favorable, Favorable, Mixed / Proceed with Awareness, Challenging, Unfavorable |
| `calendar-scores.ts` `scoreToBand()` | 85 / 60 / 40 | `green`, `yellow`, `orange`, `red`, `empty` |
| `oracle-questions.ts` `buildOracleAnswer()` | 85 / 60 / 40 (+ `gold` ≥85) | `gold`, `green`, `yellow`, `red`, `unknown` |
| `calendar/page.tsx` legend | 85 / 60 / 40 | Golden, Favorable, Caution, Avoid |
| `ROADMAP.md` product bands | 85 / 60 / 40 | A+ Golden, B Favorable, C Caution, F Friction |
| `pathfinder.py` `_score_area()` | 65 / 44 | `positive`, `mixed`, `challenging` |
| `synergy.ts` `synergyBadge()` | 70 / 40 | `aligned`, `caution`, (implicit low) |

**Impact:** A score of **82** is "Highly Favorable" in API executive rating but **yellow** (not green/golden) in Calendar and Ask UI. Golden hour detection uses **≥85** while backend "Highly Favorable" starts at **≥80**.

### 2.2 Duplicated Timing Vocabulary

Parallel naming systems for the same underlying score:

| Vocabulary set | Where used | Example terms |
|----------------|------------|---------------|
| Traffic-light colors | Calendar, Strategic GPS, BAND_STYLES | green, yellow, orange, red |
| Product bands | ROADMAP, Calendar legend | Golden, Favorable, Caution, Avoid |
| Hour windows | Calendar, home, ICS export | Golden window, Danger zone, Neutral |
| Executive ratings | API `executive.rating` | Highly Favorable, Mixed / Proceed with Awareness |
| Oracle bands | Ask page | gold, green, yellow, red |
| Pathfinder verdicts | Pathfinder API + i18n | positive, mixed, challenging → Favorable, Balanced, Challenging |
| Synastry badges | People | aligned, caution |
| World tones | World (non-numeric) | supportive, tension |
| Strategic GPS prose | home Strategic GPS card | Open highway, Foggy road, advance, pause |

There is **no single timing enum** shared between Python and TypeScript.

### 2.3 Duplicated Decision Output Shapes

Multiple parallel "result" structures instead of one contract:

| Shape | Fields | Origin |
|-------|--------|--------|
| `ActivityScoreResponse` | `executive`, `strategic`, `technical`, `reasoning` | API — canonical for electional scoring |
| `ExecutiveScore` | `score`, `rating`, `activity`, `summary`, `recommendation` | Inside ActivityScoreResponse |
| `ScoreReasoning` | `summary`, `confidence`, `reasons[]` | API + `score-reasoning.ts` |
| Oracle answer | `headline`, `body`, `band` | Client template in `oracle-questions.ts` |
| Pathfinder area | `score`, `verdict`, `reasons[]` | `pathfinder.py` — no component_breakdown |
| Synastry result | `score`, `badge`, `harmony[]`, `tension[]` | Client `synergy.ts` |
| Vault Mars verdict | Structured rules output | `vault_rules.py` + templates |

**Ask** uses the full API response but **discards** most layers, rendering only template text from `buildOracleAnswer()`. **Dashboard** renders the full breakdown via `AnalysisResultBreakdown`. **Calendar** uses scores + optional reasoning. Three different consumption depths for the same pipeline.

### 2.4 Duplicated UI Patterns

| Pattern | Implementations | Issue |
|---------|-----------------|-------|
| App chrome | `AppShell` vs manual `BottomNav` + header in `dashboard/page.tsx`, `profile/page.tsx` | Dashboard/profile duplicate shell layout (~200 lines each) |
| Score breakdown UI | `ScoreBreakdownPanel` vs `AnalysisResultBreakdown` | Overlapping purpose, different props |
| Loading states | Inline `.shimmer` CSS in dashboard; `ChartSkeleton`; text "Analyzing…" in Ask/World/Vault; `DailyBriefView` loading | No shared loading primitive |
| Card layout | `CosmosCard`, calendar day cells, vault section cards, pathfinder result cards | Similar glass/card styling reimplemented per page |
| Lang bootstrap | `loadAppLang()` repeated in `world`, `pathfinder`, `home`, etc. | Could be one hook |
| API base URL | `calendar-scores.ts` uses `NEXT_PUBLIC_API_BASE`; dashboard hardcodes `http://localhost:8000` | Environment inconsistency |

### 2.5 Feature vs Platform Boundaries

| Concern | Current state |
|---------|---------------|
| **Decisions** | Split across `/ask` (consumer Oracle), `/dashboard` (pro analyzer, hidden), and planned finance/career domains |
| **Today** | `/home` — mixes daily brief, Strategic GPS, golden hours |
| **Travel** | `/pathfinder` — separate scoring model, paid gate |
| **Relationships** | `/people` — client-side synastry, not unified with decision pipeline |
| **Vault** | Marketing-heavy stub; only Mars API live |
| **Tier enforcement** | `membership.ts` localStorage; minimal gates (Pathfinder, Vault UI) |

### 2.6 Legacy & Naming Debt

- localStorage keys still use `planet-life-*` prefix (intentionally preserved during rebrand).
- Wrangler project name `planet-life-web` unchanged.
- `CosmicRead` / internal naming persists while user copy was cleaned.
- `/dashboard` is a full analyzer not linked from navigation — overlaps `/ask` + future Decisions domain.
- Bottom nav label `map` for `/calendar` vs target IA `Calendar`.
- Bottom nav `pathfinder` / `Path` vs target `Travel`.
- Profile labeled `Me` vs Settings split in target IA.

### 2.7 Documentation Drift

`ROADMAP.md` band table (85/60/40, A+ Golden) **does not match** backend `_rating()` (80/65/45/30). New developers will implement against the wrong thresholds.

---

## 3. Target Information Architecture

### 3.1 Proposed Top-Level Navigation

| Target nav | Current route(s) | Current nav key | Notes |
|------------|------------------|-----------------|-------|
| **Today** | `/home` | `today` | Rename route optionally to `/today` later |
| **Decisions** | `/ask` + `/dashboard` (merge) | `ask` (+ hidden dashboard) | Single decision hub; domain tabs internal |
| **Relationships** | `/people`, `/people/[id]` | `people` | Keep detail as sub-route |
| **Travel** | `/pathfinder` | `pathfinder` | Rename route to `/travel` later |
| **World** | `/world` | `world` | Unchanged |
| **Calendar** | `/calendar` | `map` | Rename nav label only first |
| **Vault** | `/vault`, `/vault/[section]` | header pill | May stay out of bottom nav |
| **Settings** | `/settings` + `/profile` | `settings` + `me` | Consolidate "Me" into Settings or sub-route |

**Out of primary nav (unchanged):** `/`, `/upgrade`, `/login`, legal pages, `/dev/*`.

### 3.2 Migration Plan (Routes — Design Only)

**Principle:** Add aliases and redirects before removing old paths. No user-facing feature changes during Phase 2.

#### Phase 2a — Label alignment (zero route change)
1. Update `BottomNav` i18n keys: `map` → Calendar label, `pathfinder` → Travel label.
2. Document `/dashboard` as deprecated; add link from Settings or Decisions dev flag only when ready.

#### Phase 2b — Route aliases (parallel paths)
| New alias | Points to | Redirect old? |
|-----------|-----------|---------------|
| `/today` | `/home` | Optional 308 from `/home` after clients updated |
| `/decisions` | `/ask` initially | Later absorbs dashboard |
| `/travel` | `/pathfinder` | 308 from `/pathfinder` when stable |

#### Phase 2c — Decisions consolidation
1. Move dashboard analyze UI behind `/decisions` with internal tabs: Oracle | Business | Finance | Property.
2. Deprecate `/dashboard` with redirect to `/decisions?mode=analyzer`.
3. Unify on `ActivityScoreResponse` rendering via one breakdown component.

#### Phase 2d — Settings / Profile
1. Keep `/profile` as `/settings/profile` sub-route OR embed profile in settings page.
2. Remove duplicate `BottomNav` from profile/dashboard once on AppShell everywhere.

#### Phase 2e — Vault placement
- Vault remains header pill (premium signifier) unless user research favors nav slot.
- Deep links `/vault/[section]` unchanged.

**Do not implement in Phase 2 sprint 1** — this section is the migration blueprint only.

---

## 4. Universal Decision Architecture (Specification Only)

### 4.1 Inventory: Where Decisions Are Generated

| Module | Score | Timing | Reasoning | Recommendation | Confidence | Summary |
|--------|-------|--------|-----------|----------------|------------|---------|
| Calendar (day) | ✅ `executive.score` via batch | ✅ date + band | ✅ optional `reasoning` | ⚠️ implicit in band copy | ✅ `reasoning.confidence` | ⚠️ strategic key_themes |
| Calendar (hourly) | ✅ per hour | ✅ hour window | ✅ batch reasoning | ⚠️ golden/danger labels | ✅ | ❌ |
| Ask / Oracle | ✅ `/api/business/analyze` | ✅ date/time in template | ❌ discarded in UI | ✅ template body | ❌ not shown | ✅ headline |
| Dashboard | ✅ full API | ✅ target date | ✅ full reasoning | ✅ executive.recommendation | ✅ | ✅ executive.summary |
| Pathfinder areas | ✅ 0–100 relocation | ❌ not electional | ✅ reasons[] | ⚠️ verdict only | ❌ | ❌ |
| Pathfinder best-times | ✅ aggregated | ✅ date ranges | ❌ | ❌ ranked list | ❌ | ❌ |
| People / Synastry | ✅ client calc | ❌ | ✅ synastry reasoning i18n | ✅ relationship recs | ❌ | ⚠️ badge label |
| Vault Mars | ❌ not 0–100 | ⚠️ natal placement | ✅ vault_rules | ✅ templates | ❌ | ✅ template prose |
| World | ❌ | ✅ sky event timing | ⚠️ qualitative | ❌ | ❌ | ✅ signal text |
| Home / Strategic GPS | ✅ derived from calendar | ✅ macro/meso/micro | ❌ | ✅ GPS prose | ❌ | ✅ month narrative |

### 4.2 Proposed Universal Interface

Evolve from existing `ActivityScoreResponse` rather than replacing it. Add a **view-model adapter layer** in `apps/web/lib/decision/` (future) and a **Python serializer helper** (future) that can wrap any module output.

```typescript
/**
 * Platform-wide decision view model.
 * Adapts ActivityScoreResponse, Pathfinder payloads, Synastry, Vault, World.
 * NOT a replacement for the API contract — a normalized read model for UI + AI layers.
 */
interface DecisionEvidence {
  category: string;           // aligns with ReasonCategory where applicable
  title: string;
  explanation: string;
  importance?: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
}

interface DecisionTiming {
  /** ISO date or datetime the decision applies to */
  anchor: string;
  /** Unified band — see Section 5 */
  band: TimingBand;
  /** Optional hour-level precision */
  window?: { start: string; end: string };
  /** Human label resolved via i18n from band + module context */
  label?: string;
}

interface DecisionResult {
  /** Stable module identifier */
  domain: 'calendar' | 'ask' | 'business' | 'finance' | 'property' | 'travel' | 'relationships' | 'vault' | 'world' | 'today';
  /** Activity or question slug */
  subject: string;

  score?: number;              // 0–100 when numeric scoring applies
  timing: DecisionTiming;
  confidence?: number;         // 0–1 from ScoreReasoning when present

  summary: string;
  recommendation?: string;
  explanation?: string;        // Longer narrative (Oracle body, vault template, etc.)
  evidence: DecisionEvidence[];

  /** Preserve raw payload for debug / power users */
  source: {
    engine: 'activity_score' | 'pathfinder' | 'synastry' | 'vault_rules' | 'world_signal' | 'client_compose';
    raw: unknown;
  };
}
```

**Python mirror** (for API responses that choose to emit it):

```python
# Future: apps/api/src/schemas/decision_result.py
# Builds from ActivityScoreResponse via adapter — does not change scoring.py output initially.
```

### 4.3 Adapter Mapping (Evolution Path)

| Source | Adapter function (proposed) | Maps to DecisionResult |
|--------|----------------------------|------------------------|
| `ActivityScoreResponse` | `fromActivityScore()` | score, timing from target date, confidence, evidence from reasoning.reasons, recommendation from executive |
| Pathfinder area | `fromPathfinderArea()` | score, timing.band from verdict mapping, evidence from reasons |
| Synastry | `fromSynastry()` | score, timing.band from badge mapping, evidence from harmony/tension |
| Vault Mars | `fromVaultMars()` | no score; evidence from rules; summary from template |
| World signal | `fromWorldSignal()` | no score; timing from event date; evidence from signal parts |
| Oracle template | `fromOracleAnswer()` | score + band until Ask consumes full API reasoning |

### 4.4 Design Rules

1. **Do not change** `calculate_activity_score()` return shape in Phase 2 — adapters only.
2. **Pathfinder stays a separate engine** but exposes the same `DecisionResult` read model.
3. **Ask should eventually consume** `executive` + `reasoning` instead of template-only answers — adapter makes that migration incremental.
4. **Confidence** comes from `ScoreReasoning.confidence` today; default to module-specific heuristic only when missing.
5. **Evidence array** is the extension point for future AI narration — LLM receives `DecisionResult`, not raw ephemeris.

---

## 5. Timing Model Audit & Unified Proposal

### 5.1 Complete Vocabulary Inventory

#### Numeric band mappers (0–100)

| ID | Location | Breakpoints | Output |
|----|----------|-------------|--------|
| T1 | `scoring.py::_rating` | 80, 65, 45, 30 | Highly Favorable → Unfavorable |
| T2 | `calendar-scores.ts::scoreToBand` | 85, 60, 40 | green, yellow, orange, red |
| T3 | `oracle-questions.ts` | 85, 60, 40 | gold, green, yellow, red |
| T4 | `calendar/page.tsx` legend | 85, 60, 40 | Golden, Favorable, Caution, Avoid |
| T5 | `ROADMAP.md` | 85, 60, 40 | A+ Golden, B, C, F Friction |
| T6 | `isGoldenHour` / `isDangerHour` | ≥85, ≤39 | binary windows |
| T7 | `pathfinder.py::_score_area` | 65, 44 | positive, mixed, challenging |
| T8 | `synergy.ts::synergyBadge` | 70, 40 | aligned, caution |

#### Non-numeric / narrative timing

| ID | Terms | Location |
|----|-------|----------|
| N1 | Golden window, Danger zone, Neutral | Calendar hourly, ICS |
| N2 | golden days, caution days | Strategic GPS |
| N3 | advance, build, review, pause | Strategic GPS weekly |
| N4 | Open highway, Supportive road, Foggy road, Slow lane | Strategic GPS monthly |
| N5 | Favorable, Balanced, Challenging | Pathfinder i18n |
| N6 | supportive, tension | World sky signals |
| N7 | Mixed / Proceed with Awareness | API executive rating |

### 5.2 Proposed Unified Timing Model

**One canonical enum** for platform UI and cross-module logic:

```typescript
type TimingBand =
  | 'optimal'      // was: golden, green, gold, Highly Favorable, positive, aligned
  | 'favorable'    // was: yellow-high, Favorable
  | 'caution'      // was: yellow-low, orange, Mixed, mixed, caution
  | 'avoid'        // was: red, Challenging, challenging, Unfavorable, danger
  | 'neutral'      // was: empty, neutral, balanced (context-dependent)
  | 'unknown';     // missing data
```

**Single canonical threshold table** (align code to ROADMAP + Calendar UI — the most user-visible):

| Score range | TimingBand | Display EN label | Action guidance |
|-------------|------------|------------------|-----------------|
| 85–100 | `optimal` | Optimal | Proceed with confidence |
| 60–84 | `favorable` | Favorable | Proceed with normal care |
| 40–59 | `caution` | Caution | Proceed with awareness; verify details |
| 0–39 | `avoid` | Avoid | Delay unless necessary |
| null | `unknown` | — | Insufficient data |

**Special cases (explicit mappings, not new bands):**

| Module | Mapping rule |
|--------|--------------|
| API `executive.rating` | Map existing strings → TimingBand at API boundary (do not change `_rating()` thresholds until coordinated) |
| Pathfinder verdict | `positive` → optimal/favorable by score≥85 else favorable; `mixed` → caution; `challenging` → avoid |
| Synastry badge | `aligned` → favorable/optimal by score; `caution` → caution |
| World tone | `supportive` → favorable; `tension` → caution; no numeric score |
| Golden/Danger hours | `optimal` hour if ≥85; `avoid` hour if ≤39; else `neutral` for hourly strip |

**Implementation location (future, not Phase 2 sprint 1):**
- `packages/astro_engine/timing.py` — `score_to_band(score: int) -> TimingBand` + label helpers
- `apps/web/lib/timing.ts` — mirror thresholds (or import from shared JSON generated at build)
- Deprecate direct use of `scoreToBand` color names in favor of `TimingBand` → theme tokens

**i18n:** One `timing-i18n.ts` for band labels; modules supply **context suffix** only ("Optimal for negotiation", not new band names).

---

## 6. Vault Audit

### 6.1 Vault Modules

| Section key | Title | API status | Primary astrology |
|-------------|-------|------------|-------------------|
| `sensuality` | Sensuality | ✅ `POST /api/vault/mars` | Mars, Pluto, Lilith |
| `cycle` | Body & Cycle | ❌ stub | Moon, cycle sync (health) |
| `provider` | The Provider | ❌ stub | Jupiter, astrocartography |
| `shadow` | Shadow Room | ❌ stub | Trust/secrecy patterns |
| `look` | Style Timing | ❌ stub | Moon/Venus daily style |
| `power` | Power Calendar | ❌ stub | Sex/money/distance timing |
| `lounge` | Pink Lounge | ❌ stub | Social/chat (VIP) |

Rules engine: `packages/astro_engine/vault_rules.py` + `vault_templates.py`.

### 6.2 Recommended Domain Placement

| Vault module | Primary future domain | Secondary | Remain in Vault? |
|--------------|----------------------|-----------|------------------|
| **sensuality** | Relationships | — | Yes — premium intimacy layer |
| **cycle** | Health | Today (daily rhythm) | Yes until Health domain exists; then sync from Health |
| **provider** | Finance | Travel (astrocartography), Relationships (partner type) | Partial — **Finance + Travel** surface summaries; Vault keeps depth |
| **shadow** | Relationships | Decisions (trust decisions) | Yes — sensitive; keep gated |
| **look** | Today | Career (professional appearance) | Partial — **Today** shows daily card; Vault keeps full history |
| **power** | Calendar | Relationships | Partial — merge into **Calendar** filters; Vault keeps explicit "power" framing |
| **lounge** | Vault only | — | Yes — VIP community, not a decision domain |

### 6.3 Vault Platform Strategy

1. **Vault = premium depth chamber**, not the primary home for cross-domain features.
2. As Health, Career, Finance domains ship, Vault modules become **deep links** into those domains with premium framing.
3. **`vault_rules.py` remains** the interpretation layer; domain apps consume via `DecisionResult` adapters.
4. Only Mars is live — Phase 2 should define **module → domain registry** in config, not move UI yet.

---

## 7. Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        apps/web (Next.js)                        │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐ │
│  │ AppShell +  │  │ Domain pages (Today, Decisions, …)       │ │
│  │ Navigation  │  │  └─ consume DecisionResult view models   │ │
│  └─────────────┘  └──────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ lib/decision/ adapters · lib/timing/ · shared components   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                     apps/api (FastAPI)                           │
│  routes/* → scoring_pipeline → astro_engine                       │
│  schemas: ActivityScoreResponse (keep) + DecisionResult (add)     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              packages/astro_engine                                 │
│  ephemeris · scoring · scoring_context · reasoning                 │
│  vault_rules · timing (future) · relationship_profile              │
└───────────────────────────────────────────────────────────────────┘
```

**Platform principles:**
- **One engine, many domains** — all electional scoring flows through `calculate_activity_score` + `ScoringContext`.
- **One timing vocabulary** — `TimingBand` everywhere in UI.
- **One decision read model** — `DecisionResult` adapters at the edge.
- **Domain pages are thin** — fetch, adapt, render shared components.

---

## 8. Migration Strategy

| Stage | Work | User-visible change |
|-------|------|---------------------|
| **S2-1 Documentation** | This baseline; align ROADMAP thresholds with chosen canonical table | None |
| **S2-2 Timing lib** | Add `timing.ts` / `timing.py` mirroring canonical bands; wrap existing functions | None if old functions delegate |
| **S2-3 Adapters** | `DecisionResult` adapters for ActivityScore + Pathfinder | None |
| **S2-4 UI primitives** | Shared `DecisionCard`, `TimingBadge`, `LoadingPanel`; migrate one page | Minimal visual parity |
| **S2-5 Shell unify** | Dashboard + profile on AppShell; fix API_BASE | None |
| **S2-6 Nav labels** | Calendar, Travel labels | Label only |
| **S2-7 Route aliases** | `/today`, `/travel`, `/decisions` | Old URLs still work |
| **S2-8 Decisions merge** | Dashboard → Decisions tab | Single entry point |
| **S2-9 Ask upgrade** | Show reasoning + executive in Ask | Richer answers, same questions |
| **S2-10 Vault registry** | Config map module → domain | None until domains exist |

**Backward compatibility:**
- Keep all existing API paths and response shapes through Phase 2.
- Add fields/adapters; don't remove `executive.rating` until clients migrated.
- localStorage keys remain `planet-life-*` until a dedicated migration sprint.

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Threshold change alters user-visible scores | High | Adopt ROADMAP thresholds (85/60/40) in UI first; change `_rating()` only in coordinated release with changelog |
| Dashboard removal breaks power users | Medium | Redirect + tab in Decisions; keep deep link |
| Pathfinder model incomparable to electional scores | Medium | Never merge scores; only unify **band labels** via mapping |
| i18n regression across 13 files | High | Introduce `timing-i18n.ts` incrementally; don't bulk-rename strings in Phase 2 |
| Dual API_BASE (dashboard localhost) | Medium | Quick win — fix immediately in refactor order |
| Vault domain split confuses premium UX | Low | Vault stays superset until Health/Career/Finance ships |
| Over-abstraction slows delivery | Medium | Adapters optional per page; mandate only for new code |
| Synastry client-side vs server scoring divergence | Medium | Document; future server synastry endpoint out of Phase 2 scope |

---

## 10. Recommended Refactoring Order

1. **Fix dashboard `API_BASE` hardcode** — use shared `API_BASE` from `calendar-scores.ts`.
2. **Add canonical timing module** (`timing.ts`) delegating from `scoreToBand` — zero behavior change initially.
3. **Document threshold delta** in ROADMAP or deprecate ROADMAP bands in favor of this doc.
4. **Create `DecisionResult` type + `fromActivityScore` adapter** with unit tests against fixture payloads.
5. **Unify shell** — migrate `dashboard/page.tsx` and `profile/page.tsx` to `AppShell`.
6. **Consolidate breakdown UI** — extend `ScoreBreakdownPanel` to cover dashboard cases; deprecate `AnalysisResultBreakdown`.
7. **Extract shared loading component** from dashboard shimmer pattern.
8. **Nav label alignment** (Calendar, Travel).
9. **Route aliases** (`/today`, `/travel`, `/decisions`).
10. **Merge dashboard into Decisions** behind feature flag.
11. **Ask page** — consume `DecisionResult` + show confidence/reasoning.
12. **Python `timing.py`** + API rating mapper.
13. **Vault domain registry** JSON/config.

---

## 11. Quick Wins

| Win | Effort | Impact |
|-----|--------|--------|
| Single `API_BASE` import everywhere | ~1 hour | Fixes production dashboard breakage |
| `timing.ts` wrapper with canonical thresholds | ~2 hours | Stops new duplication |
| ROADMAP ↔ code threshold note | ~30 min | Prevents wrong implementations |
| Nav label rename Map→Calendar, Path→Travel | ~1 hour | IA alignment, zero logic change |
| `/setting` already redirects — add `/today` → `/home` alias | ~1 hour | Future-proof routes |
| Vault module → domain comment map in `vault/page.tsx` or config | ~1 hour | Clarifies roadmap for engineers |

---

## 12. Long-Term Improvements

| Improvement | Depends on |
|-------------|------------|
| Server-side synastry scoring via `ScoringContext` | Relationships domain sprint |
| Shared `useAppLang()` hook | Frontend cleanup sprint |
| Generated TypeScript types from Pydantic schemas | OpenAPI codegen setup |
| Stripe + server entitlements replacing `membership.ts` | Monetization sprint |
| Health / Career / Finance domain modules | Product Phase 3+ |
| LLM narration layer consuming `DecisionResult` | AI sprint |
| Astrocartography map UI | Travel domain |
| Rename localStorage keys `planet-life-*` → `metioro-*` | Dedicated migration + user data script |
| Consolidated i18n (namespaces vs 13 files) | Localization sprint |

---

## Appendix A — File Reference Index

| Concern | Primary files |
|---------|---------------|
| Scoring engine | `packages/astro_engine/scoring.py` |
| Scoring contexts | `packages/astro_engine/scoring_context.py` |
| Reasoning | `packages/astro_engine/reasoning.py`, `apps/api/src/schemas/score_reasoning.py` |
| API response contract | `apps/api/src/schemas/score_breakdown.py` |
| Scoring pipeline | `apps/api/src/services/scoring_pipeline.py` |
| Calendar client | `apps/web/lib/calendar-scores.ts`, `apps/web/app/calendar/page.tsx` |
| Ask / Oracle | `apps/web/lib/oracle-questions.ts`, `apps/web/app/ask/page.tsx` |
| Pathfinder | `apps/api/src/services/pathfinder.py`, `apps/web/lib/pathfinder-i18n.ts` |
| Synastry | `apps/web/lib/synergy.ts`, `apps/web/lib/synastry-dashboard.ts` |
| Vault | `packages/astro_engine/vault_rules.py`, `apps/api/src/routes/vault.py`, `apps/web/app/vault/` |
| World | `apps/web/lib/world-i18n.ts`, `apps/api/src/routes/world.py` |
| Navigation | `apps/web/components/BottomNav.tsx`, `apps/web/components/AppShell.tsx` |
| Membership | `apps/web/lib/membership.ts` |
| Brand | `apps/web/lib/brand.ts` |

---

## Appendix B — Decision Domains (Future, Not in Scope)

For reference only — **do not implement in Phase 2:**

| Domain | Will absorb |
|--------|-------------|
| Health | Vault `cycle`, wellness timing |
| Career | Business actions from dashboard, Vault `look` (professional) |
| Finance | `/api/finance`, Vault `provider` (wealth lines) |

These domains will consume the same `DecisionResult` + `TimingBand` contracts defined above.

---

*End of Phase 2 Architecture Baseline.*
