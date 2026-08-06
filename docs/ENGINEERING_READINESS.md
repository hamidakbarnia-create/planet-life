# Engineering Readiness Audit

> **Audit date:** 2026-07-07  
> **Branch context:** `governance-foundation`  
> **Scope:** Engineering readiness for continuous implementation work — analysis only, no code changes  
> **Governance:** Complete — this audit does not create governance, ADRs, or inventories

---

## Executive Summary

METIORO is **conditionally ready** for continuous engineering. The repository ships a working product: production builds pass, TypeScript is strict and clean at compile time, and automated tests are substantial on both tiers (167 API + 115 web unit tests). Design System DS-02 has a clear, documented execution path with visual regression infrastructure already in place.

**Primary blockers to continuous engineering** are operational, not architectural:

1. **ESLint fails** — 53 problems (46 errors, 7 warnings); not enforced in build
2. **No CI pipeline** — no `.github/workflows`; quality gates are manual
3. **Mobile LCP regression** — 4.8s vs 2.5s gate (pre-existing, release-risk on mobile)

The repo can support feature and design-system sprints today for developers who run checks locally. It **cannot yet support weekly production releases with confidence** until lint gates and CI are established.

**Recommended immediate sprint:** Engineering hygiene — lint remediation + minimal CI (build, lint, unit tests) — then DS-02 implementation per approved ADR-DS-002 migration principles.

---

## Overall Readiness Score

| Area | Score | Weight | Weighted |
|------|-------|--------|----------|
| Build health | 72 / 100 | 15% | 10.8 |
| Design system (DS-02) | 78 / 100 | 15% | 11.7 |
| Component architecture | 58 / 100 | 10% | 5.8 |
| Technical debt | 55 / 100 | 10% | 5.5 |
| Testing | 68 / 100 | 15% | 10.2 |
| Performance | 62 / 100 | 10% | 6.2 |
| Accessibility | 70 / 100 | 10% | 7.0 |
| Developer experience | 52 / 100 | 10% | 5.2 |
| Release readiness | 48 / 100 | 5% | 2.4 |
| **Overall** | **65 / 100** | | **65** |

**Rating:** **Conditionally Ready** — engineering work can proceed; production release cadence requires hygiene sprint first.

---

## Verification Results (2026-07-07)

Commands run locally on Windows (PowerShell):

| Check | Command | Result |
|-------|---------|--------|
| Production build | `npm run build` (apps/web) | **PASS** — compiled 23.2s, TypeScript 57s, 25 static routes |
| TypeScript | Included in `next build` | **PASS** — `strict: true` in tsconfig |
| Unit tests (web) | `npm run test` (Vitest) | **PASS** — 14 files, 115 tests, 70.6s |
| Unit tests (API) | `py -3.11 -m pytest apps/api/tests` | **PASS** — 167 tests collected |
| Lint | `npm run lint` (ESLint) | **FAIL** — 53 problems (46 errors, 7 warnings) |
| E2E / visual | Not run (requires dev server + Playwright runtime) | **Infrastructure present** |
| Pre-release script | `npm run test:pre-release` (root) | **Not verified** — Windows `.venv` path hardcoded |

### Build notes

- Next.js 16.2.6 (Turbopack) — middleware convention deprecated (proxy migration advisory; non-blocking)
- Landing `/` prerendered static (○)
- `.env.local` present during build (environment-specific)
- Reproducibility: **good** if Node 20+, Python 3.11, and `npm ci` / `pip install -r` followed; no lockfile issues observed

### Lint blocker breakdown (top rules)

| Rule | Approx. count | Primary files |
|------|---------------|---------------|
| `react-hooks/set-state-in-effect` | ~35 | `calendar/page.tsx`, `ask/page.tsx`, `profile/page.tsx`, `upgrade/page.tsx`, `pathfinder/page.tsx`, `world/page.tsx`, `vault/page.tsx`, `home/page.tsx` |
| `@typescript-eslint/no-explicit-any` | ~11 | `api/cities/route.ts`, `synastry-dashboard.ts`, `synastry-i18n.ts`, page files |
| `@typescript-eslint/no-unused-vars` | 7 warnings | `ask/page.tsx`, `relationship-profile-i18n.ts`, others |

**Impact:** Build does not run ESLint; errors accumulate silently. Blocks CI adoption.

---

## 1. Build Health

### Strengths

- Production build reliable (~2 min total on 7 workers)
- Strict TypeScript enabled; no compile errors
- Monorepo API imports `packages/astro_engine` via `repo_path.py` — no PYTHONPATH hack required
- Railway (`railway.toml`, `nixpacks.toml`) and Cloudflare (`wrangler.jsonc`, `deploy:cf`) deployment configs exist and are documented in `apps/api/DEPLOY.md`

### Blockers

| ID | Blocker | Severity |
|----|---------|----------|
| BH-1 | ESLint 46 errors — no enforced quality gate | **High** |
| BH-2 | No CI workflow | **High** |
| BH-3 | Root `test:pre-release` uses Windows-specific `.venv` path | **Medium** (cross-platform DX) |
| BH-4 | Middleware → proxy deprecation warning | **Low** |

### Deployment workflow

| Tier | Target | Config | Status |
|------|--------|--------|--------|
| Frontend | Cloudflare Workers | `opennextjs-cloudflare`, `wrangler.jsonc` | Scripts present; manual deploy |
| API | Railway | `railway.toml`, `nixpacks.toml`, Python 3.11 | Documented; watch patterns scoped to API + astro_engine |

**Gap:** No automated deploy pipeline; no staging environment definition in repo; `NEXT_PUBLIC_API_BASE` must be set manually post-Railway deploy.

---

## 2. Design System Readiness (DS-02)

**Verdict: Ready to execute** once ADR-DS-002 is accepted (governance prerequisite documented in MASTER_STATUS — not revisited here). Engineering prerequisites are in place.

### Runtime maps (Tier 3 — migration targets)

| Map | Module | Keys | Consumers |
|-----|--------|------|-----------|
| `BAND_STYLES` | `lib/calendar-scores.ts` | 5 (`green`, `yellow`, `orange`, `red`, `empty`) | `calendar/page.tsx`, `DailyBriefView.tsx`, `MonthHeatmapGrid.tsx` |
| `GPS_TONE_STYLES` | `lib/strategic-gps.ts` | 5 (same + `empty`) | `calendar/page.tsx` (GPS panel) |
| `BADGE_STYLES` | `lib/synergy.ts` | 3 (`aligned`, `caution`, `tension`) | `SynergyBadge.tsx`, `PeopleHomeRow.tsx`, `SynergyIntelligenceDashboard.tsx`, `people/page.tsx`, `people/[id]/page.tsx` |

All three maps use raw `#hex` and `rgba()` literals. Registry documents semantic targets and marks all as **violations** of ADR-DS-001 Principle 3.

### Semantic token usage (current state)

| Layer | Status |
|-------|--------|
| **Registry (Tier 1)** | `color.status.success/warning/caution/danger/neutral` defined with intended meanings |
| **CSS (`metioro-ui-v2.css`)** | Spacing, radius, glass, gold, text tokens via `--mio-*`; **no `--color-status-*` variables** |
| **Alert classes** | `.mio-alert--success/warning/info` — parallel status styling, not consumed by runtime maps |
| **Runtime maps** | **0% semantic consumption** — 100% inline literals |

### Remaining raw literals (DS-02 scope vs out-of-scope)

**In-scope (DS-02):** 3 presentation maps above — 13 unique literal clusters across success/warning/caution/danger/neutral with differing bg opacities (0.08 / 0.15 / 0.32).

**Out-of-scope (document, do not migrate in DS-02):**

| Source | Purpose |
|--------|---------|
| `lib/brand-theme.ts` | Tier 0 brand primitives (canonical) |
| `lib/profile-i18n.ts` | Zodiac sign colors (domain data) |
| `lib/oracle-questions.ts` | Module accent colors |
| `lib/natal-aspects.ts`, `lib/chart-insights.ts` | Aspect/element colors |
| `lib/world-i18n.ts` | World signal tones |
| `lib/cinematic-scenes.ts` | WebGL scene palette |
| Inline `style={{}}` across pages | ~400+ inline style usages repo-wide |

### Migration complexity assessment

| Factor | Assessment |
|--------|------------|
| **Blast radius** | Medium — maps feed inline styles on high-traffic scored surfaces (Calendar, Home, People) |
| **API shape** | Low risk — `{ bg, border, text }` shape can be preserved per MP-1 |
| **Opacity variants** | Medium — same hue, three bg alphas; MP-6 requires registering sub-tokens (`bgSubtle`, `bgStrong`) before binding |
| **Resolver** | **Not implemented** — ADR-DS-002 defers TS vs CSS resolution path; implementation sprint must choose (recommend: thin TS resolver reading registry constants — zero runtime cost if resolved at module init) |
| **Verification** | **Ready** — 78 visual baselines (`docs/design/VISUAL_REGRESSION.md`); Playwright `maxDiffPixelRatio: 0.005` |
| **Order** | ADR-DS-002 MP-2: `BADGE_STYLES` → `GPS_TONE_STYLES` → `BAND_STYLES` (smallest map first) |
| **Performance constraint** | MP-7 / Principle 7 — no bundle/render regression vs `docs/performance/BASELINE.md` |

**DS-02 readiness score: 78/100** — documentation and verification infrastructure complete; resolver and status CSS vars are the only missing implementation pieces.

---

## 3. Component Architecture

### Duplicated UI patterns (not separate components)

| Pattern | Locations | Issue |
|---------|-----------|-------|
| `.fc` / `.fi` font injection | `AppShell`, `LegalPageShell`, `login/page`, `dashboard/page`, `DisclaimerOnboarding` | Duplicated `<style>` blocks |
| Option/chip buttons | `SegmentControl` (ui/) vs Settings/Login inline chips | Shared primitive exists but not adopted |
| Page titles | `PageHeader` (Home) vs custom title blocks (Calendar, Ask, People, Vault, Upgrade) | Inconsistent header pattern |
| Footer | `SiteFooter` reused via `LandingFooter` wrapper | **Good** — thin wrapper only |
| Disclaimer family | `DisclaimerGate`, `DisclaimerOnboarding`, `ActionDisclaimer`, `ModuleDisclaimerBanner` | Intentional layering, not duplication |
| Score breakdown | `AnalysisResultBreakdown`, `ScoreBreakdownPanel` | Related but distinct surfaces |

### Large components (decomposition candidates)

| File | Lines | Concern |
|------|-------|---------|
| `app/upgrade/page.tsx` | ~1,482 | Pricing tiers, i18n, modals, localStorage — highest decomposition priority |
| `app/calendar/page.tsx` | ~1,070 | Month grid, hourly, GPS, ICS export, score fetching — mixed data + presentation |
| `app/profile/page.tsx` | ~911 | Birth chart form, natal wheel, settings overlap |
| `app/ask/page.tsx` | ~761 | Multi-step wizard, location picker, score display |
| `app/world/page.tsx` | ~749 | News/markets overlays, search modal |
| `components/NatalChart.tsx` | ~580 | SVG wheel rendering + interaction |
| `components/home/DailyBriefView.tsx` | ~467 | Score card + heatmap + cosmos — could split data hooks |

**Pattern:** Page-level components own fetching, i18n, layout, and presentation — no shared data hooks layer.

### Inconsistent patterns

| Area | Observation |
|------|-------------|
| **Styling** | `mio-glass` CSS system vs Tailwind arbitrary values vs inline `style={{}}` (64 inline styles in calendar alone) |
| **i18n** | ~13 domain i18n files; no shared translation loader pattern |
| **Loading** | Text swap ("Analyzing…") vs progress counter vs skeleton (dashboard legacy only) |
| **Empty states** | `mio-empty-state` (Profile) vs plain text elsewhere |

### Prop inconsistencies

- `AppShell` accepts optional `fontFamily` override; most pages omit it
- `GlassCard` / `MetricCard` / `CosmosCard` — overlapping card abstractions with different prop shapes
- `SynergyBadge` is thin wrapper; dashboard duplicates badge styling inline

### State management inconsistencies

| Pattern | Usage |
|---------|-------|
| `useState` + `useEffect` per page | Dominant — no global store |
| `localStorage` | Lang, profile, membership, disclaimer, calendar prefs, upgrade codes — **29 files** touch storage |
| Custom events | `planet-life-membership-changed` for cross-component sync |
| URL state | Minimal — mostly client-side step state (Ask, Login) |

**Risk:** Calendar, Ask, Profile each re-implement lang/profile hydration in `useEffect` — source of lint errors and subtle bugs.

---

## 4. Technical Debt (Engineering Only)

### Critical

| ID | Debt | Evidence |
|----|------|----------|
| TD-C1 | **No CI quality gate** | No `.github/workflows`; lint failures undetected in build |
| TD-C2 | **Mobile LCP 4.8s** | `docs/performance/BASELINE.md` — FAIL vs 2.5s gate |
| TD-C3 | **Score threshold divergence** | Backend `_rating()` (80/65/45/30) vs UI/ROADMAP bands (85/60/40) per `PHASE2_ARCHITECTURE_BASELINE.md` |

### High

| ID | Debt | Evidence |
|----|------|----------|
| TD-H1 | **ESLint 46 errors** | `react-hooks/set-state-in-effect` across major pages |
| TD-H2 | **Monolithic page components** | 5 pages >750 lines |
| TD-H3 | **Tier 3 maps bypass token registry** | DS-01 violations; silent palette drift risk |
| TD-H4 | **Dual visual language** | Landing editorial vs app cosmic interior (`known-inconsistencies.md`) |
| TD-H5 | **No `prefers-reduced-motion`** | App-wide gap; WebGL runs continuously on landing |

### Medium

| ID | Debt | Evidence |
|----|------|----------|
| TD-M1 | **Legacy `/dashboard`** | Orphan route, separate animation system, not in nav |
| TD-M2 | **Calendar grid keyboard access** | Click handlers on divs; a11y audit flags |
| TD-M3 | **No test coverage reporting** | Vitest config has no `coverage` threshold |
| TD-M4 | **E2E scope limited** | 1 e2e spec (chart wheel visual); no user-flow e2e |
| TD-M5 | **Inline style density** | ~400 `style={{}}` usages — maintenance drag |
| TD-M6 | **World/Settings mobile nav gap** | Desktop sidebar only — no bottom nav entry |

### Low

| ID | Debt | Evidence |
|----|------|----------|
| TD-L1 | **Middleware deprecation** | Next.js 16 proxy migration advisory |
| TD-L2 | **No `next/image`** | No Image component usage found — low impact currently (minimal image assets) |
| TD-L3 | **Root package.json Windows paths** | `test:pre-release` venv path |
| TD-L4 | **Duplicate navy tokens** | `#0B1736` vs `#060a14` paths (documented in registry) |
| TD-L5 | **create-next-app README** | `apps/web/README.md` boilerplate |

---

## 5. Testing

### Current infrastructure

| Layer | Framework | Count | Scope |
|-------|-----------|-------|-------|
| **API unit/integration** | pytest | 167 tests | Scoring, ephemeris, reasoning, pathfinder, facade parity, location roles |
| **Web unit** | Vitest + jsdom | 115 tests (14 files) | `lib/**`, selected `components/**` |
| **E2E** | Playwright (`e2e/`) | 1 spec × 5 fixtures | Chart wheel visual on `/dev/chart-test` |
| **Visual regression** | Playwright (`tests/visual/`) | 78 baselines | 12 routes × 2 langs × 4 viewports |
| **Accessibility** | Lighthouse (manual) | A11y 96 desktop/mobile v1 | No automated a11y test suite |
| **Coverage** | — | **Not configured** | No `vitest --coverage`; no pytest cov |

### Vitest scope gap

`vitest.config.ts` includes only `lib/**/*.test.ts` and `components/**/*.test.tsx` — **no `app/**` page tests**.

### Missing infrastructure

| Gap | Impact |
|-----|--------|
| CI test runner | Tests exist but not enforced on PR |
| Coverage thresholds | Unknown blind spots in pages and API routes |
| User-flow E2E | Login → profile → calendar → ask not automated |
| API contract tests from web | Frontend assumes response shapes; some guarded by `score-breakdown.test.ts` mirroring |
| Accessibility automation | axe-core / Playwright a11y not integrated |
| Performance CI | Lighthouse CI not wired |

### Strengths

- API test suite is **exceptionally thorough** for an astrology engine (multi-city, high latitude, historical TZ, sidereal, pathfinder divergence)
- Facade parity tests (`test_finance_route_parity.py`, `test_decision_engine_facade.py`) protect Phase 3 migration pattern
- Visual regression matrix is production-grade (RTL + 4 viewports)

---

## 6. Performance

### Bundle (landing `/` — from BASELINE)

| Metric | Value | Status |
|--------|-------|--------|
| First-load JS (uncompressed) | 575.7 KB | Baseline held |
| Desktop Perf / LCP | 99 / 918ms | PASS |
| Mobile Perf / LCP | 74 / 4816ms | **FAIL** |
| Three.js (lazy) | 476 KB uncompressed | Deferred from first paint ✓ |

### Dynamic imports

| Usage | Location |
|-------|----------|
| `next/dynamic` | `LandingHero.tsx` → `CinematicHero` (ssr: false) |
| **Gap** | App routes, NatalChart, heavy pages — no route-level code splitting observed |

### Client/server boundaries

- **43 `'use client'` files** — most app routes are client components (expected for interactive product)
- Landing `/` static prerender with client hydration for hero WebGL
- API routes: `cities`, `translate`, `world/markets`, `world/news` — server-side ✓

### Image optimization

- No `next/image` usage detected
- Brand logo SVG inline/component — acceptable
- Low risk at current asset volume

### Font loading

- `next/font/google` in `layout.tsx`: Geist, Sora, Vazirmatn, Cairo — **optimized** ✓
- App pages also inject Cinzel/Inter via `.fc`/`.fi` in AppShell — duplicate font path vs `next/font`
- 5 font families loaded — mobile LCP contributor (see `mobile-lcp-analysis.md`)

### Motion

- Continuous WebGL on landing (kept per baseline decision)
- `cinematic-scenes.ts` checks `prefers-reduced-motion` for WebGL — **landing only**
- App routes: no reduced-motion CSS rules
- Playwright visual tests use `reducedMotion: 'reduce'` — good for stable screenshots, not product a11y

### Known LCP risks

1. Font payload + disclaimer gate render on first paint
2. Client-heavy app shell hydration
3. Five Google font families
4. No image LCP element — likely text/font bound on mobile

---

## 7. Accessibility

### Strengths (Lighthouse A11y 96)

- Landing skip link with focus-reveal
- `aria-current="page"` on bottom nav
- `role="status"` on `AlertBanner`
- Form labels on Profile birth fields
- Semantic landmarks on landing and AppShell (`header`, `main`, `nav`)

### Gaps (from ui-audit + code review)

| Area | Status |
|------|--------|
| **Keyboard navigation** | Calendar day grid likely not keyboard-operable (div + onClick) |
| **Focus management** | No global `focus-visible` in shell CSS; modals — focus trap not verified |
| **ARIA live regions** | No `aria-live` for async score loading |
| **Reduced motion** | App CSS lacks `prefers-reduced-motion`; WebGL unchecked on app routes |
| **Contrast** | Gold on dark generally passes; muted text `rgba(255,255,255,0.42)` — monitor |
| **Semantic HTML** | Settings labels are styled `div`s; mixed heading hierarchy |
| **Skip link** | Landing only — app routes lack skip navigation |

---

## 8. Developer Experience

### Repository structure

```
planet-life/
├── apps/web/          # Next.js 16 frontend
├── apps/api/          # FastAPI + uvicorn
├── packages/
│   ├── astro_engine/  # Scoring core
│   └── decision_engine/ # Phase 3 facade
├── docs/              # Governance, design, performance
└── scripts/           # Astro compat, manual charts
```

**Clear monorepo layout.** Root-level legacy docs (`ROADMAP.md`, `HANDOFF.md`) coexist with `docs/` — navigable via `MASTER_STATUS.md`.

### Scripts

| Script | Location | Notes |
|--------|----------|-------|
| `npm run dev/build/test/lint` | apps/web | Complete |
| `npm run visual:baseline/diff` | apps/web | Visual regression |
| `npm run deploy:cf` | apps/web | Cloudflare |
| `npm run test:pre-release` | root | Full gate — Windows venv path |
| `py -3.11 -m pytest` | manual | API tests |

### Environment setup

| Requirement | Documented |
|-------------|------------|
| Node + npm | Implicit |
| Python 3.11 | `DEPLOY.md`, `.python-version` |
| `.env.local` | `NEXT_PUBLIC_API_BASE` for API |
| Playwright browsers | Required for e2e/visual — not in setup doc |

### CI readiness

**Not ready.** No workflow files. Recommended minimum pipeline:

1. `npm ci` + `npm run build` + `npm run lint` + `npm run test` (web)
2. `pip install` + `pytest` (api)
3. Optional: `npm run visual:diff` on design-system PRs

### Debugging workflow

- `ChartDevPanel` + `/dev/chart-test` for chart debugging ✓
- Lighthouse JSON artifacts committed for performance comparison ✓
- No structured logging/monitoring integration in repo

---

## 9. Release Readiness

### Can the repo support weekly production releases?

**Not yet with confidence.**

| Requirement | Status |
|-------------|--------|
| Automated build verification | Manual only |
| Lint gate | Failing |
| Test gate | Tests pass but not CI-enforced |
| Visual regression on design changes | Manual Playwright |
| Performance gate | Mobile LCP failing |
| Rollback strategy | Git revert; no feature flags in code |
| Staging environment | Not defined |
| Changelog / release notes | Governance CHANGELOG only — no release process |

### Release risks

1. **Lint-debt merges** — React effect patterns may cause hard-to-debug render loops
2. **Mobile performance** — shipping UI changes without Lighthouse check risks LCP regression
3. **Score threshold confusion** — UI/backend band mismatch could cause user-visible score changes if "fixed" without coordinated release
4. **Dual deploy** — Frontend (CF) + API (Railway) require coordinated env var updates
5. **No automated e2e** — user flows unprotected between releases

### Path to weekly releases

1. CI with build + lint + unit tests (1–2 days)
2. Fix or pragmatically suppress lint rules with tracking issue (3–5 days)
3. Lighthouse mobile check as release checklist item (ongoing)
4. Visual diff on DS-02 PRs (infrastructure exists)

---

## Engineering Strengths

1. **Scoring engine test depth** — 167 API tests covering ephemeris edge cases, location invariants, pathfinder divergence
2. **Production build stability** — Next.js 16 strict TypeScript, 25 routes, static landing
3. **Design token authority established** — DS-01 registry active; DS-02 path fully specified with MP-1–MP-7
4. **Visual regression matrix** — 78 baselines across RTL, mobile, tablet, desktop
5. **Deployment configs** — Railway + Cloudflare documented and scripted
6. **Facade migration pattern** — ADR-0005 implemented with parity tests
7. **Performance baseline discipline** — Desktop 99 Perf; artifacts committed; decision gates documented

---

## Engineering Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lint debt blocks CI adoption | High | High | Hygiene sprint |
| DS-02 visual regression miss | Medium | High | Use existing Playwright baselines per MP-5 |
| Mobile LCP worsens on app changes | Medium | High | Lighthouse gate on PRs touching layout/fonts |
| Monolithic page regressions | Medium | Medium | Incremental hook extraction when touching pages |
| Score threshold "fix" changes UX | Low | High | Coordinate UI + backend in single release |
| Cross-platform dev script failure | Medium | Low | Parameterize venv path in root package.json |

---

## Prioritized Implementation Backlog

Priority | ID | Work | Class | Est. effort
---------|-----|------|-------|------------
**P0** | ENG-01 | Add CI: web build + lint + vitest; API pytest | Infrastructure | 1–2 days
**P0** | ENG-02 | Remediate ESLint errors (effect setState pattern, `any` types) | Build health | 3–5 days
**P0** | ENG-03 | Mobile LCP investigation + first optimization pass | Performance | 3–5 days
**P1** | DS-02 | Runtime semantic token consumption (BADGE → GPS → BAND per MP-2) | Design system | 5–8 days
**P1** | ENG-04 | Register status opacity sub-tokens in registry (MP-6) | Design system | 0.5 day
**P1** | ENG-05 | Implement thin semantic resolver (module-init constants) | Design system | 1–2 days
**P2** | ENG-06 | Add Vitest coverage reporting + baseline threshold | Testing | 1 day
**P2** | ENG-07 | `prefers-reduced-motion` for app CSS + WebGL gate | Accessibility | 1–2 days
**P2** | ENG-08 | Calendar grid keyboard semantics | Accessibility | 1–2 days
**P2** | ENG-09 | Extract shared profile/lang hydration hook | Architecture | 2–3 days
**P3** | ENG-10 | Decompose `upgrade/page.tsx` | Architecture | 3–5 days
**P3** | ENG-11 | User-flow E2E (profile → calendar → ask) | Testing | 3–5 days
**P3** | ENG-12 | Score threshold alignment (UI + backend coordinated) | Correctness | 2–3 days
**P3** | ENG-13 | Cross-platform `test:pre-release` script | DX | 0.5 day
**P4** | ENG-14 | Legacy `/dashboard` isolation or removal | Cleanup | 1–2 days
**P4** | ENG-15 | Adopt `SegmentControl` in Settings/Login | Consistency | 1 day

*Effort estimates are engineering-only sizing for planning — not commitments.*

---

## Immediate Next Sprint Recommendation

### Sprint: Engineering Hygiene (ENG-01 + ENG-02)

**Why not DS-02 first?** DS-02 is well-prepared and has visual regression coverage, but:

- ESLint currently reports **46 errors** that will fail any standard CI pipeline
- Without CI, DS-02 visual-parity PRs rely entirely on manual discipline
- The `react-hooks/set-state-in-effect` pattern is concentrated in the same pages DS-02 touches (Calendar, Home, People)

**Sprint goal:** Make the repository **CI-green** on build, lint, and unit tests.

**Scope:**

1. Add GitHub Actions (or equivalent) workflow: `apps/web` build + lint + vitest; `apps/api` pytest with Python 3.11
2. Refactor page-level `useEffect` hydration to event-driven or initial-state patterns (calendar, ask, profile priority)
3. Replace `any` in `synastry-dashboard.ts`, `synastry-i18n.ts`, `api/cities/route.ts`
4. Parameterize root `test:pre-release` for cross-platform venv discovery

**Exit criteria:**

- `npm run lint` exits 0
- CI pipeline green on default branch
- No product behavior change (refactor-only)

**Following sprint:** **DS-02** — migrate `BADGE_STYLES` first (3 keys, 5 consumers, smallest blast radius); visual diff against 78 baselines; Lighthouse spot-check per ADR-DS-002 Principle 7.

---

## Appendix: DS-02 Consumer Map

```
BADGE_STYLES (lib/synergy.ts)
  ├── components/SynergyBadge.tsx
  ├── components/PeopleHomeRow.tsx
  ├── components/SynergyIntelligenceDashboard.tsx
  ├── app/people/page.tsx
  └── app/people/[id]/page.tsx

GPS_TONE_STYLES (lib/strategic-gps.ts)
  └── app/calendar/page.tsx (GPS month/week panel)

BAND_STYLES (lib/calendar-scores.ts)
  ├── app/calendar/page.tsx (month/hour cells)
  ├── components/home/DailyBriefView.tsx
  └── components/home/MonthHeatmapGrid.tsx
```

---

*This document is the output of the Engineering Readiness Audit. No code, governance, or architecture was modified.*
