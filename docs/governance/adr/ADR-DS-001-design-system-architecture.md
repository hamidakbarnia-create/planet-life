# ADR-DS-001: Design System Architecture v1

**Status:** Proposed  
**Date:** 2026-07-07  
**Decision makers:** METIORO Design & Platform Engineering (pending project owner approval)  
**Authority:** Architecture Decision Record — cross-cutting UX / frontend structure (Level 4 governance domain)

---

## Status

**Proposed**

This ADR defines the **target architecture** for METIORO's Design System. It does not implement, migrate, or visually change anything. Implementation belongs to future ADRs.

---

## Context

Step 0 UI Audit and Design System Inventory v1 documented the current application design layer as-is. The inventory is the factual baseline for this ADR. Full detail lives in linked documents — not duplicated here.

### Current state (summary)

| Layer | What exists today |
|-------|-------------------|
| **CSS custom properties** | Three parallel `:root` families: `globals.css` (brand/input), `metioro-ui-v2.css` (`--mio-*` UI primitives), `metioro-shell.css` (`--metioro-*` chrome geometry) |
| **TypeScript tokens** | `lib/brand-theme.ts` — `COLORS`, `COLORS_RGBA`, `GRADIENTS`, `TYPOGRAPHY`, `TIER_THEME`, `SURFACES`, style helpers |
| **Runtime style maps** | Domain palettes in `calendar-scores.ts` (`BAND_STYLES`), `strategic-gps.ts` (`GPS_TONE_STYLES`), `synergy.ts` (`BADGE_STYLES`) — each defines raw color values |
| **Ad-hoc styling** | Tailwind utilities, inline `style={{}}`, page-local patterns (Settings chips, Login, Upgrade, World, legacy `/dashboard`) |
| **Components** | ~42 reusable React components; 5 UI primitives in `components/ui/`; `mio-glass--*` CSS variant system |
| **Undefined tokens** | `--mio-body-sm` referenced in CSS without a `:root` definition |
| **Duplicate semantics** | Gold, navy, and green status colors defined in multiple sources with parallel names (e.g. `--brand-gold`, `--mio-gold`, `--metioro-gold`, `COLORS.goldMain`) |

### Established strengths (preserved by this ADR)

- `mio-glass` variant system is a workable component-surface pattern
- `brand-theme.ts` already functions as a partial brand token authority
- Score band semantics are shared across Calendar, Ask, and Home (even if defined in multiple places)
- FA/AR typography overrides are systematic in `metioro-ui-v2.css`
- Landing vs app visual separation is intentional (marketing chrome ≠ product chrome)

### Evidence documents

- [UI Audit README](../../design/ui-audit/README.md)
- [Design System Inventory README](../../design/system/README.md)
- [Design token inventory](../../design/system/design-token-inventory.md)
- [Component catalog](../../design/system/component-catalog.md)
- [Known inconsistencies](../../design/ui-audit/known-inconsistencies.md)

---

## Problem

The inventory reveals **architectural** problems — not visual defects. These problems make long-term Design System work costly and error-prone if left ungoverned.

### 1. Token ownership is unclear

No single document or module is declared the authority for design tokens. Contributors must discover tokens across CSS files, TypeScript exports, runtime maps, and Tailwind usage. The same semantic concept (gold accent, navy surface, success green) appears under different names in different layers.

### 2. Multiple token sources without hierarchy

Tokens are defined at the same conceptual level in:

- Global CSS (`--background`, `--brand-gold`)
- UI CSS (`--mio-gold`, `--mio-text-muted`)
- Shell CSS (`--metioro-gold`, `--metioro-header-h`)
- Brand TypeScript (`COLORS.goldMain`)
- Domain runtime maps (`BAND_STYLES.green.border`)

There is no documented rule for which layer may introduce a new color, when to use CSS vs TypeScript, or how layers relate.

### 3. Runtime / UI boundary is unclear

`BAND_STYLES`, `GPS_TONE_STYLES`, and `BADGE_STYLES` are **presentation tokens** co-located with **domain logic** (`calendar-scores.ts`, `synergy.ts`). They define palette values independently rather than referencing a shared semantic color system. Adding a new score surface requires editing domain modules instead of consuming a design token.

### 4. Component contract is inconsistent

`SegmentControl`, `PageHeader`, and `GlassCard` exist as primitives, but Settings, Login, and Upgrade implement parallel chip/card patterns with inline styles. Components sometimes consume CSS classes (`mio-glass--metric`), sometimes `brand-theme.ts` helpers, sometimes raw hex in `style={{}}`.

### 5. Maintenance and i18n risk

FA typography overrides are scoped in CSS; landing uses a separate font pipeline (`getLandingFontFamily`) from app (`AppShell` `.fc`/`.fi` injection). Without a declared architecture, typography ownership splits across three paths.

### 6. Undefined and drifting tokens

`--mio-body-sm` is referenced but undefined. Navy hex values differ between brand (`#0B1736`) and shell/ui (`#060a14`). These are symptoms of missing governance — not one-off bugs.

### 7. Dual visual languages without architectural boundary

Landing, app, login, and legacy dashboard each use different styling pipelines. The inventory documents this as observable fact; the architecture does not yet declare **which pipelines are first-class surfaces** and how they may diverge.

---

## Decision

METIORO adopts a **layered Design System architecture** with a single token authority, clear ownership, and strict consumption rules. Future Design System work must conform to this model.

**This decision names principles and layers only. It does not rename existing tokens, specify file moves, or define migration steps.**

### Principle 1 — Single design token authority

One governed **Design Token Registry** (Level 4 — UX Standards) is the authoritative catalog of all design tokens. Implementation may remain distributed during transition, but **new tokens may only be registered through this authority**. Ad-hoc hex values in pages are architectural violations after the registry exists.

Until the registry is authored, `docs/design/system/design-token-inventory.md` serves as the provisional catalog.

### Principle 2 — Semantic token hierarchy

Tokens are organized in four tiers. Lower tiers reference higher tiers; higher tiers never reference lower tiers.

```
Tier 0 — Brand primitives (locked)
    Locked brand palette from Brand Identity Standard / brand-theme.ts
    Examples: royal blue, gold main, navy, black (names unchanged)

Tier 1 — Semantic tokens
    Role-based names describing purpose, not appearance
    Examples: color.surface.primary, color.text.muted, color.accent.premium,
              color.status.success, spacing.section.gap

Tier 2 — Component tokens
    Tokens scoped to a component or pattern
    Examples: glass.border.default, alert.warning.bg, nav.active.indicator,
              segment.option.minHeight

Tier 3 — Domain presentation maps
    Runtime maps that bind domain semantics to Tier 1/2 tokens
    Examples: scoreBand.green → color.status.success,
              synergyBadge.caution → color.status.warning
```

**Rule:** Tier 0 values are governed by Brand Identity Standard (DEC-0003 logo, DEC-0004 tone). This ADR does not alter brand primitives.

### Principle 3 — Runtime style maps consume tokens; they do not define palette

`BAND_STYLES`, `GPS_TONE_STYLES`, `BADGE_STYLES`, and similar maps may retain their **API shape** but must eventually resolve colors through semantic tokens — not independent hex literals.

Domain modules own **when** a band applies; the Design System owns **how** it looks.

### Principle 4 — Components consume semantic or component tokens only

React components and CSS classes must not introduce new raw palette values. Allowed consumption paths:

| Consumer | May use |
|----------|---------|
| UI primitives (`GlassCard`, `AlertBanner`, etc.) | Component tokens + semantic tokens via CSS classes |
| App shell (`AppShell`, `BottomNav`) | Shell component tokens (`--metioro-*` category) referencing semantic tokens |
| Landing components | Marketing surface tokens — a declared sub-profile of semantic tokens |
| Page-local JSX | Only semantic/component tokens — no new `#hex` or `rgba()` literals |

Inline `style={{}}` remains permitted only where tokens are passed from governed helpers (e.g. `tierBadgeStyle`, `TIER_THEME`) during transition.

### Principle 5 — Clear ownership by layer

| Layer | Owner document / module | Governs |
|-------|---------------------------|---------|
| Brand primitives | `BRAND_IDENTITY_STANDARD.md`, `lib/brand-theme.ts` | Locked palette, gradients, tier themes |
| Semantic + component tokens | Design Token Registry (future Level 4) | Roles, spacing scale, motion, radii |
| CSS delivery | `metioro-ui-v2.css`, `metioro-shell.css`, `globals.css` | Maps tokens to classes — not source of new semantics |
| UI primitives | `components/ui/` | Reusable building blocks |
| Domain presentation | `lib/*-scores.ts`, `lib/synergy.ts` | Maps domain keys → semantic tokens |
| Page composition | Route pages | Layout only; defers to primitives |

### Principle 6 — Surface profiles (not unification)

Landing, authenticated app, login, and legal surfaces are **distinct surface profiles** under one system. They may use different semantic subsets (e.g. landing uses editorial spacing; app uses cosmic `mio-app-bg`). Unifying visuals is out of scope; unifying **token governance** is in scope.

### Principle 7 — Inventory-driven change only

All future token additions, consolidations, or component extractions must reference the Design System Inventory and update it. No silent token drift.

### What this decision does **not** do

- Does not rename `--mio-gold`, `--metioro-navy`, `COLORS.goldMain`, or any existing token
- Does not merge duplicate values
- Does not prescribe CSS file structure changes
- Does not require immediate refactors

---

## Alternatives Considered

### A) Keep current architecture

**Description:** Continue with three CSS files, `brand-theme.ts`, domain runtime maps, and ad-hoc page styles without a declared hierarchy.

| | |
|-|-|
| **Pros** | Zero transition cost; no documentation overhead |
| **Cons** | Token drift continues; new features copy nearest inline pattern; i18n and status colors stay duplicated; undefined tokens accumulate |
| **Verdict** | **Rejected.** Inventory proves the current model is workable for shipping but not maintainable at scale. Problems are architectural, not cosmetic. |

### B) Incremental consolidation toward layered token architecture

**Description:** Adopt the four-tier model in this ADR. Author Design Token Registry (Level 4). New work consumes semantic tokens; existing code migrates opportunistically via future ADRs.

| | |
|-|-|
| **Pros** | Respects locked brand decisions; preserves working UI; aligns with inventory without big-bang rewrite; enables phased ADRs (token registry, primitive adoption, domain map refactor) |
| **Cons** | Transitional period where old and new patterns coexist; requires discipline to avoid new ad-hoc tokens |
| **Verdict** | **Accepted.** This is the decision recorded in this ADR. |

### C) Complete redesign — new token naming, new CSS framework, unified visual language

**Description:** Replace `mio`/`metioro` naming, consolidate landing and app visuals, rebuild components on a new primitive set (e.g. full Tailwind design tokens or CSS-in-JS).

| | |
|-|-|
| **Pros** | Theoretically cleanest end state; single visual language |
| **Cons** | Reopens locked brand/logo/tone decisions; violates Rule 0; high regression risk; contradicts performance baseline constraints (e.g. landing WebGL, existing CSS weight); duplicates work already done in Landing v1 and UI v2 |
| **Verdict** | **Rejected.** Inventory shows sufficient reusable structure (`mio-glass`, primitives, `brand-theme.ts`). Problem is governance, not absence of design language. |

---

## Consequences

### Benefits

- **Clear authority** for where new tokens live and who owns them
- **Predictable consumption** — components and domain maps have defined rules
- **Safer i18n** — typography and spacing overrides can be registered once at semantic tier
- **Audit trail** — inventory becomes living registry; drift becomes detectable
- **Enables phased ADRs** — token registry authorship, primitive adoption, domain map binding, legacy dashboard isolation
- **Preserves locked brand** — Tier 0 remains subordinate to Brand Identity Standard

### Risks

- **Transition ambiguity** — during migration, two valid patterns may coexist; contributors need registry visibility
- **Registry lag** — if Level 4 document is delayed, provisional inventory may stale
- **Domain map refactor scope** — moving `BAND_STYLES` to semantic references touches multiple product surfaces
- **Surface profile complexity** — landing vs app profiles add taxonomy overhead

### Technical debt remaining (explicit)

| Debt item | Status after this ADR |
|-----------|----------------------|
| Duplicate gold/navy tokens | Documented; not merged until future ADR |
| `--mio-body-sm` undefined | Documented; fix deferred |
| `SegmentControl` vs ad-hoc chips | Documented; primitive adoption deferred |
| Legacy `/dashboard` styling | Isolated orphan; retirement deferred |
| No `prefers-reduced-motion` | Documented in motion inventory; deferred |
| `BAND_STYLES` in domain module | Consumption rule declared; refactor deferred |

### Future work enabled (not specified here)

- ADR: Design Token Registry authorship (Level 4 UX Standards)
- ADR: Semantic color tier definition
- ADR: Domain presentation map refactor (`BAND_STYLES` → semantic)
- ADR: UI primitive adoption (Settings/Login chip consolidation)
- ADR: Legacy dashboard style isolation or retirement
- ADR: Motion token governance (`prefers-reduced-motion`)

---

## Out of Scope

The following are explicitly **not** part of ADR-DS-001:

- Implementation of token registry files
- CSS, TypeScript, or component edits
- Token renaming or value changes
- Migration plans, timelines, or sequencing
- Visual redesign of any screen
- Landing hero, copy, or `landing-i18n.ts` changes
- Merging duplicate colors
- Refactoring `AppShell`, `GlassCard`, or domain modules
- Performance optimization work

Those belong to **future ADRs** after this architecture is accepted.

---

## Related Documents

### Design evidence

| Document | Path |
|----------|------|
| UI Audit | [docs/design/ui-audit/README.md](../../design/ui-audit/README.md) |
| Design System Inventory | [docs/design/system/README.md](../../design/system/README.md) |
| Design token inventory | [docs/design/system/design-token-inventory.md](../../design/system/design-token-inventory.md) |
| Component catalog | [docs/design/system/component-catalog.md](../../design/system/component-catalog.md) |
| Known inconsistencies | [docs/design/ui-audit/known-inconsistencies.md](../../design/ui-audit/known-inconsistencies.md) |

### Governance & brand

| Document | Path |
|----------|------|
| Governance README | [docs/governance/README.md](../README.md) |
| METIORO Constitution | [docs/governance/METIORO_CONSTITUTION.md](../METIORO_CONSTITUTION.md) |
| Brand Identity Standard | [docs/governance/BRAND_IDENTITY_STANDARD.md](../BRAND_IDENTITY_STANDARD.md) |
| Decision Log | [docs/governance/DECISION_LOG.md](../DECISION_LOG.md) |
| ADR Index | [docs/governance/ADR_INDEX.md](../ADR_INDEX.md) |

*Note: `docs/governance/DECISION_REGISTRY.md` referenced in sprint brief was not present at authoring time. Permanent decisions are registered in `DECISION_LOG.md`.*

### Performance

| Document | Path |
|----------|------|
| Performance baseline | [docs/performance/BASELINE.md](../../performance/BASELINE.md) |
| Performance history | [docs/performance/HISTORY.md](../../performance/HISTORY.md) |

### Existing ADRs

| ADR | Relevance |
|-----|-----------|
| [ADR-0003](../ADR_INDEX.md) (Logo — Proposed) | Tier 0 brand primitives |
| [ADR-0005](../../adr/ADR-0005-Decision-Engine-Facade-First-Runtime-Migration.md) | Precedent for phased, non-breaking architectural migration |

---

## Recommendation

**This ADR is recommended for approval.**

The UI Audit and Design System Inventory provide sufficient evidence that METIORO has reusable design structure but lacks governing architecture. Alternative B — incremental consolidation toward a layered token model — is the lowest-risk path that:

1. Honors Rule 0 and all locked brand decisions (DEC-0001, DEC-0003, DEC-0004)
2. Preserves shipping UI and performance baseline
3. Gives future Design System sprints a constitutional target without mandating immediate code change

Upon acceptance, this ADR should be:

1. Added to [ADR_INDEX.md](../ADR_INDEX.md) as `ADR-DS-001`
2. Registered in [DECISION_LOG.md](../DECISION_LOG.md) as an Operational or ADR-authority decision
3. Used as the governing reference for all subsequent Design System ADRs

Until accepted, the provisional inventory remains authoritative for **what exists**; this ADR is authoritative for **what architecture future work must follow**.

---

## Governance Review

| Check | Result |
|-------|--------|
| Rule 0 observed | No locked decision reopened; no brand/hero/copy changes |
| DEC-0001 (Personal Decision Intelligence) | Unaffected — product category unchanged |
| DEC-0003 (Logo B) | Tier 0 references logo direction; no logo change |
| DEC-0004 (Brand tone) | Semantic tier subordinate to brand; no tone change |
| Implementation | None — documentation only |

---

## Version History

| Date | Status | Summary |
|------|--------|---------|
| 2026-07-07 | Proposed | Initial architecture decision from UI Audit + Design Inventory |
