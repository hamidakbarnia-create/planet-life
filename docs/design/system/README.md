# METIORO Design System Inventory v1

> **Status:** Complete (inventory only)  
> **Authority:** Design System Inventory Sprint  
> **Date:** 2026-07-07  
> **Input:** [UI Audit Step 0](../ui-audit/README.md)

---

## Purpose

Document **what already exists** in the METIORO application design layer before any normalization, refactoring, or system consolidation.

This sprint is an inventory. It is not a redesign.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| CSS custom properties in `globals.css`, `metioro-ui-v2.css`, `metioro-shell.css` | Proposed token merges |
| TypeScript tokens in `lib/brand-theme.ts` | Renaming or aliasing |
| Runtime style objects (`BAND_STYLES`, `TIER_THEME`, etc.) | CSS or component changes |
| Reusable React components in `apps/web/components/` | Visual experimentation |
| Tailwind utility usage observed in components | Design proposals |

**No source code was modified.**

---

## Token Sources (as-is)

| Source file | Token families |
|-------------|----------------|
| `apps/web/app/globals.css` | Background, foreground, input, brand CSS vars, RTL typography |
| `apps/web/app/metioro-ui-v2.css` | `--mio-*` spacing, radius, glass, typography, alerts, segments, grids |
| `apps/web/app/metioro-shell.css` | `--metioro-*` shell geometry, nav, header, sidebar, bottom nav |
| `apps/web/lib/brand-theme.ts` | `COLORS`, `COLORS_RGBA`, `GRADIENTS`, `TYPOGRAPHY`, `TIER_THEME`, `SURFACES` |
| `apps/web/lib/calendar-scores.ts` | `BAND_STYLES` |
| `apps/web/lib/strategic-gps.ts` | `GPS_TONE_STYLES` |
| `apps/web/lib/synergy.ts` | `BADGE_STYLES` |
| Inline / Tailwind | Page-local values (documented where observed; not normalized) |

---

## Document Index

| File | Contents |
|------|----------|
| [design-token-inventory.md](./design-token-inventory.md) | Master token index across all sources |
| [typography-token-inventory.md](./typography-token-inventory.md) | Font families, type scale, language overrides |
| [spacing-inventory.md](./spacing-inventory.md) | Spacing scale, gaps, padding, layout rhythm |
| [color-token-inventory.md](./color-token-inventory.md) | Colors grouped by role (duplicates preserved) |
| [radius-shadow-inventory.md](./radius-shadow-inventory.md) | Border radii and box shadows |
| [motion-token-inventory.md](./motion-token-inventory.md) | Durations, easing, transitions, animations |
| [component-catalog.md](./component-catalog.md) | Reusable components with variants and usage |

---

## Relationship to UI Audit

This inventory implements the UI Audit findings as structured design-system documentation:

- Glass card variants (`mio-glass--*`) → component-catalog + color-token-inventory
- Token drift (navy, gold, amber) → documented in color-token-inventory **without merge**
- Ad-hoc chip controls vs `SegmentControl` → component-catalog
- FA typography overrides → typography-token-inventory
- Legacy `/dashboard` motion → motion-token-inventory

See [known-inconsistencies.md](../ui-audit/known-inconsistencies.md) for the full inconsistency record. This sprint does not resolve them.

---

## What This Answers

**What already exists?**

- Three parallel token layers: `globals` → `mio` (UI v2) → `metioro` (shell), plus `brand-theme.ts` and per-domain runtime palettes.
- Six `GlassCard` variants backed by CSS modifier classes.
- ~40 reusable component files under `apps/web/components/`.
- Score/status colors defined separately in `BAND_STYLES`, `GPS_TONE_STYLES`, and `BADGE_STYLES`.

**What should change?**

- Out of scope for this sprint.

---

## Governance

- No locked brand or product decisions reopened.
- No hero, constitutional sentence, or positioning copy altered.
- Documentation only.
