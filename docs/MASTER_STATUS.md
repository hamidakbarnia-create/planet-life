# METIORO Master Status

> **Document type:** Sprint & workstream status registry
> **Last updated:** 2026-07-10
> **Authority:** Authoritative registry for sprint and workstream status per [GOVERNANCE.md](./governance/GOVERNANCE.md). Summarizes repository artifacts — does not override Constitution, Decision Log LOCKED entries, Token Registry, or LOCKED ADRs.

**Quick links:** [Governance](./governance/GOVERNANCE.md) · [Governance hub](./governance/README.md) · [Design Token Registry](./design/system/design-token-registry.md) · [Performance Baseline](./performance/BASELINE.md) · [UI Audit](./design/ui-audit/README.md)

---

## Executive Summary

METIORO is in an **Engineering Execution Phase** on branch `governance-foundation`: core product surfaces ship, governance and design-system architecture are documented, and the canonical [Design Token Registry](./design/system/design-token-registry.md) is active (DS-01). Repository health is **good** — Next.js 16 build passes, locked decisions are recorded in [DECISION_LOG.md](./governance/DECISION_LOG.md), and performance baseline is held on desktop while mobile LCP remains a known pre-existing gap. Maturity is **late MVP / early platform**: scoring, calendar, ask, people, vault, and landing v1 are implemented; design-token runtime migration and several performance items are approved but not yet executed.

---

## Product

| Topic | Status | Reference |
|-------|--------|-----------|
| **Product category** | **Personal Decision Intelligence** (LOCKED, DEC-0001) | [METIORO_CONSTITUTION.md](./governance/METIORO_CONSTITUTION.md) §1.2 |
| **Constitutional sentence** | *Know your best next move.* (Constitution / Brand Standard). Product `tagline` in `apps/web/lib/brand.ts` matches. Open Registry copy also references *Know your next move.* — reconciliation not completed in repo. | [BRAND_IDENTITY_STANDARD.md](./governance/BRAND_IDENTITY_STANDARD.md) §3.1 |
| **Hero headline** | *Every decision has a better time.* (LOCKED in product copy) | `apps/web/lib/landing-i18n.ts` |
| **One-sentence position** | **PROPOSAL** — recommended: *METIORO is a Personal Decision Intelligence platform that scores and explains timing and context for personal decisions.* Not official. | [one-sentence-position.md](./brand/one-sentence-position.md) |
| **Core philosophy** | Astronomy provides the signals → AI provides the reasoning → Humans make the decision. Guidance, not prophecy. | `apps/web/lib/landing-i18n.ts` (How it works) |
| **Explainability model** | Constitutional requirement: reasoning visible before accuracy claims; Explainability Engine explains Decision Outcomes, never creates them. | [EXPLAINABILITY_ENGINE_SPECIFICATION.md](./architecture/EXPLAINABILITY_ENGINE_SPECIFICATION.md) |
| **Brand tone** | Calm, Scientific, Explainable, Never Mystical (LOCKED, DEC-0004) | [DECISION_LOG.md](./governance/DECISION_LOG.md) |
| **Logo** | Concept B (LOCKED, DEC-0003) — `brand/metioro-master.svg` | [BRAND_IDENTITY_STANDARD.md](./governance/BRAND_IDENTITY_STANDARD.md) §7 |

---

## Product Architecture

Authenticated app routes use `AppShell`. Full per-screen detail: [screen-inventory.md](./design/ui-audit/screen-inventory.md).

| Module | Route / surface | Brief description |
|--------|-----------------|-------------------|
| **Today** | `/home` | Daily brief, score context, optional heatmap; onboarding for home view mode |
| **Calendar** | `/calendar` (nav: Map) | Strategic calendar — month/day/hour scores, export, GPS tone panel |
| **Ask** | `/ask` | Oracle flow: module → question → date → scored answer + history |
| **Pathfinder** | `/pathfinder` | Relocation astrology — city lines, effects, best times |
| **People** | `/people`, `/people/[id]` | Relationship profiles and synergy dashboard |
| **Provider** | `/vault/provider` | Vault section — wealth-line / astrocartography preview (not top-level nav) |
| **Vault** | `/vault`, `/vault/[section]` | Members-only preview gate; seven sections including sensuality, cycle, provider |
| **Julia** | No dedicated route | VIP tier on `/upgrade`; advisor card on `/ask`; vault/landing references |
| **World** | `/world` | Macro feeds — markets, geopolitics, figures, cities (desktop nav) |
| **Profile** | `/profile` | Birth data, natal chart, personal signature |
| **Settings** | `/settings` | Home view, house/zodiac/calendar prefs, language (desktop nav) |
| **Landing** | `/` | Marketing — editorial hero, trust, how-it-works, preview, CTA |
| **Upgrade** | `/upgrade` | Tier comparison (Free / Pro / Premium / VIP) |
| **Login** | `/login` | Auth entry (standalone chrome) |

**Notifications:** No notification center UI — calendar export mode "App notifications only" only ([navigation-map.md](./design/ui-audit/navigation-map.md)).

---

## Repository

| Item | Current state |
|------|---------------|
| **Repository** | `c:\planet-life` (monorepo: `apps/web`, `apps/api`, `packages/`) |
| **Branch** | `governance-foundation` (8 commits ahead of `origin/governance-foundation` at last status capture) |
| **Recent commits** | Design-system authority (DS-01), ADR-DS-001/002 proposals, UI audit, landing v1 |
| **Deployment config** | Frontend: Cloudflare Workers (`apps/web/wrangler.jsonc`, OpenNext). API: Railway (`railway.toml`, `apps/api/DEPLOY.md`) |
| **Build status** | `npm run build` in `apps/web` — **passing** (verified DS-01, 2026-07-07) |
| **Tests** | Vitest + Playwright e2e/visual configured (`apps/web/package.json`); root `test:pre-release` script |

---

## Technology

| Layer | Stack | Location / notes |
|-------|-------|------------------|
| **Frontend** | Next.js 16.2.6, React 19.2.4, TypeScript | `apps/web` |
| **Styling** | Tailwind CSS v4, custom CSS (`metioro-ui-v2.css`, `metioro-shell.css`) | `apps/web/app/` |
| **3D / ambient** | Three.js ^0.175.0 (lazy-loaded landing WebGL) | `components/CinematicHero.tsx` |
| **Backend** | FastAPI, Python 3.11, Swiss Ephemeris (`pyswisseph`) | `apps/api` |
| **Shared engine** | `packages/astro_engine`, `packages/decision_engine` | Monorepo root |
| **Frontend deploy** | Cloudflare Workers via `@opennextjs/cloudflare` | `npm run deploy:cf` |
| **API deploy** | Railway (Nixpacks Python 3.11) | [DEPLOY.md](../apps/api/DEPLOY.md) |
| **Monorepo** | npm workspaces-style scripts at root; apps independent | `package.json` |

---

## Governance

### Decision lifecycle (observed pattern)

```
Proposal → Review → ADR / Amendment → Commit → Lock
```

Permanent decisions register in [DECISION_LOG.md](./governance/DECISION_LOG.md). Architecture records in [ADR_INDEX.md](./governance/ADR_INDEX.md) and `docs/governance/adr/`, `docs/adr/`.

### Rule 0 (operational summary)

**Locked decisions are immutable.** AI agents and contributors must not redefine constitutional, ADR-locked, or Decision Log **LOCKED** entries without the formal change process ([METIORO_CONSTITUTION.md](./governance/METIORO_CONSTITUTION.md) §0.4–0.5). Observed in ADR-DS-001/002 governance reviews.

### Immutable / locked artifacts (summary)

| ID / doc | Status |
|----------|--------|
| DEC-0001 Personal Decision Intelligence | LOCKED |
| DEC-0002 Navigation model | LOCKED |
| DEC-0003 Logo Concept B | LOCKED |
| DEC-0004 Brand tone pillars | LOCKED |
| [METIORO_CONSTITUTION.md](./governance/METIORO_CONSTITUTION.md) | Supreme authority (Review) |
| Hero headline, locked brand category | Product / governance copy |

Full hierarchy: [DOCUMENT_HIERARCHY.md](./governance/DOCUMENT_HIERARCHY.md) · Hub: [governance/README.md](./governance/README.md)

---

## Architecture

```
Governance (Constitution, Trust, Brand, Registries)
    ↓
Brand (identity, tone, logo — Level 1)
    ↓
Architecture (Decision Intelligence Engine, Explainability, Phase 3 blueprint)
    ↓
Design System (ADR-DS-001/002, Token Registry, UI audit/inventory)
    ↓
Implementation (apps/web, apps/api, packages)
```

| Layer | Key documents |
|-------|---------------|
| Governance | [METIORO_CONSTITUTION.md](./governance/METIORO_CONSTITUTION.md) |
| Product architecture | [DECISION_INTELLIGENCE_ENGINE.md](./architecture/DECISION_INTELLIGENCE_ENGINE.md), [PHASE3_ARCHITECTURE_BLUEPRINT.md](./architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md) |
| Runtime migration (accepted pattern) | [ADR-0005](./adr/ADR-0005-Decision-Engine-Facade-First-Runtime-Migration.md) (finance analyze facade) |

---

## Design System

| Item | Status |
|------|--------|
| **[ADR-DS-001](./governance/adr/ADR-DS-001-design-system-architecture.md)** | **Proposed** — four-tier token architecture; incremental consolidation accepted |
| **[ADR-DS-002](./governance/adr/ADR-DS-002-runtime-semantic-token-consumption.md)** | **Proposed** — runtime maps must consume semantic tokens; migration principles defined |
| **[Design Token Registry](./design/system/design-token-registry.md)** | **ACTIVE** (DS-01) — canonical authority |
| **Inventory files** | Historical snapshot (pre-DS-01) — [design/system/README.md](./design/system/README.md) |
| **Implementation (DS-01)** | Registry authored; `--mio-body-sm` alias added; domain-map annotations; **no visual change** |
| **Migration status** | **Not started** — `BAND_STYLES`, `GPS_TONE_STYLES`, `BADGE_STYLES` still use raw literals (violations documented in registry) |

UI audit: [design/ui-audit/README.md](./design/ui-audit/README.md) · Components: [component-catalog.md](./design/system/component-catalog.md)

---

## Landing

| Area | Status | Reference |
|------|--------|-----------|
| **Landing v1** | **Complete** — editorial hero, trust, how-it-works, product preview, final CTA | [HISTORY.md](./performance/HISTORY.md) |
| **Accessibility** | Lighthouse A11y 96 (desktop & mobile v1) | [HISTORY.md](./performance/HISTORY.md) |
| **Performance** | Desktop Perf 99; mobile Perf 76; mobile LCP still above 2.5s gate | [BASELINE.md](./performance/BASELINE.md), [HISTORY.md](./performance/HISTORY.md) |
| **Localization** | en / ru / fa / ar via `landing-i18n.ts` | `apps/web/lib/landing-i18n.ts` |
| **Ambient experience** | WebGL ambient background retained; 460vh scroll hero removed | [HISTORY.md](./performance/HISTORY.md) |
| **Technical debt** | Mobile LCP; dual visual language (landing vs app); no `prefers-reduced-motion` | [known-inconsistencies.md](./design/ui-audit/known-inconsistencies.md), [mobile-lcp-analysis.md](./performance/mobile-lcp-analysis.md) |

---

## Performance

| Item | Detail |
|------|--------|
| **Baseline** | Desktop Perf 99, LCP 918ms, CLS 0.001; Mobile Perf 74, LCP 4816ms (FAIL gate) | [BASELINE.md](./performance/BASELINE.md) |
| **History** | Landing v1 improved or held all metrics; Three.js **KEEP** | [HISTORY.md](./performance/HISTORY.md) |
| **Regression policy** | No measurable regression vs baseline; DS-01/ADR-DS-002 cite same gate | ADR-DS-002 Principle 7 |
| **Known issues** | Mobile LCP > 2.5s (pre-existing); first-load JS ~575 KB baseline landing route | [BASELINE.md](./performance/BASELINE.md), [mobile-lcp-analysis.md](./performance/mobile-lcp-analysis.md) |

---

## Brand Assets

| Asset | Status |
|-------|--------|
| **Logo Version B** | LOCKED (DEC-0003) — master: `brand/metioro-master.svg`; app assets `/metioro-logo.svg`, `/metioro-logo-dark.svg` |
| **Production refinement** | **Pending** — logo/visual refinement noted as parallel work in Phase 2 platform notes (not a separate repo doc) |
| **UKIPO consultation** | **Pending** — **not recorded in repository documents** at authoring time; no `docs/` file found |

---

## Production

| Surface | Target | Config / notes |
|---------|--------|----------------|
| **Frontend** | Cloudflare Workers | `apps/web/wrangler.jsonc`, `deploy:cf` / `preview:cf` scripts |
| **Backend API** | Railway | `railway.toml`, `nixpacks.toml`, [DEPLOY.md](../apps/api/DEPLOY.md) |
| **Custom domain** | `metioro.com` | `apps/web/lib/brand.ts`, API CORS in `apps/api/src/main.py` |
| **Operational status** | Production deployment referenced in Phase 2 platform notes; local dev documented in [HANDOFF.md](../HANDOFF.md) | No live uptime dashboard in repo |

**Env:** Frontend expects `NEXT_PUBLIC_API_BASE` pointing to Railway API URL ([DEPLOY.md](../apps/api/DEPLOY.md)).

---

## Current Backlog

Approved or documented engineering work only (no new feature proposals):

| Work item | Source |
|-----------|--------|
| **Runtime semantic migration (DS-02 implementation)** | [ADR-DS-002](./governance/adr/ADR-DS-002-runtime-semantic-token-consumption.md) — after ADR acceptance |
| **Mobile LCP improvement** | [BASELINE.md](./performance/BASELINE.md), [mobile-lcp-analysis.md](./performance/mobile-lcp-analysis.md) |
| **Bundle optimization** | Baseline landing ~575 KB first-load JS; v1 reduced ~32 KB ([HISTORY.md](./performance/HISTORY.md)) |
| **`prefers-reduced-motion`** | Documented gap — [motion-inventory.md](./design/ui-audit/motion-inventory.md) |
| **Logo / visual refinement** | Parallel track; DEC-0003 direction locked |
| **Domain map → semantic token binding** | Registry Tier 3 violations |
| **Legacy `/dashboard` style isolation** | [known-inconsistencies.md](./design/ui-audit/known-inconsistencies.md) |
| **ADR-DS-001 / ADR-DS-002 acceptance + index registration** | [ADR_INDEX.md](./governance/ADR_INDEX.md) |

---

## Next Approved Sprint

### DS-02 — Runtime Semantic Token Consumption (Implementation)

**Authority:** [ADR-DS-002](./governance/adr/ADR-DS-002-runtime-semantic-token-consumption.md) (Proposed — implementation follows acceptance)

**Prerequisite:** ADR-DS-002 accepted; no new architectural decisions during implementation.

**Scope (as approved in ADR-DS-002):**

- Wire `BAND_STYLES`, `GPS_TONE_STYLES`, `BADGE_STYLES` to consume semantic tokens from [design-token-registry.md](./design/system/design-token-registry.md)
- **Migration principles:** MP-1 backward compatibility · MP-2 one runtime map at a time (`BADGE_STYLES` → `GPS_TONE_STYLES` → `BAND_STYLES`) · MP-3 one semantic category at a time · MP-4 easy rollback · MP-5 measurable visual parity · MP-6 registry-first · MP-7 no new literals during migration
- **Constraints:** Visual output unchanged; performance vs [BASELINE.md](./performance/BASELINE.md); existing `{ bg, border, text }` API shape may remain during transition
- **Out of scope for DS-02 architecture:** resolver module location, CSS vs TS resolution path, feature flags (implementation choices only)

**Success criteria (ADR-DS-002):** Engineering execution only — wire resolver, pick first map, screenshot + literal diff tests, register sub-tokens before binding, build + Lighthouse spot-check.

---

## Sprint & Workstream Status Registry

> **Maintenance:** Project owner updates this table when a sprint opens, closes, or changes status.
> **Rule:** No sprint or workstream may be treated as active without an explicit row here. Implicit status is forbidden ([GOVERNANCE.md](./governance/GOVERNANCE.md)).

| ID | Sprint / workstream | Status | Evidence |
|----|---------------------|--------|----------|
| **UI-AUDIT** | UI Audit — Step 0 Inspection | **CLOSED** | commit `2384ecc`; [ui-audit/README.md](./design/ui-audit/README.md); [DOCUMENT_STATUS.md](./DOCUMENT_STATUS.md) |
| **DS-01** | Design Token Registry authority | **CLOSED** | commit `72c6131`; [design-token-registry.md](./design/system/design-token-registry.md) |
| **LANDING-V1** | Landing Experience v1 | **CLOSED** | [performance/HISTORY.md](./performance/HISTORY.md) |
| **FTUE-INFRA** | Phase 1 — FTUE Infrastructure | **CLOSED** | tag `ftue-pipeline-complete` @ `d90f127` |
| **SPRINT-3A** | Question Library foundation | **CLOSED** | commit `aa2682b` |
| **SPRINT-3B** | Guided Question UI | **CLOSED** | commit `3050c8e` |
| **SPRINT-4A** | Unified ask resolution contract | **CLOSED** | commit `09e0c65` |
| **SPRINT-4B** | Decision request mapping layer | **CLOSED** | commit `48543f2` |
| **SPRINT-4C** | Decision execution readiness boundary | **CLOSED** | commit `2a94693` |
| **SPRINT-5A** | Deterministic decision engine facade | **CLOSED** | commit `b60bf68` |
| **SPRINT-5B** | Result runtime pipeline integration | **CLOSED** | commit `d90f127` |
| **ADR-DS-001** | Design System Architecture v1 | **PROPOSED** | [ADR-DS-001](./governance/adr/ADR-DS-001-design-system-architecture.md) |
| **ADR-DS-002** | Runtime Semantic Token Consumption | **PROPOSED** | [ADR-DS-002](./governance/adr/ADR-DS-002-runtime-semantic-token-consumption.md) |
| **DS-02** | DS-02 runtime token migration (implementation) | **OPEN** | Blocked on ADR-DS-002 acceptance |
| **ENG-HYGIENE** | Engineering hygiene (lint + CI gate) | **OPEN** | [ENGINEERING_READINESS.md](./ENGINEERING_READINESS.md) |
| **ONE-SENTENCE** | One Sentence Position proposal | **PROPOSED** | [one-sentence-position.md](./brand/one-sentence-position.md) |
| **PHASE-6A** | Backend Bridge | **PLANNED** | [ADR-0006](./adr/ADR-0006-Decision-API-Contract-v1.md) LOCKED |
| **PHASE-6B** | Decision Signal Experience & Explainability | **PLANNED** | Phase 6 sequence below |
| **PHASE-6C** | Evidence Pipeline | **PLANNED** | Phase 6 sequence below |

**Allowed status values:** `CLOSED` · `OPEN` · `PROPOSED` · `PLANNED` — no other value is valid.

---

## Sprint Log

### Phase 1 — FTUE Infrastructure (closed)

**Tag:** `ftue-pipeline-complete` @ `d90f127`

Phase 1 (FTUE Infrastructure) closed at tag ftue-pipeline-complete.

Sprint 5B closed — runtime now traverses the complete decision pipeline. Decision output intentionally remains unused until the Decision Engine runtime integration sprint. No user-visible behavior changed.

**UI Audit status:** CLOSED.
**Evidence:** commit 2384ecc; docs/design/ui-audit/README.md; docs/DOCUMENT_STATUS.md.
Open design-system ADRs and documented UI inconsistencies are separate workstreams and do not reopen the audit.

### Phase 6 sequencing (locked)

Phase 6 sequence:

6A — Backend Bridge: connect the existing facade boundary to FastAPI while keeping the real decision response unused by UI.

6B — Decision Signal Experience and Explainability: first user-visible consumption of the real decision response; Brand Constraint 4a uncertainty disclosure is a mandatory acceptance criterion.

6C — Evidence Pipeline: operationalize evidence hierarchy, provenance, and explainability evidence requirements.

---

## Current Phase

### Engineering Execution Phase

Governance foundation, UI audit, design inventory, token registry (DS-01), and design-system ADRs (proposed) define **what** to build and **how** tokens and runtime maps must behave. Future sprints should **implement** these approved structures — not introduce parallel architectures, new palette literals, or ad-hoc design decisions. New work registers in the Design Token Registry first; code follows.

---

## Guiding Principle

> **Every implementation must be traceable to an approved decision.**
> **No implementation may introduce a new architectural decision.**

Traceability chain: Constitution → Decision Log / ADR → Registry / Spec → Code.

---

## Document Index

| Domain | Entry point |
|--------|-------------|
| Governance | [governance/README.md](./governance/README.md) |
| Design system | [design/system/design-token-registry.md](./design/system/design-token-registry.md) |
| UI audit | [design/ui-audit/README.md](./design/ui-audit/README.md) |
| Performance | [performance/BASELINE.md](./performance/BASELINE.md) |
| Architecture | [architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md](./architecture/PHASE3_ARCHITECTURE_BLUEPRINT.md) |
| Brand (proposal) | [brand/one-sentence-position.md](./brand/one-sentence-position.md) |
| Handoff / dev | [HANDOFF.md](../HANDOFF.md) |
| Roadmap (legacy) | [ROADMAP.md](../ROADMAP.md) |

---

## Maintenance

**Maintainer:** Project owner.

Update this file when: a Decision Log entry reaches LOCKED; an ADR is Accepted or LOCKED; a sprint or workstream changes status in the registry table above; deployment or build status changes; or performance baseline is superseded.

Do not use this file to propose strategy or new ADRs. New ADRs belong in [ADR_INDEX.md](./governance/ADR_INDEX.md) through the Review Protocol ([GOVERNANCE.md](./governance/GOVERNANCE.md)).
