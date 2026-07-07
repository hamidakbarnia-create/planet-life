# Design Token Registry

> **Status:** ACTIVE — Canonical Design Token Authority  
> **Sprint:** DS-01 — Establish Token Authority  
> **Governed by:** [ADR-DS-001](../../governance/adr/ADR-DS-001-design-system-architecture.md)  
> **Date:** 2026-07-07  
> **Supersedes:** Provisional authority of [design-token-inventory.md](./design-token-inventory.md) (now historical)

---

## Authority

This document is the **single Design Token Authority** for METIORO.

| Rule | Requirement |
|------|-------------|
| New tokens | Must be registered here before use in code |
| Token changes | Update this registry in the same change |
| Historical record | [Design System Inventory](./README.md) files remain read-only snapshots |
| Architecture | Four-tier hierarchy per ADR-DS-001 |

**This sprint does not rename, delete, merge, or change token values** (except resolving `--mio-body-sm` via safe alias).

---

## Hierarchy (ADR-DS-001)

```
Tier 0 — Brand Primitive     Locked palette (brand-theme.ts, globals brand vars)
Tier 1 — Semantic            Role-based meaning (text.muted, status.success, spacing.md)
Tier 2 — Component           Scoped to UI pattern (glass.border, alert.warning.bg, nav.header.h)
Tier 3 — Domain Presentation Maps bind domain keys → presentation (BAND_STYLES.green)
```

### Ownership model

| Owner | Governs | Source modules |
|-------|---------|----------------|
| **Brand** | Tier 0 primitives, gradients, tier themes | `brand-theme.ts`, `globals.css` brand vars |
| **UI** | Tier 1–2 delivery via `--mio-*` | `metioro-ui-v2.css` |
| **Shell** | Tier 2 chrome geometry | `metioro-shell.css` |
| **Component** | Tier 2 CSS classes + React primitives | `components/ui/`, `mio-*` classes |
| **Domain** | Tier 3 presentation maps | `calendar-scores.ts`, `strategic-gps.ts`, `synergy.ts` |
| **Temporary Legacy** | Unregistered ad-hoc values | `/dashboard`, page inline styles |

### Lifecycle status

| Status | Meaning |
|--------|---------|
| **ACTIVE** | In production use; registered |
| **LEGACY** | In production but scheduled for isolation; do not extend |
| **UNDEFINED** | Referenced without definition — must be resolved |

---

## Tier 0 — Brand Primitives

Locked under [BRAND_IDENTITY_STANDARD.md](../../governance/BRAND_IDENTITY_STANDARD.md). Do not alter without constitutional process.

### `COLORS` (`lib/brand-theme.ts`)

| Token | Value | Semantic role | Owner | Status |
|-------|-------|---------------|-------|--------|
| `COLORS.royalBlue` | `#305CDE` | `color.brand.royalBlue` | Brand | ACTIVE |
| `COLORS.navy` | `#0B1736` | `color.brand.navy` | Brand | ACTIVE |
| `COLORS.white` | `#FFFFFF` | `color.brand.white` | Brand | ACTIVE |
| `COLORS.lightGray` | `#F6F8FC` | `color.brand.lightGray` | Brand | ACTIVE |
| `COLORS.gray` | `#E6EAF1` | `color.brand.gray` | Brand | ACTIVE |
| `COLORS.charcoal` | `#1A2333` | `color.brand.charcoal` | Brand | ACTIVE |
| `COLORS.black` | `#0A0F1C` | `color.brand.black` | Brand | ACTIVE |
| `COLORS.goldHighlight` | `#F2CF75` | `color.brand.goldHighlight` | Brand | ACTIVE |
| `COLORS.goldMain` | `#D4AF37` | `color.brand.goldMain` | Brand | ACTIVE |
| `COLORS.goldShadow` | `#B59410` | `color.brand.goldShadow` | Brand | ACTIVE |

### `globals.css` brand mirrors

| Token | Value | Maps to semantic | Owner | Status |
|-------|-------|------------------|-------|--------|
| `--background` | `#0A0F1C` | `color.surface.app` | Brand | ACTIVE |
| `--foreground` | `#F6F8FC` | `color.text.primary` | Brand | ACTIVE |
| `--accent` | `#305CDE` | `color.brand.royalBlue` | Brand | ACTIVE |
| `--brand-royal-blue` | `#305CDE` | `color.brand.royalBlue` | Brand | ACTIVE |
| `--brand-navy` | `#0B1736` | `color.brand.navy` | Brand | ACTIVE |
| `--brand-gold` | `#D4AF37` | `color.brand.goldMain` | Brand | ACTIVE |
| `--brand-gold-highlight` | `#F2CF75` | `color.brand.goldHighlight` | Brand | ACTIVE |
| `--brand-charcoal` | `#1A2333` | `color.brand.charcoal` | Brand | ACTIVE |
| `--brand-black` | `#0A0F1C` | `color.brand.black` | Brand | ACTIVE |

### Input primitives

| Token | Value | Semantic role | Owner | Status |
|-------|-------|---------------|-------|--------|
| `--input-bg` | `#1A2333` | `color.surface.input` | Brand | ACTIVE |
| `--input-border` | `rgba(230,234,241,0.12)` | `color.border.input` | Brand | ACTIVE |
| `--input-text` | `#F6F8FC` | `color.text.input` | Brand | ACTIVE |
| `--input-placeholder` | `rgba(246,248,252,0.35)` | `color.text.placeholder` | Brand | ACTIVE |

### `COLORS_RGBA` (Brand primitive alphas)

All keys in `brand-theme.ts` `COLORS_RGBA` are **Tier 0** — Owner: **Brand**, Status: **ACTIVE**. Full value list in [design-token-inventory.md](./design-token-inventory.md).

### `GRADIENTS` (Brand primitive)

All keys in `GRADIENTS` are **Tier 0** — Owner: **Brand**, Status: **ACTIVE**.

### `TYPOGRAPHY` (Brand primitive stacks)

| Token | Owner | Status |
|-------|-------|--------|
| `TYPOGRAPHY.brand` | Brand | ACTIVE |
| `TYPOGRAPHY.body` | Brand | ACTIVE |
| `TYPOGRAPHY.bodyRtl` | Brand | ACTIVE |
| `TYPOGRAPHY.bodyAr` | Brand | ACTIVE |
| `TYPOGRAPHY.mono` | Brand | ACTIVE |
| `--font-sora` | Brand | ACTIVE |
| `--font-geist-sans` | Brand | ACTIVE |
| `--font-geist-mono` | Brand | ACTIVE |
| `--font-vazirmatn` | Brand | ACTIVE |
| `--font-cairo` | Brand | ACTIVE |

---

## Tier 1 — Semantic Tokens

Semantic IDs describe **role**. Physical tokens below are current delivery bindings (not renamed).

### Color — surfaces

| Semantic ID | Physical token(s) | Value(s) | Owner | Status |
|-------------|-------------------|----------|-------|--------|
| `color.surface.app` | `--background`, `COLORS.black`, `.metioro-shell` bg | `#0A0F1C` / `#0a0f1c` | Brand/UI | ACTIVE |
| `color.surface.appDeep` | `--mio-navy-deep` | `#030508` | UI | ACTIVE |
| `color.surface.appMid` | `--mio-navy`, `--metioro-navy` | `#060a14` | UI/Shell | ACTIVE |
| `color.surface.appMidAlt` | `--metioro-navy-mid` | `#0b1736` | Shell | ACTIVE |
| `color.surface.brandNavy` | `--brand-navy`, `COLORS.navy` | `#0B1736` | Brand | ACTIVE |
| `color.surface.glass` | `--mio-glass-bg` | `rgba(8,14,28,0.72)` | UI | ACTIVE |
| `color.surface.glassSecondary` | `.mio-glass--secondary` | `rgba(255,255,255,0.025)` | UI | ACTIVE |
| `color.surface.input` | `--input-bg` | `#1A2333` | Brand | ACTIVE |

### Color — text

| Semantic ID | Physical token(s) | Value | Owner | Status |
|-------------|-------------------|-------|-------|--------|
| `color.text.primary` | `--foreground`, `--mio-text-body` | `#F6F8FC` / `rgba(255,255,255,0.88)` | Brand/UI | ACTIVE |
| `color.text.muted` | `--mio-text-muted` | `rgba(255,255,255,0.42)` | UI | ACTIVE |
| `color.text.subtitle` | `.mio-page-header__subtitle` | `rgba(255,255,255,0.48)` | UI | ACTIVE |
| `color.text.placeholder` | `--input-placeholder` | `rgba(246,248,252,0.35)` | Brand | ACTIVE |
| `color.text.proAccent` | `SURFACES.signInText`, tier pro | `#93B4FF` | Brand | ACTIVE |

### Color — accent

| Semantic ID | Physical token(s) | Value | Owner | Status |
|-------------|-------------------|-------|-------|--------|
| `color.accent.primary` | `--accent`, `COLORS.royalBlue` | `#305CDE` | Brand | ACTIVE |
| `color.accent.premium` | `--mio-gold`, `--metioro-gold`, `--brand-gold`, `COLORS.goldMain` | `#D4AF37` | Brand/UI/Shell | ACTIVE |
| `color.accent.premiumSoft` | `--mio-gold-soft`, `--metioro-gold-soft` | `rgba(212,175,55,0.22)` | UI/Shell | ACTIVE |
| `color.accent.premiumHighlight` | `COLORS.goldHighlight` | `#F2CF75` | Brand | ACTIVE |
| `color.accent.glowBlue` | `--mio-blue-glow` | `rgba(48,92,222,0.35)` | UI | ACTIVE |

### Color — status (intended semantics)

| Semantic ID | Intended meaning | Physical sources (duplicate) | Owner | Status |
|-------------|------------------|------------------------------|-------|--------|
| `color.status.success` | Positive score / aligned / golden | `#4ade80`, `rgba(74,222,128,*)` | Domain/UI | ACTIVE |
| `color.status.warning` | Caution / mid score | `#fbbf24`, `rgba(251,191,36,*)` | Domain/UI | ACTIVE |
| `color.status.caution` | Elevated caution | `#fb923c`, `rgba(251,146,60,*)` | Domain | ACTIVE |
| `color.status.danger` | Negative score / tension | `#f87171`, `rgba(248,113,113,*)` | Domain | ACTIVE |
| `color.status.neutral` | Empty / no signal | `rgba(255,255,255,0.03–0.45)` | Domain | ACTIVE |
| `color.status.info` | Informational alert | `rgba(48,92,222,0.1)` | UI | ACTIVE |

### Spacing semantics

| Semantic ID | Physical token | Value | Owner | Status |
|-------------|----------------|-------|-------|--------|
| `spacing.xs` | `--mio-space-1` | `4px` | UI | ACTIVE |
| `spacing.sm` | `--mio-space-2` | `8px` | UI | ACTIVE |
| `spacing.md` | `--mio-space-3` | `12px` | UI | ACTIVE |
| `spacing.lg` | `--mio-space-4` | `16px` | UI | ACTIVE |
| `spacing.xl` | `--mio-space-5` | `20px` | UI | ACTIVE |
| `spacing.2xl` | `--mio-space-6` | `24px` | UI | ACTIVE |

### Radius semantics

| Semantic ID | Physical token | Value | Owner | Status |
|-------------|----------------|-------|-------|--------|
| `radius.sm` | `--mio-radius-sm` | `10px` | UI | ACTIVE |
| `radius.md` | `--mio-radius-md` | `14px` | UI | ACTIVE |
| `radius.lg` | `--mio-radius-lg` | `18px` | UI | ACTIVE |
| `radius.xl` | `--mio-radius-xl` | `22px` | UI | ACTIVE |
| `radius.pill` | Tailwind `rounded-full` / `9999px` | full | UI | ACTIVE |

### Typography semantics

| Semantic ID | Physical token | LTR default | Owner | Status |
|-------------|----------------|-------------|-------|--------|
| `type.label` | `--mio-label` | `9px` | UI | ACTIVE |
| `type.caption` | `--mio-caption` | `11px` | UI | ACTIVE |
| `type.body` | `--mio-body` | `13px` | UI | ACTIVE |
| `type.bodySm` | `--mio-body-sm` | `var(--mio-body)` alias | UI | ACTIVE |
| `type.value` | `--mio-value` | `15px` | UI | ACTIVE |
| `type.heading.sm` | `--mio-heading-sm` | `0.7rem` | UI | ACTIVE |
| `type.heading.md` | `--mio-heading-md` | `1.125rem` | UI | ACTIVE |
| `type.heading.lg` | `--mio-heading-lg` | `1.35rem` | UI | ACTIVE |

### Motion semantics

| Semantic ID | Physical binding | Owner | Status |
|-------------|------------------|-------|--------|
| `motion.fast` | `0.15s ease` | UI/Shell | ACTIVE |
| `motion.normal` | `0.2s ease` | UI | ACTIVE |
| `motion.slow` | `600ms ease-out` | UI | ACTIVE |
| `motion.vaultLock` | `0.4s opacity` | Temporary Legacy | ACTIVE |

---

## Tier 2 — Component Tokens

### Shell (`metioro-shell.css`) — Owner: Shell

| Token | Value | Component | Status |
|-------|-------|-----------|--------|
| `--metioro-sidebar-w` | `92px` | `nav.sidebar.width` | ACTIVE |
| `--metioro-header-h` | `84px` | `nav.header.height` | ACTIVE |
| `--metioro-mobile-nav-h` | `76px` | `nav.bottom.height` | ACTIVE |
| `--metioro-safe-top` | `env(safe-area-inset-top)` | `nav.safeArea.top` | ACTIVE |
| `--metioro-safe-bottom` | `env(safe-area-inset-bottom)` | `nav.safeArea.bottom` | ACTIVE |
| `--metioro-safe-left` | `env(safe-area-inset-left)` | `nav.safeArea.left` | ACTIVE |
| `--metioro-safe-right` | `env(safe-area-inset-right)` | `nav.safeArea.right` | ACTIVE |
| `.metioro-header-chip` padding | `7px 12px` | `header.chip.padding` | ACTIVE |
| Sidebar nav `border-radius` | `14px` | `nav.sidebar.itemRadius` | ACTIVE |
| Bottom nav indicator radius | `0 0 4px 4px` | `nav.bottom.activeIndicator` | ACTIVE |

### Glass system — Owner: UI / Component

| Class / token | Component role | Status |
|---------------|----------------|--------|
| `.mio-glass` | `glass.base` | ACTIVE |
| `.mio-glass--primary` | `glass.variant.primary` | ACTIVE |
| `.mio-glass--secondary` | `glass.variant.secondary` | ACTIVE |
| `.mio-glass--metric` | `glass.variant.metric` | ACTIVE |
| `.mio-glass--action` | `glass.variant.action` | ACTIVE |
| `.mio-glass--technical` | `glass.variant.technical` | ACTIVE |
| `.mio-glass--signature` | `glass.variant.signature` | ACTIVE |
| `--mio-glass-border` | `glass.border.default` | ACTIVE |
| `--mio-glass-shadow` | `glass.shadow.default` | ACTIVE |
| `--mio-glass-highlight` | `glass.highlight.inset` | ACTIVE |

### Alert — Owner: Component

| Class | Variant | Status |
|-------|---------|--------|
| `.mio-alert--warning` | `alert.warning` | ACTIVE |
| `.mio-alert--info` | `alert.info` | ACTIVE |
| `.mio-alert--success` | `alert.success` | ACTIVE |
| `.mio-alert__action` | `alert.actionLink` | ACTIVE |

### Segment — Owner: Component

| Class | Role | Status |
|-------|------|--------|
| `.mio-segment__option` | `segment.option` | ACTIVE |
| `.mio-segment__option--active` | `segment.option.active` | ACTIVE |
| `min-height: 44px` | `segment.option.minHeight` | ACTIVE |

### Page header — Owner: Component

| Class | Role | Status |
|-------|------|--------|
| `.mio-page-header` | `pageHeader.container` | ACTIVE |
| `.mio-page-header__eyebrow` | `pageHeader.eyebrow` | ACTIVE |
| `.mio-page-header__title` | `pageHeader.title` | ACTIVE |
| `.mio-page-header__subtitle` | `pageHeader.subtitle` | ACTIVE |

### Empty state — Owner: Component

| Class | Role | Status |
|-------|------|--------|
| `.mio-empty-state` | `emptyState.container` | ACTIVE |
| `.mio-empty-state__text` | `emptyState.text` | ACTIVE |

### Brand helpers — Owner: Brand (component delivery)

| Export | Component role | Status |
|--------|----------------|--------|
| `SURFACES.*` | `shell.surface.*` | ACTIVE |
| `TIER_THEME.*` | `tier.card.*` | ACTIVE |
| `tierBadgeStyle()` | `header.tierBadge` | ACTIVE |
| `VAULT_PILL_STYLE` | `header.vaultPill` | ACTIVE |
| `primaryCtaStyle()` | `button.cta` | ACTIVE |
| `focusRingStyle()` | `focus.ring` | ACTIVE |

### Temporary Legacy — component-level

| Source | Role | Owner | Status |
|--------|------|-------|--------|
| `/dashboard` `.fade-up`, `.shimmer` | Legacy analyze cards | Temporary Legacy | LEGACY |
| Settings inline chip `#fbbf24` | Settings option active | Temporary Legacy | LEGACY |
| Login `.login-input`, `.otp-input` | Login form | Temporary Legacy | LEGACY |
| World page inline `rgba(255,255,255,0.035)` | World cards | Temporary Legacy | LEGACY |
| Landing `bg-[#305CDE]` Tailwind | Landing CTA | Temporary Legacy | LEGACY |

---

## Tier 3 — Domain Presentation Maps

Domain modules own **when** a style applies. Per ADR-DS-001 Principle 3, maps must **eventually consume** Tier 1 semantic tokens — not define independent palettes.

### `BAND_STYLES` (`lib/calendar-scores.ts`)

| Domain key | Semantic target | Consumes registry? | Owner | Status |
|------------|-----------------|-------------------|-------|--------|
| `green` | `color.status.success` | **NO** — raw `#4ade80`, `rgba(74,222,128,0.32)` | Domain | ACTIVE |
| `yellow` | `color.status.warning` | **NO** — raw `#fbbf24` | Domain | ACTIVE |
| `orange` | `color.status.caution` | **NO** — raw `#fb923c` | Domain | ACTIVE |
| `red` | `color.status.danger` | **NO** — raw `#f87171` | Domain | ACTIVE |
| `empty` | `color.status.neutral` | **NO** — raw rgba literals | Domain | ACTIVE |

**Violation:** All entries use inline hex/rgba. Refactor deferred to future ADR.

### `GPS_TONE_STYLES` (`lib/strategic-gps.ts`)

| Domain key | Semantic target | Consumes registry? | Owner | Status |
|------------|-----------------|-------------------|-------|--------|
| `green` | `color.status.success` | **NO** | Domain | ACTIVE |
| `yellow` | `color.status.warning` | **NO** | Domain | ACTIVE |
| `orange` | `color.status.caution` | **NO** | Domain | ACTIVE |
| `red` | `color.status.danger` | **NO** | Domain | ACTIVE |
| `empty` | `color.status.neutral` | **NO** | Domain | ACTIVE |

**Violation:** Independent literals; opacity differs from `BAND_STYLES` for same semantic.

### `BADGE_STYLES` (`lib/synergy.ts`)

| Domain key | Semantic target | Consumes registry? | Owner | Status |
|------------|-----------------|-------------------|-------|--------|
| `aligned` | `color.status.success` | **NO** | Domain | ACTIVE |
| `caution` | `color.status.warning` | **NO** | Domain | ACTIVE |
| `tension` | `color.status.danger` | **NO** | Domain | ACTIVE |

**Violation:** Independent literals; bg opacity differs from `BAND_STYLES` and `GPS_TONE_STYLES`.

---

## Duplicate Semantic Meanings

Documented only — **no consolidation in DS-01**.

### `color.accent.premium` (gold main)

| Physical token | Value | Owner |
|----------------|-------|-------|
| `--brand-gold` | `#D4AF37` | Brand |
| `--mio-gold` | `#d4af37` | UI |
| `--metioro-gold` | `#d4af37` | Shell |
| `COLORS.goldMain` | `#D4AF37` | Brand |

### `color.surface.appMid` (navy — **not identical**)

| Physical token | Value | Owner |
|----------------|-------|-------|
| `--brand-navy` / `COLORS.navy` | `#0B1736` | Brand |
| `--mio-navy` / `--metioro-navy` | `#060a14` | UI / Shell |
| `--metioro-navy-mid` | `#0b1736` | Shell |

### `color.status.success` (green — same hue, different alpha)

| Source | border/text | bg alpha |
|--------|-------------|----------|
| `BAND_STYLES.green` | `#4ade80` | `0.32` |
| `GPS_TONE_STYLES.green` | `#4ade80` | `0.08` |
| `BADGE_STYLES.aligned` | `#4ade80` | `0.15` |
| `mio-alert--success` | `rgba(74,222,128,0.24)` border | `0.08` bg |

### `color.status.warning` (amber)

| Source | Value context |
|--------|---------------|
| `BAND_STYLES.yellow` | `#fbbf24` |
| `GPS_TONE_STYLES.yellow` | `#fbbf24` |
| `BADGE_STYLES.caution` | `#fbbf24` |
| Settings active chip (inline) | `#fbbf24` |
| `mio-segment__option--active` | `#f2cf75` text (gold highlight — related semantic) |

### `color.surface.app` (black background)

| Source | Value |
|--------|-------|
| `--background` | `#0A0F1C` |
| `COLORS.black` | `#0A0F1C` |
| `.metioro-shell` | `#0a0f1c` |

---

## Runtime Map Compliance Summary

| Map | Location | Tier | Consumes semantic tokens? | Action |
|-----|----------|------|---------------------------|--------|
| `BAND_STYLES` | `calendar-scores.ts` | 3 | **Violates** ADR-DS-001 § Principle 3 | Documented; refactor in future ADR |
| `GPS_TONE_STYLES` | `strategic-gps.ts` | 3 | **Violates** | Documented; refactor in future ADR |
| `BADGE_STYLES` | `synergy.ts` | 3 | **Violates** | Documented; refactor in future ADR |
| `TIER_THEME` | `brand-theme.ts` | 0–2 | Partial — uses `COLORS`/`GRADIENTS` (Tier 0) | ACTIVE (compliant enough for Tier 0) |
| `SURFACES` | `brand-theme.ts` | 1–2 | Uses `COLORS_RGBA` | ACTIVE |

---

## DS-01 Implementation Notes

### Resolved: `--mio-body-sm`

| Before | After |
|--------|-------|
| UNDEFINED (invalid `var()` cascade) | `--mio-body-sm: var(--mio-body)` in `metioro-ui-v2.css` |

Safe alias per ADR-DS-001 — no visual intent change; restores valid CSS cascade.

### Code annotations added

Domain map files include DS-01 registry comments marking ADR-DS-001 Principle 3 compliance status. No logic changes.

---

## Registry Maintenance

| Event | Required action |
|-------|-----------------|
| New token in code | Add row to this registry first |
| Token deprecated | Set status LEGACY; do not delete row |
| Semantic duplicate found | Add to Duplicate Semantic Meanings section |
| Domain map refactor | Update Tier 3 compliance table |
| Sprint completes | Update inventory snapshot if needed (historical) |

---

## Related Documents

| Document | Role |
|----------|------|
| [ADR-DS-001](../../governance/adr/ADR-DS-001-design-system-architecture.md) | Target architecture |
| [Design System Inventory](./README.md) | Historical snapshot (pre-authority) |
| [design-token-inventory.md](./design-token-inventory.md) | Historical value index |
| [UI Audit](../ui-audit/README.md) | Evidence baseline |
| [Performance Baseline](../../performance/BASELINE.md) | Regression gate |
| [BRAND_IDENTITY_STANDARD.md](../../governance/BRAND_IDENTITY_STANDARD.md) | Tier 0 authority |

---

## Version History

| Date | Sprint | Change |
|------|--------|--------|
| 2026-07-07 | DS-01 | Initial registry — canonical authority established |
